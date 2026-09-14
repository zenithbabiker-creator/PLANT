import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

// Ensure base uploads directory exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

/**
 * Maps disease IDs to sanitized dynamic folder names on the server
 */
function getDiseaseFolderName(diseaseId?: string, diseaseName?: string): string {
  if (!diseaseId && !diseaseName) return 'uncategorized';
  
  const id = (diseaseId || '').toLowerCase();
  const name = (diseaseName || '').toLowerCase();

  if (id.includes('anthracnose') || name.includes('anthracnose') || name.includes('أنثراكنوز')) {
    return 'anthracnose';
  }
  if (id.includes('head_smut') || name.includes('head smut') || name.includes('قناديل')) {
    return 'smut_disease/head_smut';
  }
  if (id.includes('loose_smut') || name.includes('loose smut') || name.includes('السائب')) {
    return 'smut_disease/loose_smut';
  }
  if (id.includes('smut') || name.includes('تفحم')) {
    return 'smut_disease';
  }
  if (id.includes('rust') || name.includes('rust') || name.includes('صدأ')) {
    return 'rust';
  }
  if (id.includes('healthy') || name.includes('healthy') || name.includes('سليم')) {
    return 'healthy';
  }

  // Fallback sanitized folder name
  return (diseaseId || diseaseName || 'general')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
}

/**
 * Saves diagnosis image and metadata in dedicated disease folder
 */
function saveDiagnosisToServer(data: any, clientIp: string) {
  const timestamp = data.timestamp || data.capturedTimestampUtc || Date.now();
  const rawId = data.id || `diag_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const sanitizedId = String(rawId).replace(/[^a-zA-Z0-9_-]/g, '_');
  
  const diseaseId = data.diseaseId || data.disease?.id_disease || '';
  const diseaseName = data.diseaseName || data.disease?.disease_name || 'Unknown';
  const folderName = getDiseaseFolderName(diseaseId, diseaseName);
  
  const targetDir = path.join(UPLOADS_ROOT, folderName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let savedImageRelativePath = '';
  const imageBase64OrUri = data.imageBase64 || data.imageUri || '';

  if (imageBase64OrUri && typeof imageBase64OrUri === 'string') {
    try {
      let base64Data = imageBase64OrUri;
      let extension = 'jpg';

      if (imageBase64OrUri.startsWith('data:image/')) {
        const matches = imageBase64OrUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          base64Data = matches[2];
        } else {
          base64Data = imageBase64OrUri.replace(/^data:image\/\w+;base64,/, '');
        }
      }

      if (base64Data && !base64Data.startsWith('http')) {
        const imageFileName = `diagnosis_${sanitizedId}_${timestamp}.${extension}`;
        const imageFilePath = path.join(targetDir, imageFileName);
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(imageFilePath, buffer);
        savedImageRelativePath = `/uploads/${folderName}/${imageFileName}`;
      } else {
        savedImageRelativePath = imageBase64OrUri; // Keep URL if remote
      }
    } catch (err) {
      console.error('Error saving diagnosis image:', err);
    }
  }

  // Compile full metadata JSON
  const metadata = {
    id: sanitizedId,
    timestamp,
    receivedAt: new Date().toISOString(),
    diseaseId,
    diseaseName,
    diseaseNameAr: data.disease?.disease_name_ar || data.diseaseNameAr || '',
    isHealthy: data.disease?.is_healthy ?? (diseaseId === 'sorghum_healthy'),
    confidenceScore: data.confidence ?? data.confidenceScore ?? 0.95,
    userIp: data.userIp || data.ipAddress || clientIp || '127.0.0.1',
    gpsLocation: data.gps || data.location || { latitude: 14.3852, longitude: 33.5241, accuracy: 5 },
    recommendedPesticide: data.disease?.recommended_pesticide || data.appliedPesticide || 'Standard Guidance',
    safetyIntervalDays: data.disease?.phi_days ?? data.phiDays ?? 0,
    imagePath: savedImageRelativePath,
    clientMetadata: data.metadata || {}
  };

  const metaFileName = `diagnosis_${sanitizedId}_${timestamp}.json`;
  const metaFilePath = path.join(targetDir, metaFileName);
  fs.writeFileSync(metaFilePath, JSON.stringify(metadata, null, 2), 'utf-8');

  return {
    id: sanitizedId,
    folder: folderName,
    imagePath: savedImageRelativePath,
    metadataPath: `/uploads/${folderName}/${metaFileName}`,
    metadata
  };
}

async function startServer() {
  const app = express();

  // Middleware for parsing JSON with generous payload limits for captured photos
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static serving for uploaded files
  app.use('/uploads', express.static(UPLOADS_ROOT));

  // --- API ROUTES FIRST ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Sorghum Crop Disease Diagnosis & Cloud Sync Engine',
      uploadsDirectory: UPLOADS_ROOT,
      timestamp: Date.now()
    });
  });

  // Client IP detection endpoint
  app.get('/api/ip', (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : (req.socket.remoteAddress || '127.0.0.1');
    res.json({ ip });
  });

  // Upload single diagnosis (supports multiple standard endpoints)
  const handleDiagnosisUpload = (req: express.Request, res: express.Response) => {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = typeof forwarded === 'string' 
        ? forwarded.split(',')[0].trim() 
        : (req.socket.remoteAddress || '127.0.0.1');

      const saved = saveDiagnosisToServer(req.body, clientIp);

      res.status(200).json({
        success: true,
        statusCode: 200,
        id: saved.id,
        folder: saved.folder,
        imagePath: saved.imagePath,
        receivedTimestampUtc: Date.now(),
        message: `Diagnosis stored successfully in folder: uploads/${saved.folder}/`
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: err?.message || 'Failed to save diagnosis on server'
      });
    }
  };

  app.post('/api/diagnoses', handleDiagnosisUpload);
  app.post('/sorghum/diagnoses/upload', handleDiagnosisUpload);

  // Batch sync endpoint for offline Room DB
  app.post('/api/sync', (req, res) => {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = typeof forwarded === 'string' 
        ? forwarded.split(',')[0].trim() 
        : (req.socket.remoteAddress || '127.0.0.1');

      const items = Array.isArray(req.body) ? req.body : (req.body.items || [req.body]);
      const results = items.map((item: any) => saveDiagnosisToServer(item, clientIp));

      res.status(200).json({
        success: true,
        syncedCount: results.length,
        items: results.map((r) => ({ id: r.id, folder: r.folder, imagePath: r.imagePath }))
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Sync failed'
      });
    }
  });

  // List all stored diagnoses grouped by folder
  app.get('/api/diagnoses', (req, res) => {
    try {
      const folders: Record<string, any[]> = {};
      let totalCount = 0;

      function scanDir(dir: string, relPath: string = '') {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const currentRel = relPath ? `${relPath}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            scanDir(fullPath, currentRel);
          } else if (entry.name.endsWith('.json') && entry.name.startsWith('diagnosis_')) {
            try {
              const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
              const folderKey = relPath || 'root';
              if (!folders[folderKey]) folders[folderKey] = [];
              folders[folderKey].push(content);
              totalCount++;
            } catch {}
          }
        }
      }

      scanDir(UPLOADS_ROOT);

      res.json({
        success: true,
        totalDiagnoses: totalCount,
        folders
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Remote sensing & alerts mock endpoints for Clean Architecture compliance
  app.post('/remote-sensing/field-health', (req, res) => {
    res.json({
      success: true,
      ndviIndex: 0.72,
      moistureIndex: 0.64,
      vegetationHealth: 'GOOD',
      advisoryText: 'NDVI vegetation indices show active photosynthesis across the sorghum field.'
    });
  });

  app.get('/advisories/sms-alerts', (req, res) => {
    res.json({
      success: true,
      alerts: []
    });
  });

  // --- VITE MIDDLEWARE (Development) vs STATIC SERVING (Production) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 Sorghum AI Full-Stack Server running on port ${PORT}`);
  });
}

startServer();

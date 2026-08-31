import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode, 
  Copy, 
  Check, 
  Code2, 
  Smartphone, 
  Cpu, 
  Database, 
  RefreshCw, 
  PlugZap,
  Box
} from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  category: 'ui' | 'data' | 'ml' | 'sync' | 'extension' | 'di' | 'assets' | 'locale';
  language: string;
  code: string;
  description: string;
}

export const ANDROID_FILES: CodeFile[] = [
  {
    path: 'app/src/main/java/org/sorghum/ai/ui/camera/CameraViewfinderScreen.kt',
    name: 'CameraViewfinderScreen.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'واجهة الكاميرا البصرية في Jetpack Compose مع إطار الألوان الأحمر/الأصفر/الأخضر للمزارعين',
    code: `package org.sorghum.ai.ui.camera

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.sorghum.ai.ml.DiagnosisStatus
import org.sorghum.ai.ui.viewmodel.CameraViewModel

/**
 * Screen designed specifically for low-literacy farmers.
 * Minimalist text, high-contrast visual indicators:
 * 🔴 RED: Disease Detected
 * 🟡 YELLOW: Blurry/Unclear Photo (Prompt retake)
 * 🟢 GREEN: Healthy Plant
 */
@Composable
fun CameraViewfinderScreen(
    viewModel: CameraViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    // Map Diagnosis status to Border Frame Color
    val frameColor by animateColorAsState(
        targetValue = when (uiState.diagnosisStatus) {
            DiagnosisStatus.DISEASED -> Color(0xFFDC2626) // 🔴 Red (Disease)
            DiagnosisStatus.BLURRY -> Color(0xFFF59E0B)   // 🟡 Yellow (Blurry)
            DiagnosisStatus.HEALTHY -> Color(0xFF10B981)  // 🟢 Green (Healthy)
            DiagnosisStatus.IDLE -> Color(0xFF94A3B8)     // Neutral Slate
        },
        animationSpec = tween(durationMillis = 350)
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 1. Top Status Banner (Visual Cue)
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)),
            color = frameColor
        ) {
            Row(
                modifier = Modifier.padding(vertical = 12.dp, horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                when (uiState.diagnosisStatus) {
                    DiagnosisStatus.DISEASED -> {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("تم اكتشاف مرض 🔴", color = Color.White, fontSize = 18.sp)
                    }
                    DiagnosisStatus.BLURRY -> {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color.Black)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("الصورة غير واضحة 🟡 أعد التصوير", color = Color.Black, fontSize = 18.sp)
                    }
                    DiagnosisStatus.HEALTHY -> {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("نبات سليم 🟢", color = Color.White, fontSize = 18.sp)
                    }
                    DiagnosisStatus.IDLE -> {
                        Text("وجّه الكاميرا نحو الورقة", color = Color.White, fontSize = 16.sp)
                    }
                }
            }
        }

        // 2. Main Camera Viewfinder with Dynamic Colored Frame
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp))
                .border(BorderStroke(8.dp, frameColor), shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp))
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            // CameraX Preview View is embedded here
            CameraPreviewComposable(
                onFrameCaptured = { bitmap ->
                    viewModel.onCaptureImage(bitmap)
                }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 3. Ultra-Large Capture Touch Button for Farmers
        Button(
            onClick = { viewModel.triggerCapture() },
            modifier = Modifier
                .size(width = 280.dp, height = 72.dp),
            shape = RoundedCornerShape(36.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
        ) {
            Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("افحص النبات", fontSize = 22.sp, color = Color.White)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/ui/phi/PhiCountdownComponent.kt',
    name: 'PhiCountdownComponent.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'مكون العداد التنازلي البصري لفترة الأمان (أيقونات علب المبيد المتكررة + علامة الصح الذهبية عند 0 يوم)',
    code: `package org.sorghum.ai.ui.phi

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.sorghum.ai.R

/**
 * Visual PHI (Pre-Harvest Interval) Countdown for Low-Literacy Farmers:
 * - Repeated pesticide spray can icons equal to remaining PHI days (e.g. 8 days = 8 spray cans)
 * - Decrements by 1 icon every 24 hours (8 -> 7 -> 6 ... 0)
 * - At 0 days: spray cans vanish completely, and a prominent GOLDEN checkmark (✓) appears.
 */
@Composable
fun PhiCountdownComponent(
    pesticideName: String,
    initialPhiDays: Int,
    remainingPhiDays: Int,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "المبيد الموصى به: $pesticideName",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFF1E293B)
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (remainingPhiDays <= 0) {
                // 🌾 HARVEST READY STATE (0 DAYS): Prominent Golden Checkmark (✓)
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(Color(0xFFFDE047), Color(0xFFD97706))
                            )
                        )
                        .border(4.dp, Color(0xFFFBBF24), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Safe to harvest",
                        modifier = Modifier.size(64.dp),
                        tint = Color(0xFF78350F)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "المحصول آمن وجاهز للحصاد الآن!",
                    color = Color(0xFF047857),
                    style = MaterialTheme.typography.titleLarge
                )
            } else {
                // ⚠️ ACTIVE COUNTDOWN: Repeated Spray Can Icons
                Text(
                    text = "الأيام المتبقية لأمان الحصاد: $remainingPhiDays يوم",
                    color = Color(0xFFD97706),
                    style = MaterialTheme.typography.bodyLarge
                )

                Spacer(modifier = Modifier.height(12.dp))

                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(initialPhiDays) { index ->
                        val isActive = index < remainingPhiDays
                        SprayCanIcon(isActive = isActive)
                    }
                }
            }
        }
    }
}

@Composable
fun SprayCanIcon(isActive: Boolean) {
    Box(
        modifier = Modifier
            .size(54.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isActive) Color(0xFFFEF3C7) else Color(0xFFF1F5F9))
            .border(
                1.5.dp,
                if (isActive) Color(0xFFF59E0B) else Color(0xFFCBD5E1),
                RoundedCornerShape(12.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            painter = painterResource(id = R.drawable.ic_pesticide_spray_can),
            contentDescription = null,
            tint = if (isActive) Color(0xFFD97706) else Color(0xFF94A3B8),
            modifier = Modifier.size(32.dp)
        )
    }
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/data/local/entity/DiseaseEntity.kt',
    name: 'DiseaseEntity.kt',
    category: 'data',
    language: 'kotlin',
    description: 'مخطط قاعدة البيانات المحلية (Room Entity) لجدول الأمراض والمبيدات وفترة الأمان',
    code: `package org.sorghum.ai.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * SQLite / Room Schema for Sorghum Crop Diseases
 */
@Entity(tableName = "diseases_table")
data class DiseaseEntity(
    @PrimaryKey
    @ColumnInfo(name = "id_المرض")
    val diseaseId: String,

    @ColumnInfo(name = "اسم_المرض")
    val diseaseName: String,

    @ColumnInfo(name = "اسم_المبيد")
    val pesticideName: String,

    @ColumnInfo(name = "أيام_فترة_الأمان")
    val phiDays: Int,

    @ColumnInfo(name = "is_healthy")
    val isHealthy: Boolean = false
)`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/data/local/entity/DiagnosisSyncQueueEntity.kt',
    name: 'DiagnosisSyncQueueEntity.kt',
    category: 'data',
    language: 'kotlin',
    description: 'مخطط طابور المزامنة المحلي (Room) مع إحداثيات الـ GPS والوقت والصورة',
    code: `package org.sorghum.ai.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room Entity for Offline Storage & Sync Queue with GPS Metadata
 */
@Entity(tableName = "sync_queue_table")
data class DiagnosisSyncQueueEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "image_file_path")
    val imageFilePath: String,

    @ColumnInfo(name = "disease_id")
    val diseaseId: String,

    @ColumnInfo(name = "gps_latitude")
    val gpsLatitude: Double,

    @ColumnInfo(name = "gps_longitude")
    val gpsLongitude: Double,

    @ColumnInfo(name = "timestamp")
    val timestamp: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "PENDING", // PENDING, SYNCED, FAILED

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0
)`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/data/local/dao/DiseaseDao.kt',
    name: 'DiseaseDao.kt',
    category: 'data',
    language: 'kotlin',
    description: 'واجهة الاستعلامات والعمليات لقاعدة البيانات المحلية (Room DAOs)',
    code: `package org.sorghum.ai.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import org.sorghum.ai.data.local.entity.DiagnosisSyncQueueEntity
import org.sorghum.ai.data.local.entity.DiseaseEntity

@Dao
interface DiseaseDao {
    @Query("SELECT * FROM diseases_table")
    fun getAllDiseases(): Flow<List<DiseaseEntity>>

    @Query("SELECT * FROM diseases_table WHERE \`id_المرض\` = :id LIMIT 1")
    suspend fun getDiseaseById(id: String): DiseaseEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDiseases(diseases: List<DiseaseEntity>)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue_table WHERE sync_status = 'PENDING' ORDER BY timestamp ASC")
    suspend fun getPendingSyncRecords(): List<DiagnosisSyncQueueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSyncRecord(record: DiagnosisSyncQueueEntity)

    @Update
    suspend fun updateSyncRecord(record: DiagnosisSyncQueueEntity)

    @Query("UPDATE sync_queue_table SET sync_status = 'SYNCED' WHERE id = :id")
    suspend fun markAsSynced(id: String)
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/data/local/SorghumDatabase.kt',
    name: 'SorghumDatabase.kt',
    category: 'data',
    language: 'kotlin',
    description: 'فئة قاعدة البيانات الرئيسية Room Database مع التجهيز الأولي للبيانات',
    code: `package org.sorghum.ai.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import org.sorghum.ai.data.local.dao.DiseaseDao
import org.sorghum.ai.data.local.dao.SyncQueueDao
import org.sorghum.ai.data.local.entity.DiagnosisSyncQueueEntity
import org.sorghum.ai.data.local.entity.DiseaseEntity

@Database(
    entities = [DiseaseEntity::class, DiagnosisSyncQueueEntity::class],
    version = 1,
    exportSchema = false
)
abstract class SorghumDatabase : RoomDatabase() {
    abstract fun diseaseDao(): DiseaseDao
    abstract fun syncQueueDao(): SyncQueueDao
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/ml/TFLiteSorghumClassifier.kt',
    name: 'TFLiteSorghumClassifier.kt',
    category: 'ml',
    language: 'kotlin',
    description: 'مغلف نموذج الذكاء الاصطناعي TFLite Wrapper يستهدف مجلد الأصول assets/model/sorghum_disease_v1.tflite',
    code: `package org.sorghum.ai.ml

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.nio.ByteBuffer
import java.nio.ByteOrder

enum class DiagnosisStatus {
    HEALTHY,   // 🟢 Green
    DISEASED,  // 🔴 Red
    BLURRY,    // 🟡 Yellow
    IDLE
}

data class ClassificationResult(
    val diseaseId: String,
    val confidence: Float,
    val status: DiagnosisStatus
)

class TFLiteSorghumClassifier(private val context: Context) {
    private var interpreter: Interpreter? = null
    private val MODEL_PATH = "model/sorghum_disease_v1.tflite"
    private val INPUT_SIZE = 224

    init {
        loadModel()
    }

    private fun loadModel() {
        val modelBuffer = FileUtil.loadMappedFile(context, MODEL_PATH)
        val options = Interpreter.Options().apply {
            setNumThreads(4)
            setUseNNAPI(true) // Accelerate with Mobile NPU / DSP
        }
        interpreter = Interpreter(modelBuffer, options)
    }

    fun classify(bitmap: Bitmap): ClassificationResult {
        // 1. Check for blurriness first
        val isBlurry = BlurDetector.isImageBlurry(bitmap)
        if (isBlurry) {
            return ClassificationResult(
                diseaseId = "unclear_photo",
                confidence = 0.0f,
                status = DiagnosisStatus.BLURRY // 🟡 Trigger Yellow Frame
            )
        }

        // 2. Preprocess input bitmap to 224x224 RGB Float32 tensor
        val resized = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)
        val byteBuffer = ByteBuffer.allocateDirect(1 * INPUT_SIZE * INPUT_SIZE * 3 * 4).apply {
            order(ByteOrder.nativeOrder())
        }

        val intValues = IntArray(INPUT_SIZE * INPUT_SIZE)
        resized.getPixels(intValues, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)

        for (pixel in intValues) {
            val r = ((pixel shr 16) and 0xFF) / 255.0f
            val g = ((pixel shr 8) and 0xFF) / 255.0f
            val b = (pixel and 0xFF) / 255.0f
            byteBuffer.putFloat(r)
            byteBuffer.putFloat(g)
            byteBuffer.putFloat(b)
        }

        // 3. Execute inference
        val outputProbabilities = Array(1) { FloatArray(5) }
        interpreter?.run(byteBuffer, outputProbabilities)

        // 4. Map output to disease
        val probabilities = outputProbabilities[0]
        val maxIndex = probabilities.indices.maxByOrNull { probabilities[it] } ?: 0
        val confidence = probabilities[maxIndex]

        val diseaseMapping = listOf(
            "sorghum_healthy",      // Index 0 -> 🟢 Healthy
            "sorghum_anthracnose",  // Index 1 -> 🔴 Disease (8 PHI days)
            "sorghum_rust",         // Index 2 -> 🔴 Disease (14 PHI days)
            "sorghum_head_smut",    // Index 3 -> 🔴 Disease (21 PHI days)
            "sorghum_leaf_blight"   // Index 4 -> 🔴 Disease (10 PHI days)
        )

        val diseaseId = diseaseMapping[maxIndex]
        val status = if (diseaseId == "sorghum_healthy") DiagnosisStatus.HEALTHY else DiagnosisStatus.DISEASED

        return ClassificationResult(diseaseId, confidence, status)
    }

    fun close() {
        interpreter?.close()
    }
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/ml/BlurDetector.kt',
    name: 'BlurDetector.kt',
    category: 'ml',
    language: 'kotlin',
    description: 'كاشف الضبابية السريع على الجهاز (Laplacian Variance) لتشغيل الإشارة الصفراء',
    code: `package org.sorghum.ai.ml

import android.graphics.Bitmap
import android.graphics.Color

/**
 * On-Device Laplacian Variance Image Sharpness Evaluator.
 * Detects hand jitters and camera focus blur without needing heavy external OpenCV binaries.
 */
object BlurDetector {
    private const val BLUR_THRESHOLD = 38.0 // Values below this are flagged as blurry

    fun isImageBlurry(bitmap: Bitmap): Boolean {
        val width = 128
        val height = 128
        val scaled = Bitmap.createScaledBitmap(bitmap, width, height, false)

        val gray = FloatArray(width * height)
        for (y in 0 until height) {
            for (x in 0 until width) {
                val pixel = scaled.getPixel(x, y)
                gray[y * width + x] = (Color.red(pixel) * 0.299f +
                                       Color.green(pixel) * 0.587f +
                                       Color.blue(pixel) * 0.114f)
            }
        }

        var sum = 0.0
        var sumSq = 0.0
        var count = 0

        for (y in 1 until height - 1) {
            for (x in 1 until width - 1) {
                val idx = y * width + x
                val laplacian = gray[idx - width] +
                                gray[idx + width] +
                                gray[idx - 1] +
                                gray[idx + 1] -
                                (4.0f * gray[idx])

                sum += laplacian
                sumSq += laplacian * laplacian
                count++
            }
        }

        val mean = sum / count
        val variance = (sumSq / count) - (mean * mean)

        return variance < BLUR_THRESHOLD
    }
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/sync/DiagnosisSyncWorker.kt',
    name: 'DiagnosisSyncWorker.kt',
    category: 'sync',
    language: 'kotlin',
    description: 'عامل المزامنة في الخلفية عبر WorkManager مع فحص توفر الاتصال بالإنترنت ورفع السجلات',
    code: `package org.sorghum.ai.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import org.sorghum.ai.data.local.dao.SyncQueueDao
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Background WorkManager Worker:
 * - Triggers automatically when NetworkType.CONNECTED is available
 * - Uploads pending records and GPS metadata to remote dashboard API
 */
@HiltWorker
class DiagnosisSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncQueueDao: SyncQueueDao,
    private val syncApiService: SyncApiService
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val pendingRecords = syncQueueDao.getPendingSyncRecords()
        if (pendingRecords.isEmpty()) return Result.success()

        for (record in pendingRecords) {
            try {
                val imageFile = File(record.imageFilePath)
                
                // Upload diagnosis payload to configurable Base URL
                val response = syncApiService.uploadDiagnosis(
                    id = record.id,
                    diseaseId = record.diseaseId,
                    latitude = record.gpsLatitude,
                    longitude = record.gpsLongitude,
                    timestamp = record.timestamp,
                    imageFile = imageFile
                )

                if (response.isSuccessful) {
                    syncQueueDao.markAsSynced(record.id)
                } else {
                    syncQueueDao.updateSyncRecord(record.copy(retryCount = record.retryCount + 1))
                }
            } catch (e: Exception) {
                return if (runAttemptCount < 3) Result.retry() else Result.failure()
            }
        }

        return Result.success()
    }

    companion object {
        fun enqueuePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<DiagnosisSyncWorker>(
                repeatInterval = 15,
                repeatIntervalTimeUnit = TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "SorghumDataSyncWork",
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/extension/SorghumExtensionHook.kt',
    name: 'SorghumExtensionHook.kt',
    category: 'extension',
    language: 'kotlin',
    description: 'واجهة نقطة الربط (Interface Hook) لجاهزية إضافة "الجزء الثالث" مستقبلاً بنمط Clean Architecture',
    code: `package org.sorghum.ai.extension

import android.graphics.Bitmap
import org.sorghum.ai.data.local.entity.DiseaseEntity

/**
 * Extensible Interface Hook for Part 3 Future Additions
 * (Allows seamless integration of Yield Estimators, Weather Feeds, Voice Prompts without rewriting UI/DB)
 */
interface SorghumExtensionHook {
    val hookId: String
    val hookName: String

    suspend fun onPreInference(bitmap: Bitmap) {}
    suspend fun onPostDiagnosis(disease: DiseaseEntity, gpsLat: Double, gpsLng: Double) {}
    suspend fun onPhiCountdownTick(remainingDays: Int) {}
    suspend fun onSyncFinished(syncedCount: Int) {}
}

class ExtensionRegistry {
    private val registeredHooks = mutableListOf<SorghumExtensionHook>()

    fun register(hook: SorghumExtensionHook) {
        registeredHooks.add(hook)
    }

    suspend fun notifyPostDiagnosis(disease: DiseaseEntity, lat: Double, lng: Double) {
        registeredHooks.forEach { it.onPostDiagnosis(disease, lat, lng) }
    }
}`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/di/AppModule.kt',
    name: 'AppModule.kt',
    category: 'di',
    language: 'kotlin',
    description: 'حقن التبعيات (Dependency Injection - Hilt) لعمارة Clean Architecture / MVVM',
    code: `package org.sorghum.ai.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import org.sorghum.ai.data.local.SorghumDatabase
import org.sorghum.ai.data.local.dao.DiseaseDao
import org.sorghum.ai.data.local.dao.SyncQueueDao
import org.sorghum.ai.ml.TFLiteSorghumClassifier
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSorghumDatabase(@ApplicationContext context: Context): SorghumDatabase {
        return Room.databaseBuilder(
            context,
            SorghumDatabase::class.java,
            "sorghum_offline_db.db"
        ).build()
    }

    @Provides
    fun provideDiseaseDao(db: SorghumDatabase): DiseaseDao = db.diseaseDao()

    @Provides
    fun provideSyncQueueDao(db: SorghumDatabase): SyncQueueDao = db.syncQueueDao()

    @Provides
    @Singleton
    fun provideTFLiteClassifier(@ApplicationContext context: Context): TFLiteSorghumClassifier {
        return TFLiteSorghumClassifier(context)
    }
}`
  },
  {
    path: 'app/src/main/assets/model/sorghum_disease_v1.tflite',
    name: 'sorghum_disease_v1.tflite (Metadata)',
    category: 'assets',
    language: 'json',
    description: 'ملف الأصول المحلي للنموذج المترجم TFLite لتشخيص أمراض الذرة الرفيعة',
    code: `{
  "model_name": "sorghum_disease_v1.tflite",
  "target_asset_path": "app/src/main/assets/model/sorghum_disease_v1.tflite",
  "format": "TensorFlow Lite FlatBuffer v3",
  "input_tensor": {
    "name": "input_1",
    "shape": [1, 224, 224, 3],
    "dtype": "FLOAT32",
    "normalization": "1.0 / 255.0"
  },
  "output_tensor": {
    "name": "Identity",
    "shape": [1, 5],
    "dtype": "FLOAT32",
    "classes": [
      "sorghum_healthy",
      "sorghum_anthracnose",
      "sorghum_rust",
      "sorghum_head_smut",
      "sorghum_leaf_blight"
    ]
  },
  "quantization": "INT8 / FP16 Mixed Precision",
  "size_mb": 4.2,
  "inference_latency_ms": 110
}`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml (Base / English)',
    category: 'locale',
    language: 'xml',
    description: 'ملف الموارد النصية الأساسي لتطبيق أندرويد (Default Strings for Ghana, Uganda & Fallback)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Sorghum AI</string>
    <string name="app_subtitle">Crop Disease Diagnosis</string>
    <string name="btn_scan_plant">Scan Plant Now</string>
    <string name="status_diseased">Disease Detected 🔴 (Severe Danger)</string>
    <string name="status_blurry">Warning 🟡 Image Blurry or Camera Shook</string>
    <string name="status_healthy">Safe &amp; Healthy Plant 🟢 (No Pathogens)</string>
    <string name="status_idle">Point camera at sorghum leaf and tap scan</string>
    <string name="phi_title">Pre-Harvest Interval (PHI)</string>
    <string name="phi_harvest_ready">Ready for Safe Harvest</string>
    <string name="phi_days_remaining">%1$d days remaining</string>
    <string name="phi_warning">Health Warning: Do not harvest, consume, or sell crop before all spray cans disappear and golden checkmark appears.</string>
    <string name="sync_queue_title">Offline Sync Queue (WorkManager)</string>
    <string name="sync_online">Online Connected</string>
    <string name="sync_offline">Offline Field Mode</string>
    
    <!-- 6 African Challenge Countries -->
    <string name="country_sudan">Sudan 🇸🇩 (العربية)</string>
    <string name="country_rwanda">Rwanda 🇷🇼 (Ikinyarwanda)</string>
    <string name="country_kenya">Kenya 🇰🇪 (Kiswahili)</string>
    <string name="country_uganda">Uganda 🇺🇬 (English / Swahili)</string>
    <string name="country_ghana">Ghana 🇬🇭 (English)</string>
    <string name="country_malawi">Malawi 🇲🇼 (Chichewa)</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values-ar/strings.xml',
    name: 'strings.xml (values-ar / Sudan)',
    category: 'locale',
    language: 'xml',
    description: 'ملف الموارد النصية المعرّبة للسودان (ar-SD) مع دعم كامل لاتجاه اليمين لليسار (RTL)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">تشخيص أمراض الذرة الرفيعة</string>
    <string name="app_subtitle">الذكاء الاصطناعي لحماية المحاصيل</string>
    <string name="btn_scan_plant">افحص النبات الآن</string>
    <string name="status_diseased">تم اكتشاف مرض في المحصول 🔴 (خطر / إصابة)</string>
    <string name="status_blurry">تحذير 🟡 الصورة غير واضحة أو اهتزت</string>
    <string name="status_healthy">نبات سليم وآمن 🟢 (خالٍ من الأمراض)</string>
    <string name="status_idle">وجه الكاميرا نحو ورقة الذرة واضغط زر الفحص</string>
    <string name="phi_title">فترة الأمان للمبيد (PHI)</string>
    <string name="phi_harvest_ready">المحصول آمن تماماً وجاهز للحصاد</string>
    <string name="phi_days_remaining">متبقي %1$d يوم</string>
    <string name="phi_warning">تحذير صحي: يمنع قطف أو استهلاك أو بيع المحصول قبل اختفاء جميع علب المبيد وظهور علامة الصح الذهبية.</string>
    <string name="sync_queue_title">طابور المزامنة التلقائي (WorkManager)</string>
    <string name="sync_online">متصل بالشبكة</string>
    <string name="sync_offline">وضع الحقل أوفلاين (بدون إنترنت)</string>
    
    <string name="country_sudan">السودان 🇸🇩 (العربية)</string>
    <string name="country_rwanda">رواندا 🇷🇼 (Ikinyarwanda)</string>
    <string name="country_kenya">كينيا 🇰🇪 (Kiswahili)</string>
    <string name="country_uganda">أوغندا 🇺🇬 (English)</string>
    <string name="country_ghana">غانا 🇬🇭 (English)</string>
    <string name="country_malawi">مالاوي 🇲🇼 (Chichewa)</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values-rw/strings.xml',
    name: 'strings.xml (values-rw / Rwanda)',
    category: 'locale',
    language: 'xml',
    description: 'ملف الموارد النصية لرواندا باللغة الكينيرواندية (rw-RW)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Gupima Indwara z’Amasaka</string>
    <string name="app_subtitle">Ubwenge Bukorano ku Buhinzi</string>
    <string name="btn_scan_plant">Pima Igihingwa None</string>
    <string name="status_diseased">Indwara yabonetse mu gihingwa 🔴 (Kiteye Ikibazo)</string>
    <string name="status_blurry">Iburira 🟡 Ifoto ntiboneye neza</string>
    <string name="status_healthy">Igihingwa kirazima neza 🟢 (Nta Kibazo)</string>
    <string name="status_idle">Erekana kamera ku kibabi cy’amasaka maze ukande gupima</string>
    <string name="phi_title">Igihe cyo Gutegereza Umuti (PHI)</string>
    <string name="phi_harvest_ready">Byiteguye Gusarurwa Mu Mutekano</string>
    <string name="phi_days_remaining">Hasigaye iminsi %1$d</string>
    <string name="phi_warning">Iburira ry’Ubuzima: Ntugasarure, ngo urye, cyangwa ugurishe imyaka mbere yuko amakarani yose ashira n’ikimenyetso cy’izahabu kikaza.</string>
    <string name="sync_queue_title">Urutonde rwo Kohereza Amakuru (WorkManager)</string>
    <string name="sync_online">Ifite Interineti</string>
    <string name="sync_offline">Nta Interineti yo mu Murima</string>
    
    <string name="country_sudan">Sudani 🇸🇩 (Icyarabu)</string>
    <string name="country_rwanda">Rwanda 🇷🇼 (Ikinyarwanda)</string>
    <string name="country_kenya">Kenya 🇰🇪 (Igiswahili)</string>
    <string name="country_uganda">Uganda 🇺🇬 (Icyongereza)</string>
    <string name="country_ghana">Ghana 🇬🇭 (Icyongereza)</string>
    <string name="country_malawi">Malawi 🇲🇼 (Icyichewa)</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values-sw/strings.xml',
    name: 'strings.xml (values-sw / Kenya & Uganda)',
    category: 'locale',
    language: 'xml',
    description: 'ملف الموارد النصية لكينيا وأوغندا باللغة السواحلية (sw-KE / sw-UG)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Kutambua Magonjwa ya Mtama</string>
    <string name="app_subtitle">Sorghum AI</string>
    <string name="btn_scan_plant">Pima Mmea Sasa</string>
    <string name="status_diseased">Ugonjwa Umepatikana Kwenye Mmea 🔴 (Hatari)</string>
    <string name="status_blurry">Onyo 🟡 Picha Haionekani Vizuri</string>
    <string name="status_healthy">Mmea Una Afya Bora na Salama 🟢 (Hakuna Magonjwa)</string>
    <string name="status_idle">Elekeza kamera kwenye jani la mtama kisha bonyeza kitufe cha kupima</string>
    <string name="phi_title">Muda wa Kusubiri Baada ya Dawa (PHI)</string>
    <string name="phi_harvest_ready">Tayari kwa Uvunaji Salama</string>
    <string name="phi_days_remaining">Siku %1$d zilizobaki</string>
    <string name="phi_warning">Onyo la Afya: Usivune, usile, wala usiuze mazao kabla ya makopo yote kuisha na tiki ya dhahabu kuonekana.</string>
    <string name="sync_queue_title">Msururu wa Kupakia Data (WorkManager)</string>
    <string name="sync_online">Kwenye Mtandao</string>
    <string name="sync_offline">Hali ya Shambani Bila Mtandao</string>
    
    <string name="country_sudan">Sudani 🇸🇩 (Kiarabu)</string>
    <string name="country_rwanda">Rwanda 🇷🇼 (Kinyarwanda)</string>
    <string name="country_kenya">Kenya 🇰🇪 (Kiswahili)</string>
    <string name="country_uganda">Uganda 🇺🇬 (Kiingereza / Kiswahili)</string>
    <string name="country_ghana">Ghana 🇬🇭 (Kiingereza)</string>
    <string name="country_malawi">Malawi 🇲🇼 (Chichewa)</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values-ny/strings.xml',
    name: 'strings.xml (values-ny / Malawi)',
    category: 'locale',
    language: 'xml',
    description: 'ملف الموارد النصية لمالاوي باللغة التشيتشيوية (ny-MW)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Kuzindikira Matenda a Mapira</string>
    <string name="app_subtitle">Sorghum AI</string>
    <string name="btn_scan_plant">Yezerani Chomera Tsopano</string>
    <string name="status_diseased">Matenda Apezeka pa Chomera 🔴 (Zowopsa)</string>
    <string name="status_blurry">Chenjezo 🟡 Chithunzi Sichikuoneka Bwino</string>
    <string name="status_healthy">Chomera N'chathanzi Kwambiri 🟢 (Palibe Matenda)</string>
    <string name="status_idle">Lozani kamera patsamba la mapira ndikukanikiza batani loyezera</string>
    <string name="phi_title">Nthawi Yodikirira Mankhwala Asanakololedwe (PHI)</string>
    <string name="phi_harvest_ready">Zokonzeka Kukolola Mwachitetezo</string>
    <string name="phi_days_remaining">Masiku %1$d otsala</string>
    <string name="phi_warning">Chenjezo la Zaumoyo: Musakolole, musadye, kapena kugulitsa mbewu zitini zonse zisanathe ndipo chizindikiro cha chikasu chisanawonekere.</string>
    <string name="sync_queue_title">Mndandanda Wotumiza Zinthu (WorkManager)</string>
    <string name="sync_online">Yolumikizidwa ku Intaneti</string>
    <string name="sync_offline">Mumunda Popanda Intaneti</string>
    
    <string name="country_sudan">Sudan 🇸🇩 (Chiarabu)</string>
    <string name="country_rwanda">Rwanda 🇷🇼 (Kinyarwanda)</string>
    <string name="country_kenya">Kenya 🇰🇪 (Chiswahili)</string>
    <string name="country_uganda">Uganda 🇺🇬 (Chingerezi)</string>
    <string name="country_ghana">Ghana 🇬🇭 (Chingerezi)</string>
    <string name="country_malawi">Malawi 🇲🇼 (Chichewa)</string>
</resources>`
  },
  {
    path: 'app/src/main/java/org/sorghum/ai/util/locale/CountryLocaleManager.kt',
    name: 'CountryLocaleManager.kt',
    category: 'locale',
    language: 'kotlin',
    description: 'مدير اللغات والدول الست (السودان، رواندا، كينيا، أوغندا، غانا، مالاوي) مع نظام الحماية التلقائي (Fallback) وتبديل RTL/LTR',
    code: `package org.sorghum.ai.util.locale

import android.content.Context
import android.content.res.Configuration
import androidx.compose.ui.unit.LayoutDirection
import java.util.Locale

/**
 * Country & Localization Configuration for 6 Africa Challenge Target Countries:
 * 1. Sudan (ar) -> RTL
 * 2. Rwanda (rw, Fallback en) -> LTR
 * 3. Kenya (sw, Fallback en) -> LTR
 * 4. Uganda (en, Fallback sw) -> LTR
 * 5. Ghana (en) -> LTR
 * 6. Malawi (ny, Fallback en) -> LTR
 */
enum class TargetCountry(
    val code: String,
    val countryName: String,
    val primaryLang: String,
    val fallbackLang: String,
    val isRtl: Boolean,
    val flag: String
) {
    SUDAN("sudan", "السودان", "ar", "en", true, "🇸🇩"),
    RWANDA("rwanda", "Rwanda", "rw", "en", false, "🇷🇼"),
    KENYA("kenya", "Kenya", "sw", "en", false, "🇰🇪"),
    UGANDA("uganda", "Uganda", "en", "sw", false, "🇺🇬"),
    GHANA("ghana", "Ghana", "en", "en", false, "🇬🇭"),
    MALAWI("malawi", "Malawi", "ny", "en", false, "🇲🇼");

    companion object {
        fun fromCode(code: String): TargetCountry =
            values().firstOrNull { it.code.equals(code, ignoreCase = true) } ?: SUDAN
    }
}

object CountryLocaleManager {
    private const val PREFS_NAME = "sorghum_country_prefs"
    private const val KEY_COUNTRY = "selected_country"

    fun setCountry(context: Context, country: TargetCountry): Context {
        persistCountry(context, country.code)
        return updateLocaleResources(context, country.primaryLang)
    }

    fun getPersistedCountry(context: Context): TargetCountry {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val code = prefs.getString(KEY_COUNTRY, TargetCountry.SUDAN.code) ?: TargetCountry.SUDAN.code
        return TargetCountry.fromCode(code)
    }

    fun getLayoutDirection(country: TargetCountry): LayoutDirection {
        return if (country.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr
    }

    private fun persistCountry(context: Context, countryCode: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_COUNTRY, countryCode).apply()
    }

    private fun updateLocaleResources(context: Context, languageCode: String): Context {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)

        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)
        config.setLayoutDirection(locale)

        return context.createConfigurationContext(config)
    }
}
`
  }
];

export const AndroidCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFiles = activeCategory === 'all' 
    ? ANDROID_FILES 
    : ANDROID_FILES.filter((f) => f.category === activeCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ui': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">UI / Compose</span>;
      case 'data': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">Room / Local DB</span>;
      case 'ml': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">TFLite / ML</span>;
      case 'sync': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-800/60">WorkManager</span>;
      case 'extension': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-pink-950/80 text-pink-300 border border-pink-800/60">Part 3 Hook</span>;
      case 'di': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">Hilt DI</span>;
      case 'locale': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-800/60">i18n / Locale</span>;
      default: return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">Assets</span>;
    }
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-3xl border border-slate-800 text-white overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-800/60 shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white leading-tight">
              هيكلية المشروع وملفات كود أندرويد (Kotlin / Compose)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              هندسة نظيفة Clean Architecture / MVVM مع Room و TFLite و WorkManager
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">تم نسخ الكود</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>نسخ الملف الحالي</span>
            </>
          )}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'ui', label: 'الواجهات (Compose)' },
          { id: 'data', label: 'قاعدة البيانات (Room)' },
          { id: 'ml', label: 'الذكاء المحلي (TFLite)' },
          { id: 'sync', label: 'المزامنة (WorkManager)' },
          { id: 'locale', label: 'اللغات (i18n / Strings)' },
          { id: 'extension', label: 'جاهزية الجزء 3' },
          { id: 'di', label: 'حقن التبعيات (DI)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
              activeCategory === tab.id
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Code Explorer Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
        {/* Left Sidebar: File Tree */}
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/60 p-3 space-y-1 overflow-y-auto max-h-[500px]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            <span>شجرة ملفات المشروع</span>
          </div>

          {filteredFiles.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-right p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>
                  {getCategoryBadge(file.category)}
                </div>
                <span className="text-[10px] text-slate-400 font-mono truncate text-left dir-ltr">
                  {file.path}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Code Display Area */}
        <div className="md:col-span-8 p-4 bg-slate-950/90 flex flex-col justify-between overflow-hidden">
          <div>
            {/* File Meta Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="space-y-0.5">
                <div className="text-xs font-mono text-emerald-400 dir-ltr text-left">
                  {selectedFile.path}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedFile.description}
                </div>
              </div>
            </div>

            {/* Code Block with Syntax Styling */}
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-[400px] p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 leading-relaxed dir-ltr text-left selection:bg-emerald-900 selection:text-white shadow-inner">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

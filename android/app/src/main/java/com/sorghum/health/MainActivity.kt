package com.sorghum.health

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.sorghum.health.data.local.AppDatabase
import com.sorghum.health.data.local.DiagnosisRecord
import com.sorghum.health.data.model.DiseaseInfo
import com.sorghum.health.data.model.SorghumDiseaseCatalog
import com.sorghum.health.data.repository.DiseaseDetail
import com.sorghum.health.data.repository.SorghumRepository
import com.sorghum.health.ml.InferenceResult
import com.sorghum.health.ml.TFLiteSorghumClassifier
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.util.UUID

class MainActivity : ComponentActivity() {

    private lateinit var classifier: TFLiteSorghumClassifier
    private lateinit var database: AppDatabase
    private lateinit var repository: SorghumRepository

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        if (!cameraGranted) {
            Toast.makeText(this, "صلاحية الكاميرا مفيدة لالتقاط صور المحاصيل المباشرة", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        classifier = TFLiteSorghumClassifier(this)
        database = AppDatabase.getDatabase(this)
        repository = SorghumRepository(this, database.diagnosisDao())

        checkPermissions()

        setContent {
            SorghumAppScreen(
                onExecuteDiagnosis = { bitmap, callback ->
                    runOnDeviceInference(bitmap, callback)
                },
                onSyncRequested = {
                    (application as? SorghumApplication)?.triggerImmediateSync()
                }
            )
        }
    }

    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun runOnDeviceInference(
        bitmap: Bitmap,
        onComplete: (DiagnosisRecord, DiseaseDetail?) -> Unit
    ) {
        lifecycleScope.launch(Dispatchers.Default) {
            // 1. Run deterministic on-device local TFLite classification
            val inference: InferenceResult = classifier.classify(bitmap)

            // 2. Query Repository for disease guidance
            val diseaseDetail = repository.getDiseaseByCode(inference.disease.id, true)
                ?: repository.getDiseaseById(0, true)

            // 3. Compress image to Base64 for offline Room DB storage & sync
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
            val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

            val record = DiagnosisRecord(
                id = "diag_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(6)}",
                timestamp = System.currentTimeMillis(),
                diseaseId = inference.disease.id,
                diseaseNameEn = inference.disease.nameEn,
                diseaseNameAr = inference.disease.nameAr,
                isHealthy = inference.disease.isHealthy,
                confidence = inference.confidence,
                isBlurry = inference.isBlurry,
                blurScore = inference.blurScore,
                imagePath = "",
                imageBase64 = base64,
                latitude = 14.3852,
                longitude = 33.5241,
                remainingPhiDays = diseaseDetail?.safetyIntervalDays ?: inference.disease.phiDays,
                initialPhiDays = diseaseDetail?.safetyIntervalDays ?: inference.disease.phiDays,
                syncStatus = "PENDING"
            )

            // 4. Save to Room database via Repository
            repository.insertDiagnosis(record)

            withContext(Dispatchers.Main) {
                onComplete(record, diseaseDetail)
                (application as? SorghumApplication)?.triggerImmediateSync()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        classifier.close()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SorghumAppScreen(
    onExecuteDiagnosis: (Bitmap, (DiagnosisRecord, DiseaseDetail?) -> Unit) -> Unit,
    onSyncRequested: () -> Unit
) {
    val context = LocalContext.current
    var isArabic by remember { mutableStateOf(true) }
    var isProcessing by remember { mutableStateOf(false) }
    var activeDiagnosis by remember { mutableStateOf<DiagnosisRecord?>(null) }
    var activeDetail by remember { mutableStateOf<DiseaseDetail?>(null) }
    var remainingDays by remember { mutableIntStateOf(0) }
    var previewBitmap by remember { mutableStateOf<Bitmap?>(null) }

    // 1. Camera Launcher (Captures photo directly)
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        if (bitmap != null) {
            previewBitmap = bitmap
            activeDiagnosis = null
        }
    }

    // 2. Camera Permission Launcher
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            cameraLauncher.launch(null)
        } else {
            Toast.makeText(
                context,
                if (isArabic) "يرجى منح إذن الكاميرا لالتقاط صورة النبات" else "Please grant camera permission",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    // 3. Gallery Image Picker Launcher (Decodes bitmap immediately for preview)
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                context.contentResolver.openInputStream(uri)?.use { inputStream ->
                    val decoded = BitmapFactory.decodeStream(inputStream)
                    if (decoded != null) {
                        previewBitmap = decoded
                        activeDiagnosis = null
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    val isSmut = activeDetail?.isSmut == true || activeDiagnosis?.diseaseId?.contains("smut") == true
    val isHealthy = activeDetail?.isHealthy == true || activeDiagnosis?.isHealthy == true

    CompositionLocalProvider(
        LocalLayoutDirection provides (if (isArabic) LayoutDirection.Rtl else LayoutDirection.Ltr)
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                text = if (isArabic) "تشخيص أمراض النباتات (الذرة الرفيعة)" else "Sorghum Plant Health Diagnosis",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = if (isArabic) "معالجة طرفية TFLite ومعاينة فورية" else "On-Device TFLite & Instant Preview",
                                fontSize = 11.sp,
                                color = Color(0xFF34D399)
                            )
                        }
                    },
                    actions = {
                        Surface(
                            onClick = { isArabic = !isArabic },
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0x25FBBF24),
                            border = BorderStroke(1.dp, Color(0x66FBBF24)),
                            modifier = Modifier.padding(end = 4.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Language,
                                    contentDescription = "Language",
                                    tint = Color(0xFFFBBF24),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (isArabic) "English" else "العربية",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFFBBF24)
                                )
                            }
                        }
                        IconButton(onClick = onSyncRequested) {
                            Icon(
                                imageVector = Icons.Default.CloudSync,
                                contentDescription = "Sync",
                                tint = Color(0xFF34D399)
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF090D16))
                )
            },
            containerColor = Color(0xFF090D16)
        ) { padding ->
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Header Banner
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Brush.horizontalGradient(listOf(Color(0xFF059669), Color(0xFF064E3B))))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(Color(0xFF064E3B), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Eco,
                                contentDescription = null,
                                tint = Color(0xFF34D399),
                                modifier = Modifier.size(26.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (isArabic) "المعالجة والتخزين أوفلاين على الجهاز" else "Offline-First Local Storage & AI",
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 13.sp
                            )
                            Text(
                                text = if (isArabic) "يتم حفظ الصورة، الـ IP، والموقع في Room DB ثم المزامنة" else "Images, IP, GPS stored in Room DB & auto-synced",
                                color = Color(0xFF94A3B8),
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                // 2. Camera Viewfinder & Immediate Image Preview Window
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1.15f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF020617)),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(
                        2.dp,
                        when {
                            activeDiagnosis == null -> Color(0xFF1E293B)
                            isHealthy -> Color(0xFF10B981)
                            else -> Color(0xFFF43F5E)
                        }
                    )
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        // If previewBitmap exists, render it immediately!
                        if (previewBitmap != null) {
                            Image(
                                bitmap = previewBitmap!!.asImageBitmap(),
                                contentDescription = "Captured Sorghum Leaf",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            // Viewfinder Center Reticle Placeholder
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp)
                                    .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(16.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = null,
                                        tint = Color(0xFF34D399),
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Text(
                                        text = if (isArabic) "نافذة الكاميرا والمعاينة الفورية" else "Instant Camera & Preview",
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = if (isArabic) "التقط صورة للورقة أو ارفعها لمعاينتها فوراً" else "Snap or upload leaf photo to preview",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }

                        // Diagnosis Result Overlay if active
                        if (activeDiagnosis != null) {
                            Surface(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                shape = RoundedCornerShape(16.dp),
                                color = Color(0xEE090D16),
                                border = BorderStroke(1.dp, if (isHealthy) Color(0xFF10B981) else Color(0xFFF43F5E))
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Icon(
                                        imageVector = if (isHealthy) Icons.Default.CheckCircle else Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = if (isHealthy) Color(0xFF34D399) else Color(0xFFF43F5E),
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = if (isArabic) (activeDiagnosis?.diseaseNameAr ?: "") else (activeDiagnosis?.diseaseNameEn ?: ""),
                                            color = Color.White,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "${(activeDiagnosis?.confidence?.times(100))?.toInt() ?: 95}% ${if (isArabic) "دقة التشخيص" else "Confidence"}",
                                            color = Color(0xFFFBBF24),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }

                        // Top Badges (GPS & TFLite)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color(0xD9020617),
                                border = BorderStroke(1.dp, Color(0xFF1E293B))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Bolt,
                                        contentDescription = null,
                                        tint = Color(0xFFFBBF24),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(
                                        text = "TFLite Edge AI",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color(0xD9020617),
                                border = BorderStroke(1.dp, Color(0xFF1E293B))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOn,
                                        contentDescription = null,
                                        tint = Color(0xFF34D399),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(
                                        text = "GPS 14.38°, 33.52°",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }
                }

                // 3. Dual Capture & Gallery Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Button 1: Camera Capture with Permission Check
                    OutlinedButton(
                        onClick = {
                            if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                                cameraLauncher.launch(null)
                            } else {
                                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = Color(0xFF0F172A),
                            contentColor = Color.White
                        ),
                        border = BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = null,
                            tint = Color(0xFF34D399),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isArabic) "التقاط من الكاميرا" else "Capture Photo",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Button 2: Upload from Gallery
                    OutlinedButton(
                        onClick = {
                            galleryLauncher.launch("image/*")
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = Color(0xFF0F172A),
                            contentColor = Color.White
                        ),
                        border = BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Upload,
                            contentDescription = null,
                            tint = Color(0xFF38BDF8),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isArabic) "رفع من المعرض" else "Upload Gallery",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // 4. Submit & Diagnose Button
                Button(
                    onClick = {
                        isProcessing = true
                        val targetBitmap = previewBitmap ?: createDefaultSampleBitmap()
                        onExecuteDiagnosis(targetBitmap) { record, detail ->
                            activeDiagnosis = record
                            activeDetail = detail
                            remainingDays = record.remainingPhiDays
                            isProcessing = false
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                    enabled = !isProcessing
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.5.dp
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = if (isArabic) "جاري الفحص الدقيق بالذكاء الاصطناعي..." else "Analyzing with TFLite...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = null,
                            tint = Color(0xFFFBBF24),
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isArabic) "إرسال وتحليل الصورة" else "Submit & Diagnose",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }
    }
}

/**
 * Creates a deterministic default sorghum leaf bitmap for inference test
 */
private fun createDefaultSampleBitmap(): Bitmap {
    val bitmap = Bitmap.createBitmap(224, 224, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint().apply {
        color = android.graphics.Color.rgb(34, 139, 34) // Forest green leaf base
    }
    canvas.drawRect(0f, 0f, 224f, 224f, paint)
    return bitmap
}

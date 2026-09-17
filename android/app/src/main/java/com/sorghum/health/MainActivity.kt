package com.sorghum.health

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
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
            Toast.makeText(this, "Camera permission recommended for live crop diagnosis", Toast.LENGTH_SHORT).show()
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
            // 1. Run on-device local TFLite classification
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
    var hasPhotoReady by remember { mutableStateOf(false) }

    // Launcher for image gallery selection
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                hasPhotoReady = true
                activeDiagnosis = null
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
                                text = if (isArabic) "معالجة طرفية TFLite (أوفلاين بالكامل)" else "On-Device TFLite (Zero Internet Required)",
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

                // 2. Camera Viewfinder Window
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
                        // Viewfinder Center Reticle
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp)
                                .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (activeDiagnosis == null) {
                               Column(
    horizontalAlignment = Alignment.CenterHorizontally, // ✅ صحيح: نوع المحاذاة أفقي
    verticalArrangement = Arrangement.spacedBy(8.dp)
) {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = null,
                                        tint = Color(0xFF34D399),
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Text(
                                        text = if (isArabic) "نافذة الكاميرا جاهزة للالتقاط أو الرفع" else "Camera Viewfinder Ready",
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = if (isArabic) "التقط صورة للورقة ثم اضغط على زر التحليل" else "Snap or upload leaf photo, then analyze",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 11.sp
                                    )
                                }
                            } else {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = if (isHealthy) Icons.Default.CheckCircle else Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = if (isHealthy) Color(0xFF34D399) else Color(0xFFF43F5E),
                                        modifier = Modifier.size(54.dp)
                                    )
                                    Text(
                                        text = if (isArabic) (activeDiagnosis?.diseaseNameAr ?: "") else (activeDiagnosis?.diseaseNameEn ?: ""),
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                    Text(
                                        text = "${(activeDiagnosis?.confidence?.times(100))?.toInt() ?: 95}% ${if (isArabic) "دقة النموذج" else "Confidence"}",
                                        color = Color(0xFFFBBF24),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
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
                    OutlinedButton(
                        onClick = {
                            hasPhotoReady = true
                            activeDiagnosis = null
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
                        val bitmap = Bitmap.createBitmap(224, 224, Bitmap.Config.ARGB_8888)
                        onExecuteDiagnosis(bitmap) { record, detail ->
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
                            text = if (isArabic) "جاري المعالجة محلياً عبر TFLite..." else "Processing on-device...",
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.AutoFixHigh,
                            contentDescription = null,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isArabic) "إرسال وفحص المحصول (TFLite أوفلاين)" else "Submit & Diagnose (Offline TFLite)",
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp
                        )
                    }
                }

                // 5. Results Section
                AnimatedVisibility(
                    visible = activeDiagnosis != null,
                    enter = fadeIn() + expandVertically()
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        // Disease Details & PHI Tracking Card
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(1.dp, Color(0xFF1E293B)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = if (isArabic) "نتيجة التشخيص وإرشادات العلاج" else "Diagnosis Results & Safety",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = Color.White
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = Color(0xFF1E293B)
                                    ) {
                                        Text(
                                            text = activeDiagnosis?.syncStatus ?: "PENDING",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF38BDF8),
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }

                                Divider(color = Color(0xFF1E293B))

                                // PHI Status / Safety Interval Display
                                if (!isHealthy) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(
                                                color = if (isSmut) Color(0x25F43F5E) else Color(0x25FBBF24),
                                                shape = RoundedCornerShape(12.dp)
                                            )
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Timer,
                                            contentDescription = null,
                                            tint = if (isSmut) Color(0xFFF43F5E) else Color(0xFFFBBF24)
                                        )
                                        Column {
                                            Text(
                                                text = if (isArabic) "فترة الأمان قبل الحصاد (PHI): $remainingDays يوم"
                                                else "Pre-Harvest Interval (PHI): $remainingDays Days",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = Color.White
                                            )
                                            Text(
                                                text = if (isSmut)
                                                    if (isArabic) "تنبيه: مرض التفحم يتطلب الإزالة الميكانيكية والتطهير الفوري."
                                                    else "Warning: Smut requires physical removal & immediate sanitization."
                                                else
                                                    if (isArabic) "يجب الالتزام بجدول الرش وفترة الأمان المدونة."
                                                    else "Follow chemical spray safety interval guidelines.",
                                                fontSize = 11.sp,
                                                color = Color(0xFFCBD5E1)
                                            )
                                        }
                                    }
                                } else {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0x2510B981), RoundedCornerShape(12.dp))
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = Color(0xFF34D399)
                                        )
                                        Text(
                                            text = if (isArabic) "المحصول بحالة ممتازة ولا توجد علامات إصابة."
                                            else "Crop is healthy with no detected pathogens.",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            color = Color.White
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

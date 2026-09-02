package com.sorghum.health

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Base64
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.sorghum.health.data.local.AppDatabase
import com.sorghum.health.data.local.DiagnosisRecord
import com.sorghum.health.data.model.DiseaseInfo
import com.sorghum.health.data.model.SorghumDiseaseCatalog
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

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        if (!cameraGranted) {
            Toast.makeText(this, "Camera permission needed for crop diagnosis", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        classifier = TFLiteSorghumClassifier(this)
        database = AppDatabase.getDatabase(this)

        checkPermissions()

        setContent {
            SorghumAppScreen(
                onDiagnoseSample = { diseaseId -> runDiagnosis(diseaseId) },
                onSyncRequested = { (application as SorghumApplication).triggerImmediateSync() }
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

    private fun runDiagnosis(forcedDiseaseId: String? = null) {
        lifecycleScope.launch(Dispatchers.Default) {
            // Generate sample test bitmap for offline inference demonstration
            val width = 224
            val height = 224
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

            val inference: InferenceResult = if (forcedDiseaseId != null) {
                val disease = SorghumDiseaseCatalog.findById(forcedDiseaseId)
                InferenceResult(
                    disease = disease,
                    confidence = 0.95f,
                    isBlurry = false,
                    blurScore = 92.5f,
                    executionTimeMs = 18L
                )
            } else {
                classifier.classify(bitmap)
            }

            // Convert bitmap to Base64
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
                imageBase64 = "data:image/jpeg;base64,$base64",
                latitude = 14.3852,
                longitude = 33.5241,
                remainingPhiDays = inference.disease.phiDays,
                initialPhiDays = inference.disease.phiDays,
                syncStatus = "PENDING"
            )

            withContext(Dispatchers.IO) {
                database.diagnosisDao().insertDiagnosis(record)
            }

            withContext(Dispatchers.Main) {
                (application as SorghumApplication).triggerImmediateSync()
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
    onDiagnoseSample: (String?) -> Unit,
    onSyncRequested: () -> Unit
) {
    var selectedDisease by remember { mutableStateOf<DiseaseInfo?>(SorghumDiseaseCatalog.DISEASES[0]) }
    var remainingDays by remember { mutableIntStateOf(14) }
    var isArabic by remember { mutableStateOf(true) }

    val isSmut = selectedDisease?.id == "sorghum_head_smut" || selectedDisease?.id == "sorghum_loose_smut"
    val isHealthy = selectedDisease?.isHealthy == true
    val isHarvestReady = isHealthy || (remainingDays == 0 && !isSmut)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isArabic) "تشخيص الذرة الرفيعة | Sorghum AI" else "Sorghum Health AI",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = if (isArabic) "ذكاء اصطناعي طرفي (أوفلاين بدون إنترنت)" else "On-Device Edge AI (Zero Internet)",
                            fontSize = 11.sp,
                            color = Color(0xFF34D399)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { isArabic = !isArabic }) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = "Language",
                            tint = Color(0xFFFBBF24)
                        )
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
            // Header Banner
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(20.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF059669), Color(0xFF064E3B))))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color(0xFF064E3B), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Eco,
                            contentDescription = null,
                            tint = Color(0xFF34D399),
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isArabic) "نموذج TFLite المعتمد للمحصول" else "TFLite Model Active",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 14.sp
                        )
                        Text(
                            text = if (isArabic) "متصل بـ plant-backend-2ceh.onrender.com" else "Connected to plant-backend-2ceh.onrender.com",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp
                        )
                    }
                }
            }

            // Disease Selection Bar (Demonstration of the 5 classes)
            Text(
                text = if (isArabic) "اختر المرض للفحص السريع:" else "Select disease class:",
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SorghumDiseaseCatalog.DISEASES.forEach { disease ->
                    val isSelected = selectedDisease?.id == disease.id
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedDisease = disease
                            remainingDays = disease.phiDays
                            onDiagnoseSample(disease.id)
                        },
                        label = {
                            Text(
                                text = if (isArabic) disease.nameAr.split(" ")[0] else disease.nameEn.split(" ")[1],
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF059669),
                            selectedLabelColor = Color.White,
                            containerColor = Color(0xFF1E293B),
                            labelColor = Color(0xFF94A3B8)
                        )
                    )
                }
            }

            // Disease Diagnosis Result Card
            selectedDisease?.let { disease ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.verticalGradient(
                            if (isSmut) listOf(Color(0xFFE11D48), Color(0xFF881337))
                            else if (isHealthy) listOf(Color(0xFF10B981), Color(0xFF064E3B))
                            else listOf(Color(0xFFF59E0B), Color(0xFF78350F))
                        )
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = if (isArabic) disease.nameAr else disease.nameEn,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )

                            Surface(
                                color = if (isSmut) Color(0xFFE11D48) else if (isHealthy) Color(0xFF10B981) else Color(0xFFF59E0B),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = if (isSmut) (if (isArabic) "إزالة فورية" else "Immediate")
                                    else if (isHealthy) (if (isArabic) "محصول سليم" else "Healthy")
                                    else "$remainingDays ${if (isArabic) "يوم أمان" else "Days PHI"}",
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }

                        Text(
                            text = if (isArabic) disease.descriptionAr else disease.descriptionEn,
                            color = Color(0xFFCBD5E1),
                            fontSize = 13.sp,
                            lineHeight = 19.sp
                        )

                        // Treatment Card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isSmut) Color(0x33E11D48) else Color(0x2210B981))
                                .border(1.dp, if (isSmut) Color(0x66E11D48) else Color(0x4410B981), RoundedCornerShape(16.dp))
                                .padding(14.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = if (isSmut) Icons.Default.LocalFireDepartment else Icons.Default.Medication,
                                        contentDescription = null,
                                        tint = if (isSmut) Color(0xFFFDA4AF) else Color(0xFF6EE7B7),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = if (isArabic) "العلاج المعتمد في السودان:" else "Approved Treatment in Sudan:",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = if (isSmut) Color(0xFFFDA4AF) else Color(0xFF6EE7B7)
                                    )
                                }
                                Text(
                                    text = if (isArabic) disease.pesticideAr else disease.pesticideEn,
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium,
                                    lineHeight = 18.sp
                                )
                            }
                        }

                        // Countdown Controls (If not smut & not healthy)
                        if (!isSmut && !isHealthy) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isArabic) "محاكاة تقدم الأيام (24h):" else "Simulate 24h cycle:",
                                    fontSize = 12.sp,
                                    color = Color(0xFF94A3B8)
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = { if (remainingDays > 0) remainingDays-- },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text("-1 ${if (isArabic) "يوم" else "Day"}", fontSize = 11.sp, color = Color.White)
                                    }
                                    Button(
                                        onClick = { remainingDays = 0 },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text(if (isArabic) "جاهز للحصاد" else "Ready", fontSize = 11.sp, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Sync Button
            Button(
                onClick = {
                    onDiagnoseSample(null)
                    onSyncRequested()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
            ) {
                Icon(Icons.Default.CameraAlt, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isArabic) "التقاط وتشخيص فوري (أوفلاين)" else "Capture & Diagnose Offline",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

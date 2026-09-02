package com.sorghum.health.data.model

import com.google.gson.annotations.SerializedName

/**
 * Data models for Sorghum Disease Diagnosis, TFLite classifications,
 * Sudan-approved treatment protocols, and Server Sync DTOs.
 */

data class DiseaseInfo(
    val id: String,
    val nameEn: String,
    val nameAr: String,
    val isHealthy: Boolean,
    val pesticideEn: String,
    val pesticideAr: String,
    val phiDays: Int,
    val descriptionEn: String,
    val descriptionAr: String
)

data class GeoLocationData(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("altitude") val altitude: Double? = null,
    @SerializedName("accuracyMeters") val accuracyMeters: Float = 0f,
    @SerializedName("isMockLocation") val isMockLocation: Boolean = false
)

data class PlantDiagnosisPayloadDTO(
    @SerializedName("imageBase64") val imageBase64: String,
    @SerializedName("diseaseName") val diseaseName: String,
    @SerializedName("diseaseId") val diseaseId: String?,
    @SerializedName("confidenceScore") val confidenceScore: Float,
    @SerializedName("location") val location: GeoLocationData,
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("clientIp") val clientIp: String? = null,
    @SerializedName("capturedTimestampUtc") val capturedTimestampUtc: Long,
    @SerializedName("countryCode") val countryCode: String = "SD",
    @SerializedName("clientVersion") val clientVersion: String = "1.0.0-android-native",
    @SerializedName("metadata") val metadata: Map<String, Any>? = null
)

data class DiagnosisUploadResponseDTO(
    @SerializedName("success") val success: Boolean,
    @SerializedName("serverBatchId") val serverBatchId: String?,
    @SerializedName("assignedCategoryFolder") val assignedCategoryFolder: String?,
    @SerializedName("receivedTimestampUtc") val receivedTimestampUtc: Long,
    @SerializedName("message") val message: String,
    @SerializedName("statusCode") val statusCode: Int
)

data class FieldHealthResponseDTO(
    @SerializedName("fieldId") val fieldId: String,
    @SerializedName("overallHealthStatus") val overallHealthStatus: String,
    @SerializedName("healthScorePercentage") val healthScorePercentage: Int,
    @SerializedName("serverAdvisorySummary") val serverAdvisorySummary: String,
    @SerializedName("serverAdvisorySummaryAr") val serverAdvisorySummaryAr: String?
)

data class FarmerSmsAlertDTO(
    @SerializedName("smsId") val smsId: String,
    @SerializedName("senderPhoneOrAlphaId") val senderPhoneOrAlphaId: String,
    @SerializedName("messageBody") val messageBody: String,
    @SerializedName("messageBodyAr") val messageBodyAr: String?,
    @SerializedName("severity") val severity: String,
    @SerializedName("timestampUtc") val timestampUtc: Long
)

/**
 * Sudan Disease Catalog with localized treatments and immediate removal protocols.
 */
object SorghumDiseaseCatalog {
    val DISEASES = listOf(
        DiseaseInfo(
            id = "sorghum_anthracnose",
            nameEn = "Sorghum Anthracnose",
            nameAr = "أنثراكنوز الذرة الرفيعة",
            isHealthy = false,
            pesticideEn = "Mancozeb 80% WP (Dithane M-45) or Azoxystrobin + Difenoconazole (Amistar Top 325 SC)",
            pesticideAr = "مانكوزيب 80% مسحوق (Mancozeb 80% WP - Dithane M-45) أو أزوكسيستروبين + ديفينوكونازول (Amistar Top 325 SC)",
            phiDays = 14,
            descriptionEn = "Circular to elliptical spots with gray centers and dark reddish borders on the leaf blade.",
            descriptionAr = "بقع دائرية إلى بيضاوية ذات مراكز رمادية وحواف بنية محمرة مع بقع سوداء صغيرة على نصل الورقة."
        ),
        DiseaseInfo(
            id = "sorghum_head_smut",
            nameEn = "Sorghum Head Smut",
            nameAr = "تفحم قناديل الذرة الرفيعة (Head Smut)",
            isHealthy = false,
            pesticideEn = "Immediate physical removal & burning of infected heads/plants to prevent spore dispersal (Seed treatment before planting with Carboxin + Thiram)",
            pesticideAr = "الإزالة الفورية للقناديل والنباتات المصابة ووضعها في أكياس وحرقها فوراً لمنع انتشار الأبواغ (معاملة البذور قبل الزراعة بكربوكسين + ثيرام)",
            phiDays = 0,
            descriptionEn = "Floral panicles transformed into masses of dark powdery smut spores, destroying grain heads.",
            descriptionAr = "تحول العناقيد الزهرية والحبوب بالكامل إلى كتل بودرة سوداء متفحمة وتدمير القندول."
        ),
        DiseaseInfo(
            id = "sorghum_loose_smut",
            nameEn = "Sorghum Loose Smut",
            nameAr = "التفحم السائب في الذرة الرفيعة (Loose Smut)",
            isHealthy = false,
            pesticideEn = "Immediate physical roguing and burning of infected plants before black spores disperse (Use certified fungicide-treated seeds)",
            pesticideAr = "الإزالة الفورية واقتلاع النباتات المصابة بالكامل وحرقها بعيداً عن الحقل قبل تطاير الأبواغ السوداء (استخدام تقاوي معتمدة ومعاملة)",
            phiDays = 0,
            descriptionEn = "Individual grain florets replaced by thin gray membranes that rupture early, releasing loose black powdery spores.",
            descriptionAr = "تحول حبات القندول إلى أكياس رمادية رقيقة تنفجر سريعاً مطلقة سحابة من الأبواغ السوداء السائبة."
        ),
        DiseaseInfo(
            id = "sorghum_rust",
            nameEn = "Sorghum Rust",
            nameAr = "صدأ أوراق الذرة الرفيعة (Sorghum Rust)",
            isHealthy = false,
            pesticideEn = "Propiconazole 25% EC (Tilt) or Hexaconazole 5% EC (Registered in Sudan) / Azoxystrobin (Amistar Top)",
            pesticideAr = "بروبيكونازول 25% مركز (Propiconazole 25% EC - Tilt) أو هكساكونازول (Hexaconazole 5% EC) أو أزوكسيستروبين (Amistar Top)",
            phiDays = 14,
            descriptionEn = "Prominent reddish-brown pustules on both leaf surfaces releasing powdery fungal spores and causing premature leaf drying.",
            descriptionAr = "بثرات برتقالية إلى بنية محمرة بارزة على سطحي الأوراق تطلق غباراً مثل الصدأ وتسبب جفاف الأوراق."
        ),
        DiseaseInfo(
            id = "sorghum_healthy",
            nameEn = "Healthy Sorghum Plant",
            nameAr = "نبات ذرة رفيعة سليم (محصول صحي)",
            isHealthy = true,
            pesticideEn = "No pesticide required (Healthy, safe crop)",
            pesticideAr = "لا يتطلب أي مبيد (محصول سليم وآمن تماماً)",
            phiDays = 0,
            descriptionEn = "Crop is completely healthy and free from pathogen symptoms, exhibiting vibrant green foliage.",
            descriptionAr = "المحصول سليم وخالٍ من أي أعراض مرضية أو آفات، تظهر الأوراق بلون أخضر نضر وقوي."
        )
    )

    fun findById(id: String): DiseaseInfo {
        return DISEASES.find { it.id == id } ?: DISEASES.last()
    }
}

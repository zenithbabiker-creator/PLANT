package org.sorghum.health.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

data class GeoLocationDTO(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float
)

data class PlantDiagnosisPayloadDTO(
    val imageBase64: String,
    val diseaseName: String,
    val diseaseId: String?,
    val confidenceScore: Float,
    val location: GeoLocationDTO,
    val deviceId: String,
    val capturedTimestampUtc: Long,
    val clientVersion: String = "1.0.0-android"
)

data class DiagnosisUploadResponseDTO(
    val success: Boolean,
    val serverBatchId: String?,
    val assignedCategoryFolder: String?,
    val receivedTimestampUtc: Long,
    val message: String
)

data class FieldHealthResponseDTO(
    val fieldId: String,
    val overallHealthStatus: String,
    val healthScorePercentage: Int,
    val serverAdvisorySummary: String,
    val serverAdvisorySummaryAr: String?
)

interface SorghumApiService {
    @POST("sorghum/diagnoses/upload")
    suspend fun uploadDiagnosis(
        @Body payload: PlantDiagnosisPayloadDTO
    ): Response<DiagnosisUploadResponseDTO>

    @GET("remote-sensing/field-health")
    suspend fun getFieldHealth(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double
    ): Response<FieldHealthResponseDTO>
}

object NetworkClient {
    private const val BASE_URL = "https://plant-backend-2ceh.onrender.com/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    val apiService: SorghumApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SorghumApiService::class.java)
    }
}

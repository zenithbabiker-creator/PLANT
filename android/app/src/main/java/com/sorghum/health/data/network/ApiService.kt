package com.sorghum.health.data.network

import com.sorghum.health.data.model.DiagnosisUploadResponseDTO
import com.sorghum.health.data.model.FarmerSmsAlertDTO
import com.sorghum.health.data.model.FieldHealthResponseDTO
import com.sorghum.health.data.model.PlantDiagnosisPayloadDTO
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

interface SorghumApiService {

    @POST("/sorghum/diagnoses/upload")
    suspend fun uploadDiagnosis(
        @Body payload: PlantDiagnosisPayloadDTO
    ): Response<DiagnosisUploadResponseDTO>

    @GET("/remote-sensing/field-health")
    suspend fun getRemoteSensingHealth(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Int = 500,
        @Query("crop") crop: String = "sorghum"
    ): Response<FieldHealthResponseDTO>

    @GET("/advisories/sms-alerts")
    suspend fun getFarmerAlerts(
        @Query("deviceId") deviceId: String
    ): Response<List<FarmerSmsAlertDTO>>
}

object NetworkClient {
    const val BASE_URL = "https://plant-backend-2ceh.onrender.com"

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(25, TimeUnit.SECONDS)
            .writeTimeout(25, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    val apiService: SorghumApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SorghumApiService::class.java)
    }
}

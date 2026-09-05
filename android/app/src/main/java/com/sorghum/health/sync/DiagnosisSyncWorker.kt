package com.sorghum.health.sync

import android.content.Context
import android.provider.Settings
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.sorghum.health.data.local.AppDatabase
import com.sorghum.health.data.model.GeoLocationData
import com.sorghum.health.data.model.PlantDiagnosisPayloadDTO
import com.sorghum.health.data.network.NetworkClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DiagnosisSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val database = AppDatabase.getDatabase(applicationContext)
        val dao = database.diagnosisDao()
        val pendingRecords = dao.getPendingSyncRecords()

        if (pendingRecords.isEmpty()) {
            return@withContext Result.success()
        }

        val deviceId = Settings.Secure.getString(
            applicationContext.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "android_device_${android.os.Build.MODEL.replace(" ", "_")}"

        var hasFailure = false

        for (record in pendingRecords) {
            try {
                val payload = PlantDiagnosisPayloadDTO(
                    imageBase64 = record.imageBase64 ?: "",
                    diseaseName = record.diseaseNameEn,
                    diseaseId = record.diseaseId,
                    confidenceScore = record.confidence,
                    location = GeoLocationData(
                        latitude = record.latitude,
                        longitude = record.longitude,
                        accuracyMeters = 5.0f
                    ),
                    deviceId = deviceId,
                    capturedTimestampUtc = record.timestamp,
                    countryCode = "SD",
                    clientVersion = "1.0.0-android-native",
                    metadata = mapOf(
                        "isBlurry" to record.isBlurry,
                        "blurScore" to record.blurScore,
                        "initialPhiDays" to record.initialPhiDays,
                        "remainingPhiDays" to record.remainingPhiDays
                    )
                )

                val response = NetworkClient.apiService.uploadDiagnosis(payload)
                if (response.isSuccessful && response.body()?.success == true) {
                    dao.updateSyncStatus(record.id, "SYNCED")
                } else {
                    dao.updateSyncStatus(record.id, "FAILED")
                    hasFailure = true
                }
            } catch (e: Exception) {
                dao.updateSyncStatus(record.id, "FAILED")
                hasFailure = true
            }
        }

        if (hasFailure) {
            Result.retry()
        } else {
            Result.success()
        }
    }
}

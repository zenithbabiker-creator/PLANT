package com.sorghum.health.data.repository

import android.content.Context
import com.sorghum.health.data.local.DiagnosisDao
import com.sorghum.health.data.local.DiagnosisRecord
import org.json.JSONObject

data class DiseaseDetail(
    val id: Int,
    val rawCode: String,
    val name: String,
    val isSmut: Boolean,
    val isHealthy: Boolean,
    val pesticide: String,
    val treatment: String,
    val safetyIntervalDays: Int
)

class SorghumRepository(
    private val context: Context,
    private val diagnosisDao: DiagnosisDao? = null
) {

    constructor(diagnosisDao: DiagnosisDao) : this(
        context = null as Any as Context,
        diagnosisDao = diagnosisDao
    )

    /**
     * TFLite 0-Indexed Class Mapping:
     * Index 0 -> sorghum_anthracnose
     * Index 1 -> sorghum_head_smut
     * Index 2 -> sorghum_loose_smut
     * Index 3 -> sorghum_rust
     * Index 4 -> sorghum_healthy
     */
    fun getDiseaseByTfliteIndex(index: Int, isArabic: Boolean): DiseaseDetail? {
        return getDiseaseById(index, isArabic)
    }

    fun getDiseaseById(id: Int, isArabic: Boolean): DiseaseDetail? {
        return try {
            val jsonString = context.assets.open("diseases_data.json")
                .bufferedReader()
                .use { it.readText() }

            val jsonObject = JSONObject(jsonString)
            val jsonArray = jsonObject.getJSONArray("diseases")

            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                if (item.getInt("id") == id) {
                    val type = item.getString("type")
                    return DiseaseDetail(
                        id = item.getInt("id"),
                        rawCode = item.getString("raw_code"),
                        name = if (isArabic) item.getString("name_ar") else item.getString("name_en"),
                        isSmut = (type == "smut_disease"),
                        isHealthy = (type == "healthy"),
                        pesticide = if (isArabic) item.getString("pesticide_ar") else item.getString("pesticide_en"),
                        treatment = if (isArabic) item.getString("treatment_ar") else item.getString("treatment_en"),
                        safetyIntervalDays = item.getInt("safety_interval_days")
                    )
                }
            }
            null
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun getDiseaseByCode(rawCode: String, isArabic: Boolean): DiseaseDetail? {
        return try {
            val jsonString = context.assets.open("diseases_data.json")
                .bufferedReader()
                .use { it.readText() }

            val jsonObject = JSONObject(jsonString)
            val jsonArray = jsonObject.getJSONArray("diseases")

            val normalizedSearch = rawCode.trim().lowercase()

            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                val itemRawCode = item.getString("raw_code").lowercase()
                val match = itemRawCode == normalizedSearch ||
                        itemRawCode.removePrefix("sorghum_") == normalizedSearch.removePrefix("sorghum_")

                if (match) {
                    val type = item.getString("type")
                    return DiseaseDetail(
                        id = item.getInt("id"),
                        rawCode = item.getString("raw_code"),
                        name = if (isArabic) item.getString("name_ar") else item.getString("name_en"),
                        isSmut = (type == "smut_disease"),
                        isHealthy = (type == "healthy"),
                        pesticide = if (isArabic) item.getString("pesticide_ar") else item.getString("pesticide_en"),
                        treatment = if (isArabic) item.getString("treatment_ar") else item.getString("treatment_en"),
                        safetyIntervalDays = item.getInt("safety_interval_days")
                    )
                }
            }
            null
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun insertDiagnosis(record: DiagnosisRecord) {
        diagnosisDao?.insertDiagnosis(record)
    }

    suspend fun getAllDiagnoses(): List<DiagnosisRecord> {
        return diagnosisDao?.getAllDiagnoses() ?: emptyList()
    }

    suspend fun getPendingSyncRecords(): List<DiagnosisRecord> {
        return diagnosisDao?.getPendingSyncRecords() ?: emptyList()
    }
}

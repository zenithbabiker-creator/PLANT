package com.example.sorghumcrop.repository

import android.content.Context
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

class SorghumRepository(private val context: Context) {

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
}

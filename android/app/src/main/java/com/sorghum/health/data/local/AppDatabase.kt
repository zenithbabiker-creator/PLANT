package com.sorghum.health.data.local

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

/**
 * Local Room Database Entity for Sorghum Disease Diagnoses.
 * Stores on-device edge AI inferences, PHI countdowns, and offline sync state.
 */
@Entity(tableName = "sorghum_diagnoses")
data class DiagnosisRecord(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val diseaseId: String,
    val diseaseNameEn: String,
    val diseaseNameAr: String,
    val isHealthy: Boolean,
    val confidence: Float,
    val isBlurry: Boolean,
    val blurScore: Float,
    val imagePath: String = "",
    val imageBase64: String? = null,
    val latitude: Double,
    val longitude: Double,
    val remainingPhiDays: Int,
    val initialPhiDays: Int,
    val syncStatus: String = "PENDING" // PENDING, SYNCED, FAILED
)

@Dao
interface DiagnosisDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDiagnosis(record: DiagnosisRecord)

    @Query("SELECT * FROM sorghum_diagnoses ORDER BY timestamp DESC")
    fun getAllDiagnosesFlow(): Flow<List<DiagnosisRecord>>

    @Query("SELECT * FROM sorghum_diagnoses ORDER BY timestamp DESC")
    suspend fun getAllDiagnoses(): List<DiagnosisRecord>

    @Query("SELECT * FROM sorghum_diagnoses WHERE syncStatus = 'PENDING' OR syncStatus = 'FAILED'")
    suspend fun getPendingSyncRecords(): List<DiagnosisRecord>

    @Query("UPDATE sorghum_diagnoses SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String)

    @Query("UPDATE sorghum_diagnoses SET remainingPhiDays = :remainingDays WHERE id = :id")
    suspend fun updateRemainingDays(id: String, remainingDays: Int)

    @Query("DELETE FROM sorghum_diagnoses WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("SELECT COUNT(*) FROM sorghum_diagnoses WHERE syncStatus = 'PENDING'")
    fun getPendingCountFlow(): Flow<Int>
}

@Database(entities = [DiagnosisRecord::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun diagnosisDao(): DiagnosisDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "sorghum_health_ai.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}

-keep class org.tensorflow.lite.** { *; }
-keep class org.tensorflow.lite.support.** { *; }
-dontwarn org.tensorflow.lite.**

# Keep Data Transfer Objects (DTOs)
-keep class org.sorghum.health.data.dto.** { *; }
-keepclassmembers class org.sorghum.health.data.dto.** { *; }

# Keep Room entities
-keep class androidx.room.RoomDatabase
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

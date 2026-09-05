-keep class org.tensorflow.lite.** { *; }
-keep class org.tensorflow.lite.support.** { *; }
-dontwarn org.tensorflow.lite.**

# Keep Data Transfer Objects (DTOs) and Models
-keep class com.sorghum.health.data.model.** { *; }
-keepclassmembers class com.sorghum.health.data.model.** { *; }
-keep class com.sorghum.health.data.network.** { *; }
-keepclassmembers class com.sorghum.health.data.network.** { *; }

# Keep Room entities
-keep class androidx.room.RoomDatabase
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

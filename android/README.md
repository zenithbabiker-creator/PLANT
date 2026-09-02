# Sorghum Health AI - Android Packaging & Source Code

حزمة مشروع أندرويد المتكاملة لتطبيق **تشخيص أمراض الذرة الرفيعة بالذكاء الاصطناعي الطرفي (Offline Edge AI)** المعتمد في السودان.

---

## 📁 هيكلية مشروع أندرويد (Android Project Structure)

```text
android/
├── build.gradle.kts                      # ملف إعدادات البناء الرئيسي للـ Gradle
├── settings.gradle.kts                   # تعريف الموديول والمستودعات (Google, MavenCentral)
├── gradle.properties                     # خصائص الذاكرة وتفعيل AndroidX
├── gradle/
│   ├── libs.versions.toml                # كتالوج الإصدارات (Gradle Version Catalog)
│   └── wrapper/
│       └── gradle-wrapper.properties     # محدد إصدار Gradle 8.7
└── app/
    ├── build.gradle.kts                  # إعدادات تطبيق أندرويد مع TFLite, Room, WorkManager, CameraX
    ├── proguard-rules.pro                # قواعد التعتيم والحماية للـ Production
    └── src/
        └── main/
            ├── AndroidManifest.xml       # الأذونات (الكاميرا، الموقع الجغرافي، الإنترنت، الإشعارات)
            ├── assets/
            │   ├── sorghum_disease_model.tflite   # ملف أوزان النموذج العصبي TFLite
            │   ├── labels.txt                     # الفئات الـ 5 المعتمدة
            │   └── model_info.json                # بيانات أبعاد المدخلات والتطبيع (224x224 RGB)
            ├── java/com/sorghum/health/
            │   ├── SorghumApplication.kt          # مشغل تطبيق أندرويد ومجدول WorkManager
            │   ├── MainActivity.kt                # واجهة Jetpack Compose والتفاعل البصري
            │   ├── ml/
            │   │   └── TFLiteSorghumClassifier.kt # محرك الاستدلال العصبي مع تسريع GPU Delegate
            │   ├── data/
            │   │   ├── model/Entities.kt          # كائنات البيانات وبروتوكول العلاج بالسودان
            │   │   ├── local/AppDatabase.kt       # قاعدة بيانات Room المحلية للتخزين الأوفلاين
            │   │   └── network/ApiService.kt      # خدمة الاتصال بالسيرفر plant-backend-2ceh.onrender.com
            │   └── sync/
            │       └── DiagnosisSyncWorker.kt     # مزامنة الخلفية الموثوقة مع السيرفر
            └── res/
                ├── drawable/
                │   ├── ic_launcher_background.xml # خلفية الأيقونة المتكيفة
                │   └── ic_launcher_foreground.xml # شعار الذرة الرفيعة وقوس المسح الذكي
                ├── mipmap-anydpi-v26/
                │   ├── ic_launcher.xml            # الأيقونة الرسمية المتكيفة
                │   └── ic_launcher_round.xml      # الأيقونة الدائرية
                ├── values/
                │   ├── colors.xml                 # الألوان المعتمدة (الزمردي، الذهبي، الداكن)
                │   ├── strings.xml                # النصوص الإنجليزية
                │   └── themes.xml                 # ثيم Material 3
                ├── values-ar/
                │   └── strings.xml                # النصوص العربية
                └── xml/
                    ├── file_paths.xml             # FileProvider لمشاركة وحفظ صور الكاميرا
                    ├── network_security_config.xml# تأمين الاتصال بالسيرفر
                    └── data_extraction_rules.xml  # سياسات النسخ الاحتياطي
```

---

## 🌾 الفئات المصنفة (5 TFLite Output Classes)

1. `sorghum_anthracnose` : أنثراكنوز الذرة الرفيعة (العلاج: مانكوزيب 80% مسحوق `Mancozeb 80% WP` أو `Amistar Top` مع فترة أمان 14 يوماً).
2. `sorghum_head_smut` : تفحم قناديل الذرة الرفيعة (العلاج المعتمد: **الإزالة الفورية والحرق للقناديل المصابة**).
3. `sorghum_loose_smut` : التفحم السائب (العلاج المعتمد: **الإزالة الفورية واقتلاع النباتات وحرقها فوراً**).
4. `sorghum_rust` : صدأ أوراق الذرة الرفيعة (العلاج: بروبيكونازول 25% `Propiconazole 25% EC - Tilt` أو هكساكونازول مع فترة أمان 14 يوماً).
5. `sorghum_healthy` : نبات ذرة رفيعة سليم (لا يتطلب أي مبيد).

---

## 🌐 رابط السيرفر المتصل (Server Endpoint)

تم ضبط كافة اتصالات Retrofit و OkHttp و WorkManager للاتصال التلقائي بـ:
```
https://plant-backend-2ceh.onrender.com
```
* **مسار رفع الفحوصات:** `/sorghum/diagnoses/upload`
* **مسار صحة الحقل والاستشعار عن بعد:** `/remote-sensing/field-health`
* **مسار تنبيهات المزارعين (SMS):** `/advisories/sms-alerts`

---

## 🚀 كيفية تشغيل وبناء التطبيق على Android Studio

1. افتح مجلد `android/` في **Android Studio (Hedgehog / Iguana / Jellyfish)**.
2. ضع ملف الأوزان العصبي الحقيقي الخاص بك باسم `sorghum_disease_model.tflite` داخل مسار:
   `android/app/src/main/assets/sorghum_disease_model.tflite`
3. قم بتشغيل أمر البناء لإنشاء حزمة APK:
   ```bash
   ./gradlew assembleDebug
   # أو لإنشاء حزمة الإصدار الموقعة للنشر:
   ./gradlew assembleRelease
   ```
4. سيتم توليد ملف APK داخل المجلد:
   `android/app/build/outputs/apk/debug/app-debug.apk`

import { DiseaseEntity } from '../types';

/**
 * Sorghum Disease Entities aligned with TFLite model output labels:
 * 1. sorghum_anthracnose
 * 2. sorghum_head_smut
 * 3. sorghum_loose_smut
 * 4. sorghum_rust
 * 5. sorghum_healthy
 *
 * Treatments for this pilot version are aligned with approved recommendations in Sudan,
 * with immediate physical removal & burning for smut diseases.
 */
export const INITIAL_SORGHUM_DISEASES: DiseaseEntity[] = [
  {
    id_disease: 'sorghum_anthracnose',
    disease_name: 'Sorghum Anthracnose',
    disease_name_ar: 'أنثراكنوز الذرة الرفيعة',
    disease_name_sw: 'Ukungu wa Anthracnose kwenye Mtama',
    disease_name_rw: 'Anthracnose y’Amasaka',
    disease_name_ny: 'Matenda a Anthracnose a Mapira',
    is_healthy: false,
    recommended_pesticide: 'Mancozeb 80% WP (Dithane M-45) or Azoxystrobin + Difenoconazole (Amistar Top 325 SC)',
    recommended_pesticide_ar: 'مانكوزيب 80% مسحوق (Mancozeb 80% WP - Dithane M-45) أو أزوكسيستروبين + ديفينوكونازول (Amistar Top 325 SC)',
    phi_days: 14,
    sample_image_url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    description_ar: 'بقع دائرية إلى بيضاوية ذات مراكز رمادية وحواف بنية محمرة مع بقع سوداء صغيرة على نصل الورقة.',
    description_en: 'Circular to elliptical spots with gray centers and dark reddish borders on the leaf blade.',
    description_sw: 'Madoa ya mviringo yenye kitovu cha kijivu na kingo nyekundu kwenye majani ya mtama.',
    description_rw: 'Amabara y’uruziga afite hagati h’imvi n’inkombe zitukura ku kibabi cy’amasaka.',
    description_ny: 'Mawanga ozungulira okhala ndi pakati pathupi la phulusa ndi m’mbali mofiyira pamasamba.'
  },
  {
    id_disease: 'sorghum_head_smut',
    disease_name: 'Sorghum Head Smut',
    disease_name_ar: 'تفحم قناديل الذرة الرفيعة (Head Smut)',
    disease_name_sw: 'Ugonjwa wa Kisunzi (Head Smut)',
    disease_name_rw: 'Urubori rw’Amasaka (Head Smut)',
    disease_name_ny: 'Matenda a Mwayi a Mapira',
    is_healthy: false,
    recommended_pesticide: 'Immediate physical removal & burning of infected heads/plants to prevent spore dispersal (Seed treatment before planting with Carboxin + Thiram)',
    recommended_pesticide_ar: 'الإزالة الفورية للقناديل والنباتات المصابة ووضعها في أكياس وحرقها فوراً لمنع انتشار الأبواغ (معاملة البذور قبل الزراعة بكربوكسين + ثيرام)',
    phi_days: 0,
    sample_image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    description_ar: 'تحول العناقيد الزهرية والحبوب بالكامل إلى كتل بودرة سوداء متفحمة وتدمير القندول.',
    description_en: 'Floral panicles transformed into masses of dark powdery smut spores, destroying grain heads.',
    description_sw: 'Kichwa cha mtama kinaharibika na kuwa unga mweusi wa vimelea; inahitaji kung’olewa mara moja na kuchomwa moto.',
    description_rw: 'Isaka ryose rihinduka ifu y’umukara y’ibihumyo; bisaba kurandura igihingwa no kugitwika ako kanya.',
    description_ny: 'Kachulu ka mapira kasanduka ufa wakuda wa bowa; chimafunika kudzula ndi kutentha nthawi yomweyo.'
  },
  {
    id_disease: 'sorghum_loose_smut',
    disease_name: 'Sorghum Loose Smut',
    disease_name_ar: 'التفحم السائب في الذرة الرفيعة (Loose Smut)',
    disease_name_sw: 'Ugonjwa wa Kisunzi Huru (Loose Smut)',
    disease_name_rw: 'Urubori Rurekuye rw’Amasaka (Loose Smut)',
    disease_name_ny: 'Matenda a Mwayi Omasuka a Mapira',
    is_healthy: false,
    recommended_pesticide: 'Immediate physical roguing and burning of infected plants before black spores disperse (Use certified fungicide-treated seeds)',
    recommended_pesticide_ar: 'الإزالة الفورية واقتلاع النباتات المصابة بالكامل وحرقها بعيداً عن الحقل قبل تطاير الأبواغ السوداء (استخدام تقاوي معتمدة ومعاملة)',
    phi_days: 0,
    sample_image_url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80',
    description_ar: 'تحول حبات القندول إلى أكياس رمادية رقيقة تنفجر سريعاً مطلقة سحابة من الأبواغ السوداء السائبة.',
    description_en: 'Individual grain florets replaced by thin gray membranes that rupture early, releasing loose black powdery spores.',
    description_sw: 'Mbegu za mtama zinabadilika kuwa unga mweusi unaotawanyika hewani; zingoeni na kuzichoma moto haraka.',
    description_rw: 'Impeke z’isaka zihinduka ifu y’umukara ikwirakwira mu murima; birasaba kurandura igihingwa cyose no kugitwika.',
    description_ny: 'Njere za mapira zimasanduka ufa wakuda owuluka; zulanani ndi kutentha zisanapatsire mbewu zina.'
  },
  {
    id_disease: 'sorghum_rust',
    disease_name: 'Sorghum Rust',
    disease_name_ar: 'صدأ أوراق الذرة الرفيعة (Sorghum Rust)',
    disease_name_sw: 'Kutu ya Majani ya Mtama (Sorghum Rust)',
    disease_name_rw: 'Ingese y’Ibibabi by’Amasaka',
    disease_name_ny: 'Dzimbiri la Masamba a Mapira',
    is_healthy: false,
    recommended_pesticide: 'Propiconazole 25% EC (Tilt) or Hexaconazole 5% EC (Registered in Sudan) / Azoxystrobin (Amistar Top)',
    recommended_pesticide_ar: 'بروبيكونازول 25% مركز (Propiconazole 25% EC - Tilt) أو هكساكونازول (Hexaconazole 5% EC) أو أزوكسيستروبين (Amistar Top)',
    phi_days: 14,
    sample_image_url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80',
    description_ar: 'بثرات برتقالية إلى بنية محمرة بارزة على سطحي الأوراق تطلق غباراً مثل الصدأ وتسبب جفاف الأوراق.',
    description_en: 'Prominent reddish-brown pustules on both leaf surfaces releasing powdery fungal spores and causing premature leaf drying.',
    description_sw: 'Upele wa rangi ya hudhurungi na machungwa pande zote za majani unaotoa vumbi kama kutu.',
    description_rw: 'Utubyimba tw’ikigina cyangwa icunga hejuru no munsi y’ikibabi bituma cyuma vuba.',
    description_ny: 'Mapepala ofiira ndi lalanje pamwamba ndi pansi pa masamba otulutsa ufa ngati dzimbiri.'
  },
  {
    id_disease: 'sorghum_healthy',
    disease_name: 'Healthy Sorghum Plant',
    disease_name_ar: 'نبات ذرة رفيعة سليم (محصول صحي)',
    disease_name_sw: 'Mmea wa Mtama Wenye Afya',
    disease_name_rw: 'Igihingwa cy’Isaka Kizima',
    disease_name_ny: 'Chomera cha Mapira Chathanzi',
    is_healthy: true,
    recommended_pesticide: 'No pesticide required (Healthy, safe crop)',
    recommended_pesticide_ar: 'لا يتطلب أي مبيد (محصول سليم وآمن تماماً)',
    phi_days: 0,
    sample_image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    description_ar: 'المحصول سليم وخالٍ من أي أعراض مرضية أو آفات، تظهر الأوراق بلون أخضر نضر وقوي.',
    description_en: 'Crop is completely healthy and free from pathogen symptoms, exhibiting vibrant green foliage.',
    description_sw: 'Mmea una afya kamili na hauna dalili zozote za magonjwa, unaonyesha majani ya kijani kibichi.',
    description_rw: 'Igihingwa kirazima neza nta bimenyetso by’indwara gifite, gifite ibibabi by’icyatsi kibisi cyiza.',
    description_ny: 'Chomeracho n’chathanzi kwathunthu ndipo chilibe zizindikiro za matenda, chili ndi masamba obiriwira bwino.'
  }
];

export function getLocalizedDisease(disease: DiseaseEntity, lang: string): {
  name: string;
  pesticide: string;
  description: string;
} {
  let name = disease.disease_name;
  let pesticide = disease.recommended_pesticide;
  let description = disease.description_en || disease.disease_name;

  if (lang === 'ar') {
    name = disease.disease_name_ar || disease.disease_name;
    pesticide = disease.recommended_pesticide_ar || disease.recommended_pesticide;
    description = disease.description_ar || description;
  } else if (lang === 'sw') {
    name = disease.disease_name_sw || disease.disease_name;
    description = disease.description_sw || description;
  } else if (lang === 'rw') {
    name = disease.disease_name_rw || disease.disease_name;
    description = disease.description_rw || description;
  } else if (lang === 'ny') {
    name = disease.disease_name_ny || disease.disease_name;
    description = disease.description_ny || description;
  }

  return { name, pesticide, description };
}

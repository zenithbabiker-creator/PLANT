import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  EyeOff, 
  Database, 
  Clock, 
  SprayCan, 
  ShieldCheck, 
  RotateCcw,
  Check,
  MapPin,
  Globe,
  Calendar,
  CloudCheck
} from 'lucide-react';
import { DiagnosisResult } from '../types';
import { SorghumLocalRoomDatabase } from '../data/local/roomDb';
import { getLocalizedDisease } from '../data/diseasesDatabase';
import { 
  SupportedLocale, 
  SupportedCountryCode, 
  COUNTRY_CONFIGS, 
  getStringsForCountry 
} from '../data/i18n';
import { PhiCountdownView } from './PhiCountdownView';

export type WorkflowStage = 1 | 2 | 3 | 4 | 5 | 6;

interface InteractiveTreatmentWorkflowProps {
  diagnosis: DiagnosisResult;
  locale?: SupportedLocale;
  countryCode?: SupportedCountryCode;
  onAdvanceDays: (days: number) => void;
  onResetDays?: (days: number) => void;
  onResetDiagnosis: () => void;
}

export const InteractiveTreatmentWorkflow: React.FC<InteractiveTreatmentWorkflowProps> = ({
  diagnosis,
  locale = 'ar',
  countryCode,
  onAdvanceDays,
  onResetDays,
  onResetDiagnosis
}) => {
  const activeCountry = countryCode || 'sudan';
  const countryConfig = COUNTRY_CONFIGS[activeCountry] || COUNTRY_CONFIGS.sudan;
  const effectiveLang = locale || countryConfig.primaryLanguage;
  const t = getStringsForCountry(activeCountry, locale);
  const db = SorghumLocalRoomDatabase.getInstance();

  // Localized disease info
  const localizedDisease = diagnosis.disease 
    ? getLocalizedDisease(diagnosis.disease, effectiveLang)
    : null;

  // Active stage progression (1 -> 2 -> 3 -> 4 -> 5 -> 6)
  const [currentStage, setCurrentStage] = useState<WorkflowStage>(1);
  const [dbPesticideData, setDbPesticideData] = useState<{
    pesticideName: string;
    phiDays: number;
    diseaseName: string;
    isHealthy: boolean;
  } | null>(null);

  // Status breakdown
  const isHealthy = diagnosis.status === 'HEALTHY' || diagnosis.disease?.is_healthy;
  const isBlurry = diagnosis.status === 'BLURRY';
  const isDiseased = diagnosis.status === 'DISEASED';

  // Wide area color mapping based strictly on diagnosis result
  let wideBgColor = 'from-slate-900 via-slate-900 to-slate-950 border-slate-800';
  let wideBannerBg = 'bg-slate-800 text-slate-200 border-slate-700';
  let wideGlow = 'shadow-slate-950/50';

  if (currentStage >= 2) {
    if (isHealthy) {
      wideBgColor = 'from-emerald-950/80 via-emerald-900/40 to-slate-950 border-emerald-500/60';
      wideBannerBg = 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-400/50';
      wideGlow = 'shadow-2xl shadow-emerald-600/30';
    } else if (isBlurry) {
      wideBgColor = 'from-amber-950/80 via-amber-900/40 to-slate-950 border-amber-500/60';
      wideBannerBg = 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300';
      wideGlow = 'shadow-2xl shadow-amber-600/30';
    } else {
      wideBgColor = 'from-rose-950/90 via-rose-900/40 to-slate-950 border-rose-500/70';
      wideBannerBg = 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-400/50';
      wideGlow = 'shadow-2xl shadow-rose-600/30';
    }
  }

  // Automatic sequential progression from Stage 1 to Stage 6
  useEffect(() => {
    setCurrentStage(1);

    const diseaseId = diagnosis.disease?.id_disease || 'unknown';
    const queried = db.getPesticideForDisease(diseaseId);
    setDbPesticideData(queried);

    const timer1 = setTimeout(() => setCurrentStage(2), 300);
    const timer2 = setTimeout(() => setCurrentStage(3), 750);
    const timer3 = setTimeout(() => setCurrentStage(4), 1200);
    const timer4 = setTimeout(() => setCurrentStage(5), 1700);
    const timer5 = setTimeout(() => setCurrentStage(6), 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [diagnosis.id]);

  const stagesList: { num: WorkflowStage; title: string; shortLabel: string }[] = [
    { num: 1, title: t.workflowStage1, shortLabel: effectiveLang === 'ar' ? 'فحص' : 'Scan' },
    { num: 2, title: t.workflowStage2, shortLabel: effectiveLang === 'ar' ? 'لون' : 'Color' },
    { num: 3, title: t.workflowStage3, shortLabel: effectiveLang === 'ar' ? 'مرض' : 'Disease' },
    { num: 4, title: t.workflowStage4, shortLabel: effectiveLang === 'ar' ? 'مبيد' : 'Pesticide' },
    { num: 5, title: t.workflowStage5, shortLabel: 'PHI' },
    { num: 6, title: t.workflowStage6, shortLabel: effectiveLang === 'ar' ? 'علب' : 'Cans' }
  ];

  const formattedDate = new Date(diagnosis.timestamp).toLocaleDateString(
    effectiveLang === 'ar' ? 'ar-EG' : 'en-US',
    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div className="w-full space-y-4">
      {/* 1. METADATA RECORD BAR (Local Storage & GPS & IP Confirmation) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 backdrop-blur-md shadow-lg shadow-black/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {diagnosis.imageUri && (
            <img
              src={diagnosis.imageUri}
              alt="Diagnosed leaf"
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {effectiveLang === 'ar' ? 'محفوظ محلياً (Room DB)' : 'Stored Locally (Room DB)'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ID: {diagnosis.id.slice(-7)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap font-medium">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>IP: {diagnosis.userIp || '127.0.0.1'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{diagnosis.gps.latitude.toFixed(2)}°, {diagnosis.gps.longitude.toFixed(2)}°</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentStage(1);
            setTimeout(() => setCurrentStage(2), 300);
            setTimeout(() => setCurrentStage(3), 750);
            setTimeout(() => setCurrentStage(4), 1200);
            setTimeout(() => setCurrentStage(5), 1700);
            setTimeout(() => setCurrentStage(6), 2300);
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="Replay sequence"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">{effectiveLang === 'ar' ? 'إعادة العرض' : 'Replay'}</span>
        </button>
      </div>

      {/* 2. VISUAL WORKFLOW SEQUENCE PROGRESSION */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 backdrop-blur-md">
        <div className="grid grid-cols-6 gap-1 md:gap-1.5">
          {stagesList.map((st) => {
            const isCompleted = currentStage >= st.num;
            const isCurrent = currentStage === st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStage(st.num)}
                className={`py-1.5 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center border ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                    : isCompleted
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-mono font-black">
                  {isCompleted && !isCurrent ? (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  ) : (
                    <span>{st.num}</span>
                  )}
                </div>
                <span className="text-[9px] md:text-[10px] font-bold block truncate max-w-full mt-0.5">
                  {st.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. WIDE DYNAMIC CONTAINER */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full rounded-3xl border-2 p-5 md:p-6 transition-all duration-500 bg-gradient-to-b ${wideBgColor} ${wideGlow}`}
      >
        {/* WIDE STATUS BANNER */}
        <div className={`w-full py-3 px-4 rounded-2xl mb-5 flex items-center justify-between shadow-md border ${wideBannerBg}`}>
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            ) : isBlurry ? (
              <EyeOff className="w-7 h-7 stroke-[2.5]" />
            ) : (
              <AlertOctagon className="w-7 h-7 stroke-[2.5]" />
            )}
            <div>
              <h3 className="text-base md:text-lg font-black leading-tight">
                {isHealthy ? t.wideColorGreenTitle : isBlurry ? t.wideColorYellowTitle : t.wideColorRedTitle}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {isHealthy ? t.wideColorGreenDesc : isBlurry ? t.wideColorYellowDesc : t.wideColorRedDesc}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-black/20 border border-white/20">
            {Math.round(diagnosis.confidence * 100)}% {effectiveLang === 'ar' ? 'دقة' : 'Acc'}
          </span>
        </div>

        {/* STEP DETAILS */}
        <div className="space-y-4">
          {/* STEP 3: Detected Disease Details */}
          <AnimatePresence>
            {currentStage >= 3 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {t.workflowStage3}
                      </span>
                      {isDiseased && (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                          {effectiveLang === 'ar' ? '🔴 إصابة محصول' : '🔴 Infection'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-white">
                      {localizedDisease?.name || diagnosis.disease?.disease_name_ar || diagnosis.disease?.disease_name}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {localizedDisease?.description || diagnosis.disease?.description_ar || 'On-Device AI pathogen classification completed.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800/80 text-center text-xs text-slate-500">
                {t.workflowStage3}...
              </div>
            )}
          </AnimatePresence>

          {/* STEP 4: Query Database for Recommended Pesticide */}
          <AnimatePresence>
            {currentStage >= 4 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span className="text-[11px] font-bold text-sky-400">
                    {t.workflowStage4} (Room SQLite Repository)
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      {t.dbPesticideFound}
                    </span>
                    <strong className="text-sm md:text-base text-white font-black block mt-0.5">
                      {localizedDisease?.pesticide || dbPesticideData?.pesticideName || diagnosis.disease?.recommended_pesticide}
                    </strong>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-sky-950 text-sky-300 border border-sky-800 text-xs font-bold font-mono">
                    {effectiveLang === 'ar' ? 'جاهز للاستعلام' : 'Synchronized'}
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800/80 text-center text-xs text-slate-500">
                {t.queryingDbPesticide}
              </div>
            )}
          </AnimatePresence>

          {/* STEP 5 & 6: CALCULATE PHI & REVEAL SPRAY CANS */}
          <AnimatePresence>
            {currentStage >= 5 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* PHI Calculation Callout Card */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block">
                        {t.workflowStage5} (Pre-Harvest Interval)
                      </span>
                      <h4 className="text-sm md:text-base font-black text-white">
                        {t.calculatedPhiResult}{' '}
                        <span className="text-amber-400 font-mono text-lg">
                          {diagnosis.initialPhiDays || 0} {t.daysRemaining}
                        </span>
                      </h4>
                    </div>
                  </div>
                </div>

                {/* STEP 6: Reveal Spray Cans Grid */}
                {currentStage >= 6 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <PhiCountdownView
                      diagnosis={diagnosis}
                      onAdvanceDays={onAdvanceDays}
                      onResetDays={onResetDays}
                      locale={locale}
                      countryCode={activeCountry}
                      isCansRevealed={true}
                    />
                  </motion.div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border-2 border-dashed border-amber-500/30 text-center space-y-2">
                    <SprayCan className="w-8 h-8 text-amber-400/50 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-amber-300">
                      {t.cansLockedNotice}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800/80 text-center text-xs text-slate-500">
                {t.calculatingPhi}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

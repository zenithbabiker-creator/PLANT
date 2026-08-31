import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  EyeOff, 
  Database, 
  Clock, 
  SprayCan, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sprout,
  Check
} from 'lucide-react';
import { DiagnosisResult, DiseaseEntity } from '../types';
import { SorghumLocalRoomDatabase } from '../data/local/roomDb';
import { getLocalizedDisease } from '../data/diseasesDatabase';
import { 
  SupportedLocale, 
  SupportedCountryCode, 
  STRINGS, 
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
  const effectiveLang = countryConfig.primaryLanguage;
  const t = getStringsForCountry(activeCountry);
  const isRtl = countryConfig.direction === 'rtl';
  const db = SorghumLocalRoomDatabase.getInstance();

  // Localized disease info
  const localizedDisease = diagnosis.disease 
    ? getLocalizedDisease(diagnosis.disease, effectiveLang)
    : null;

  // Active stage progression (1 -> 2 -> 3 -> 4 -> 5 -> 6)
  const [currentStage, setCurrentStage] = useState<WorkflowStage>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
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
  // Green: Healthy/Safe | Yellow: Warning/Blurry/Mild | Red: Danger/Severe
  let wideBgColor = 'from-slate-900 via-slate-900 to-slate-950 border-slate-800';
  let wideBannerBg = 'bg-slate-800 text-slate-200 border-slate-700';
  let wideBadgeColor = 'bg-slate-800 text-slate-300';
  let wideGlow = 'shadow-slate-950/50';
  let wideAccentText = 'text-slate-400';

  if (currentStage >= 2) {
    if (isHealthy) {
      wideBgColor = 'from-emerald-950/80 via-emerald-900/40 to-slate-950 border-emerald-500/60';
      wideBannerBg = 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-400/50';
      wideBadgeColor = 'bg-emerald-500 text-slate-950';
      wideGlow = 'shadow-2xl shadow-emerald-600/30';
      wideAccentText = 'text-emerald-400';
    } else if (isBlurry) {
      wideBgColor = 'from-amber-950/80 via-amber-900/40 to-slate-950 border-amber-500/60';
      wideBannerBg = 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300';
      wideBadgeColor = 'bg-amber-400 text-slate-950';
      wideGlow = 'shadow-2xl shadow-amber-600/30';
      wideAccentText = 'text-amber-400';
    } else {
      wideBgColor = 'from-rose-950/90 via-rose-900/40 to-slate-950 border-rose-500/70';
      wideBannerBg = 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-400/50';
      wideBadgeColor = 'bg-rose-500 text-white';
      wideGlow = 'shadow-2xl shadow-rose-600/30';
      wideAccentText = 'text-rose-400';
    }
  }

  // Automatic sequential progression from Stage 1 to Stage 6
  useEffect(() => {
    setCurrentStage(1);
    setIsAutoPlaying(true);

    const diseaseId = diagnosis.disease?.id_disease || 'unknown';
    const queried = db.getPesticideForDisease(diseaseId);
    setDbPesticideData(queried);

    const timer1 = setTimeout(() => setCurrentStage(2), 350);  // 1 -> 2 (Change wide area color)
    const timer2 = setTimeout(() => setCurrentStage(3), 850);  // 2 -> 3 (Display disease name & info)
    const timer3 = setTimeout(() => setCurrentStage(4), 1400); // 3 -> 4 (Query DB for pesticide)
    const timer4 = setTimeout(() => setCurrentStage(5), 2000); // 4 -> 5 (Calculate & display PHI)
    const timer5 = setTimeout(() => {
      setCurrentStage(6); // 5 -> 6 (Reveal spray cans)
      setIsAutoPlaying(false);
    }, 2700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [diagnosis.id]);

  const stagesList: { num: WorkflowStage; title: string; desc: string; shortLabel: string }[] = [
    { num: 1, title: t.workflowStage1, desc: t.statusIdle, shortLabel: effectiveLang === 'ar' ? 'فحص' : 'Scan' },
    { num: 2, title: t.workflowStage2, desc: isHealthy ? t.wideColorGreenTitle : isBlurry ? t.wideColorYellowTitle : t.wideColorRedTitle, shortLabel: effectiveLang === 'ar' ? 'لون' : 'Color' },
    { num: 3, title: t.workflowStage3, desc: localizedDisease?.name || t.workflowStage3, shortLabel: effectiveLang === 'ar' ? 'مرض' : 'Disease' },
    { num: 4, title: t.workflowStage4, desc: localizedDisease?.pesticide || dbPesticideData?.pesticideName || t.workflowStage4, shortLabel: effectiveLang === 'ar' ? 'مبيد' : 'Pesticide' },
    { num: 5, title: t.workflowStage5, desc: `${diagnosis.initialPhiDays || 0} ${t.daysRemaining}`, shortLabel: 'PHI' },
    { num: 6, title: t.workflowStage6, desc: t.sprayCanDayActive, shortLabel: effectiveLang === 'ar' ? 'علب' : 'Cans' }
  ];

  return (
    <div className="w-full space-y-4">
      {/* 1. VISUAL WORKFLOW SEQUENCE TRACKER (UI Trigger Order) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{t.workflowSequenceTitle}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {effectiveLang === 'ar' ? `المرحلة ${currentStage} / 6` : `Stage ${currentStage} / 6`}
            </span>
            <button
              onClick={() => {
                setCurrentStage(1);
                setTimeout(() => setCurrentStage(2), 350);
                setTimeout(() => setCurrentStage(3), 850);
                setTimeout(() => setCurrentStage(4), 1400);
                setTimeout(() => setCurrentStage(5), 2000);
                setTimeout(() => setCurrentStage(6), 2700);
              }}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Replay sequence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Step Progression Bar */}
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
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 scale-102'
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

      {/* 2. THE WIDE SCREEN AREA WITH DYNAMIC BACKGROUND COLOR (Phase 1 / Step 2) */}
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

        {/* 3. PHASE 2: DISPLAY DISEASE & QUERY DATABASE PESTICIDE */}
        <div className="space-y-4">
          {/* STEP 3: Detected Disease Details (Revealed at Stage >= 3) */}
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

          {/* STEP 4: Query Database for Recommended Pesticide (Revealed at Stage >= 4) */}
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

          {/* STEP 5 & 6: CALCULATE PHI & THEN REVEAL PESTICIDE CANS */}
          <AnimatePresence>
            {currentStage >= 5 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* PHI Calculation Callout Card (Step 5) */}
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

                  {currentStage < 6 && (
                    <span className="text-[11px] text-slate-400 font-medium animate-pulse">
                      {t.cansLockedNotice}
                    </span>
                  )}
                </div>

                {/* STEP 6: Reveal Spray Cans Grid ONLY at Stage 6 */}
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
                    <p className="text-[11px] text-slate-400">
                      {t.workflowStage6}...
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

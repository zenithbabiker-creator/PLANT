import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, SprayCan, AlertTriangle, ShieldCheck, Sparkles, Clock, Flame, Scissors } from 'lucide-react';
import { DiagnosisResult } from '../types';
import { SupportedLocale, SupportedCountryCode, STRINGS, getStringsForCountry } from '../data/i18n';

interface PhiCountdownViewProps {
  diagnosis: DiagnosisResult;
  onAdvanceDays: (days: number) => void;
  onResetDays?: (days: number) => void;
  locale?: SupportedLocale;
  countryCode?: SupportedCountryCode;
  isCansRevealed?: boolean;
}

export const PhiCountdownView: React.FC<PhiCountdownViewProps> = ({
  diagnosis,
  onAdvanceDays,
  onResetDays,
  locale = 'ar',
  countryCode,
  isCansRevealed = true
}) => {
  const t = countryCode ? getStringsForCountry(countryCode) : (STRINGS[locale] || STRINGS.ar);
  const isHealthy = diagnosis.status === 'HEALTHY' || diagnosis.disease?.is_healthy;
  const isSmutDisease = diagnosis.disease?.id_disease === 'sorghum_head_smut' || diagnosis.disease?.id_disease === 'sorghum_loose_smut';
  const initialDays = diagnosis.initialPhiDays || diagnosis.disease?.phi_days || 0;
  const remainingDays = diagnosis.remainingPhiDays !== undefined ? diagnosis.remainingPhiDays : initialDays;
  const isHarvestReady = isHealthy || (remainingDays === 0 && !isSmutDisease);

  // Custom Spray Can SVG Icon for crisp rendering
  const SprayIcon = ({ active }: { active: boolean }) => (
    <div
      className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
        active
          ? 'bg-amber-500/15 border border-amber-500/50 shadow-sm shadow-amber-500/20 text-amber-400 scale-100'
          : 'bg-slate-950/60 border border-dashed border-slate-800 text-slate-600 opacity-40 scale-90'
      }`}
    >
      <div className="relative">
        <SprayCan className="w-8 h-8 md:w-9 md:h-9" strokeWidth={2.2} />
        {active && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
        )}
      </div>
      <span className="text-[11px] font-bold mt-1 tracking-wider">
        {active ? t.sprayCanDayActive : t.sprayCanDayPassed}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl shadow-black/20 p-5 md:p-6 transition-all backdrop-blur-sm">
      {/* Header Info - Minimal Text, Maximum Visual Clarity */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
              isSmutDisease
                ? 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                : isHarvestReady 
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' 
                  : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
            }`}
          >
            {isSmutDisease ? (
              <Flame className="w-6 h-6 text-rose-400" />
            ) : isHarvestReady ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <Clock className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white leading-tight">
              {isSmutDisease 
                ? (locale === 'ar' ? 'العلاج المعتمد: الإزالة الفورية' : 'Approved Treatment: Immediate Removal')
                : isHarvestReady ? t.phiHarvestReady : t.phiTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
              {diagnosis.disease?.recommended_pesticide_ar || diagnosis.disease?.recommended_pesticide || t.recommendedPesticide}
            </p>
          </div>
        </div>

        {/* Big Numerical Badge for quick glance */}
        <div
          className={`px-3.5 py-1.5 rounded-full font-black text-sm flex items-center gap-1.5 border shadow-sm ${
            isSmutDisease
              ? 'bg-rose-600 text-white border-rose-400/40 shadow-rose-600/30'
              : isHarvestReady
                ? 'bg-emerald-600 text-white border-emerald-400/40 shadow-emerald-600/30'
                : 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30'
          }`}
        >
          {isSmutDisease ? (
            <>
              <Flame className="w-4 h-4" />
              <span>{locale === 'ar' ? 'إزالة فورية' : 'Immediate'}</span>
            </>
          ) : isHarvestReady ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.readyZeroDays}</span>
            </>
          ) : (
            <>
              <span className="text-base">{remainingDays}</span>
              <span className="text-xs">{t.daysRemainingShort}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Countdown Display: Smut Card OR Repeated Spray Cans OR Big Golden Harvest Checkmark */}
      <div className="py-2">
        <AnimatePresence mode="wait">
          {isSmutDisease ? (
            /* SMUT DISEASE IMMEDIATE REMOVAL ACTION CARD */
            <motion.div
              key="smut-removal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-gradient-to-b from-rose-950/50 via-slate-950/90 to-slate-950/80 border-2 border-rose-500/60 text-center space-y-3"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 border-4 border-slate-900">
                <Scissors className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1 max-w-md">
                <span className="inline-block px-3 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black tracking-wide">
                  {locale === 'ar' ? '⚠️ إجراء وقائي فوري للحقل' : '⚠️ Immediate Field Eradication'}
                </span>
                <h4 className="text-lg md:text-xl font-black text-rose-300">
                  {locale === 'ar' ? 'الإزالة الفورية والحرق للقناديل المصابة' : 'Immediate Physical Removal & Burning'}
                </h4>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {locale === 'ar'
                    ? 'يجب اقتلاع أو قطع النباتات والقناديل المتفحمة بحذر ووضعها داخل أكياس محكمة وإتلافها حرقاً خارج الحقل فوراً لمنع انتشار وتطاير الجراثيم السوداء في التربة والمحصول المجاور.'
                    : 'Infected plants and panicles must be carefully bagged, cut, and burned immediately outside the field to prevent spores from blowing onto surrounding crops.'}
                </p>
              </div>

              <div className="w-full bg-slate-950/80 p-3 rounded-xl border border-rose-800/40 text-xs text-rose-200 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>
                  {locale === 'ar'
                    ? 'الموسم القادم: معاملة البذور قبل الزراعة بالمبيدات الفطرية الوقائية (كربوكسين + ثيرام).'
                    : 'Pre-Planting: Treat seeds with protective systemic fungicide (Carboxin + Thiram).'}
                </span>
              </div>
            </motion.div>
          ) : isHarvestReady ? (
            /* GOLDEN HARVEST-READY STATE (0 DAYS) */
            <motion.div
              key="harvest-ready"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-emerald-950/30 to-slate-950/80 border-2 border-emerald-500/60 text-center"
            >
              <div className="relative mb-3">
                {/* Golden Glowing Badge */}
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 25px rgba(245, 158, 11, 0.4)',
                      '0 0 45px rgba(16, 185, 129, 0.5)',
                      '0 0 25px rgba(245, 158, 11, 0.4)'
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 flex items-center justify-center shadow-2xl border-4 border-slate-900"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring' }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-950 stroke-[2.8]" />
                  </motion.div>
                </motion.div>
                <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black tracking-wide">
                  {t.pesticideGoneBadge}
                </span>
                <h4 className="text-xl md:text-2xl font-black text-emerald-400">
                  {t.phiHarvestReady}
                </h4>
                <p className="text-xs md:text-sm text-slate-300 max-w-sm">
                  {t.safeHarvestDesc}
                </p>
              </div>
            </motion.div>
          ) : (
            /* ACTIVE PHI COUNTDOWN - Repeated Spray Cans */
            <motion.div
              key="active-countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Visual Grid of Repeated Pesticide Cans */}
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/90 shadow-inner">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <SprayCan className="w-4 h-4" />
                    <span>{t.sprayCanTip}</span>
                  </span>
                  <span className="font-bold text-white">
                    {remainingDays} / {initialDays} {t.daysRemainingShort}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-8 gap-2.5">
                  {Array.from({ length: initialDays }).map((_, index) => {
                    const isActive = index < remainingDays;
                    return (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <SprayIcon active={isActive} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Farmer Tip Box */}
              <div className="flex items-center gap-3 p-3 bg-amber-950/50 rounded-xl border border-amber-700/60 text-amber-200 text-xs md:text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <span>
                  <strong>{t.phiWarning}</strong>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 24-Hour Countdown Simulator Controls (Only for diseases with PHI countdown) */}
      {!isSmutDisease && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.phiLogicDesc}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAdvanceDays(1)}
              disabled={remainingDays <= 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1 border border-slate-700 shadow-sm"
            >
              <span>{t.advance24hBtn}</span>
            </button>

            <button
              onClick={() => onAdvanceDays(-1)}
              disabled={remainingDays >= initialDays}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-30 text-slate-300 rounded-xl font-medium text-xs transition-colors border border-slate-800"
            >
              <span>+1 {t.daysRemainingShort}</span>
            </button>

            {onResetDays && (
              <button
                onClick={() => onResetDays(0)}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-bold text-xs transition-colors border border-amber-500/40"
              >
                <span>{t.jumpToHarvestBtn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

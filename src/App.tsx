/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { CameraViewfinder } from './components/CameraViewfinder';
import { InteractiveTreatmentWorkflow } from './components/InteractiveTreatmentWorkflow';
import { CountrySelector } from './components/CountrySelector';
import { DiagnosisResult } from './types';
import { SorghumLocalRoomDatabase } from './data/local/roomDb';
import { SorghumExtensionRegistry } from './core/extensionHook';
import { SorghumWorkManagerSyncService } from './sync/workManager';
import { SupportedLocale, SupportedCountryCode, COUNTRY_CONFIGS, getStringsForCountry } from './data/i18n';

export default function App() {
  const db = SorghumLocalRoomDatabase.getInstance();
  const extensionRegistry = SorghumExtensionRegistry.getInstance();
  const syncService = SorghumWorkManagerSyncService.getInstance();

  const [country, setCountry] = useState<SupportedCountryCode>('sudan');
  const [activeDiagnosis, setActiveDiagnosis] = useState<DiagnosisResult | null>(null);

  const countryConfig = COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS.sudan;
  const locale = countryConfig.primaryLanguage as SupportedLocale;
  const t = getStringsForCountry(country);
  const isRtl = countryConfig.direction === 'rtl';

  // Handle completion of on-device diagnosis
  const handleDiagnosisComplete = async (result: DiagnosisResult) => {
    setActiveDiagnosis(result);
    // 1. Save to local Room SQLite database
    db.saveDiagnosis(result);
    // 2. Execute Part 3 Extension Hook
    await extensionRegistry.executePostDiagnosis(result);
    // 3. Trigger Silent Background Sync via WorkManager
    syncService.triggerAutoSync().catch(() => {});
  };

  const handleResetDiagnosis = () => {
    setActiveDiagnosis(null);
  };

  const handleAdvanceDays = async (days: number) => {
    if (!activeDiagnosis) return;
    const updated = db.advanceDiagnosisDays(activeDiagnosis.id, days);
    if (updated) {
      setActiveDiagnosis({ ...updated });
      await extensionRegistry.executePhiDecrement(updated.remainingPhiDays || 0);
    }
  };

  const handleResetDays = async (days: number) => {
    if (!activeDiagnosis) return;
    const updated = db.setDiagnosisRemainingDaysDirectly(activeDiagnosis.id, days);
    if (updated) {
      setActiveDiagnosis({ ...updated });
      await extensionRegistry.executePhiDecrement(updated.remainingPhiDays || 0);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden transition-all" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      {/* 1. TOP APP BAR */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <Sprout className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-white leading-tight tracking-wide">
                  {t.appName}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Sorghum AI
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t.offlineBadge}
                </span>
                <span>•</span>
                <span>{t.farmerFirst}</span>
              </div>
            </div>
          </div>

          {/* Region & Language Selector (6 African Challenge Countries) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <CountrySelector
              currentCountry={country}
              onSelectCountry={(c) => setCountry(c)}
            />
          </div>
        </div>
      </header>

      {/* 2. MAIN VIEW CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className={`grid gap-6 items-start ${activeDiagnosis ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-xl mx-auto'}`}>
          {/* Column 1: Primary Viewfinder Screen */}
          <div className={activeDiagnosis ? 'lg:col-span-5 flex flex-col gap-4' : 'w-full flex flex-col gap-4'}>
            <CameraViewfinder
              onDiagnosisComplete={handleDiagnosisComplete}
              activeDiagnosis={activeDiagnosis}
              onReset={handleResetDiagnosis}
              locale={locale}
              countryCode={country}
            />
          </div>

          {/* Column 2: Interactive Treatment Workflow & PHI Countdown (Shown ONLY after diagnosis) */}
          {activeDiagnosis && (
            <div className="lg:col-span-7 flex flex-col gap-5">
              <InteractiveTreatmentWorkflow
                diagnosis={activeDiagnosis}
                onAdvanceDays={handleAdvanceDays}
                onResetDays={handleResetDays}
                onResetDiagnosis={handleResetDiagnosis}
                locale={locale}
                countryCode={country}
              />
            </div>
          )}
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-slate-900/80 border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t.footerTagline}</span>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            {t.offlineBadge}
          </span>
        </div>
      </footer>
    </div>
  );
}

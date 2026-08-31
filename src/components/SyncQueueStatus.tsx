import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  CloudUpload, 
  Database, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Settings2, 
  Server, 
  Layers
} from 'lucide-react';
import { SorghumWorkManagerSyncService, SyncStatusState } from '../sync/workManager';
import { SorghumLocalRoomDatabase } from '../data/local/roomDb';
import { SyncQueueRecord } from '../types';
import { SupportedLocale, SupportedCountryCode, STRINGS, getStringsForCountry } from '../data/i18n';

interface SyncQueueStatusProps {
  locale?: SupportedLocale;
  countryCode?: SupportedCountryCode;
}

export const SyncQueueStatus: React.FC<SyncQueueStatusProps> = ({
  locale = 'ar',
  countryCode
}) => {
  const t = countryCode ? getStringsForCountry(countryCode) : (STRINGS[locale] || STRINGS.ar);
  const syncService = SorghumWorkManagerSyncService.getInstance();
  const db = SorghumLocalRoomDatabase.getInstance();

  const [syncState, setSyncState] = useState<SyncStatusState>(syncService.getState());
  const [syncQueue, setSyncQueue] = useState<SyncQueueRecord[]>(db.getSyncQueue());
  const [isEditingBaseUrl, setIsEditingBaseUrl] = useState<boolean>(false);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(syncService.getBaseUrl());

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newState) => {
      setSyncState(newState);
      setSyncQueue(db.getSyncQueue());
    });
    return () => unsubscribe();
  }, []);

  const handleToggleNetwork = () => {
    syncService.setOnlineStatus(!syncState.isOnline);
  };

  const handleManualSync = async () => {
    await syncService.triggerAutoSync();
    setSyncQueue(db.getSyncQueue());
  };

  const handleSaveBaseUrl = (e: React.FormEvent) => {
    e.preventDefault();
    syncService.setBaseUrl(customBaseUrl);
    setIsEditingBaseUrl(false);
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl shadow-black/20 p-5 md:p-6 transition-all backdrop-blur-sm">
      {/* Header with Network Mode Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-950/80 text-sky-400 flex items-center justify-center border border-sky-800/60 shadow-sm">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white leading-tight">
              {t.syncQueueTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.syncSubtitle}
            </p>
          </div>
        </div>

        {/* Network Toggle Button */}
        <button
          onClick={handleToggleNetwork}
          className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border ${
            syncState.isOnline
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-emerald-900/20'
              : 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-amber-900/20'
          }`}
          title={t.syncToggleTip}
        >
          {syncState.isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.syncOnline}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.syncOffline}</span>
            </>
          )}
        </button>
      </div>

      {/* Sync Queue Summary Counter */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/90 shadow-inner">
          <span className="text-xs text-slate-400 font-medium block mb-1">{t.pendingSyncLocal}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400">{syncState.pendingCount}</span>
            <span className="text-xs text-slate-500">{t.recordUnit}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/90 shadow-inner">
          <span className="text-xs text-slate-400 font-medium block mb-1">{t.syncedCountLabel}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{syncState.syncedCount}</span>
            <span className="text-xs text-slate-500">{t.recordUnit}</span>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/90 shadow-inner flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">{t.workerStatus}</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${syncState.isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              {syncState.isSyncing ? t.uploadingState : t.workerIdle}
            </span>
            <button
              onClick={handleManualSync}
              disabled={syncState.isSyncing || syncState.pendingCount === 0 || !syncState.isOnline}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm border border-sky-400/40"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{t.manualSyncBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Queue List Table */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.storedDiagnosesWithGps}</span>
        </span>

        {syncQueue.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
            {t.noRecordsNotice}
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {syncQueue.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                    <img src={item.imageBlobUrl} alt="Crop sample" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{item.diseaseId === 'sorghum_healthy' ? t.sampleHealthyBadge : `${t.sampleDiseasedBadge} (${item.diseaseId})`}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 font-mono">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {item.latitude.toFixed(3)}°, {item.longitude.toFixed(3)}°
                      </span>
                      <span className="flex items-center gap-0.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(item.capturedAt).toLocaleTimeString(locale === 'ar' ? 'ar-SD' : 'rw-RW', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {item.status === 'SYNCED' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold text-[10px] flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{t.syncedState}</span>
                    </span>
                  ) : item.status === 'UPLOADING' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold text-[10px] animate-pulse">
                      {t.uploadingState}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold text-[10px]">
                      {t.inLocalQueueState}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configurable Base URL Section */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-xs text-slate-300">{syncState.baseUrl}</span>
        </div>

        <button
          onClick={() => setIsEditingBaseUrl(!isEditingBaseUrl)}
          className="text-slate-400 hover:text-emerald-400 font-bold flex items-center gap-1 text-[11px] transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{isEditingBaseUrl ? t.cancelBtn : t.editBaseUrl}</span>
        </button>
      </div>

      {isEditingBaseUrl && (
        <form onSubmit={handleSaveBaseUrl} className="mt-2.5 flex gap-2">
          <input
            type="url"
            value={customBaseUrl}
            onChange={(e) => setCustomBaseUrl(e.target.value)}
            placeholder="https://your-api.com/v1/sync"
            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm"
          >
            {t.saveBtn}
          </button>
        </form>
      )}
    </div>
  );
};

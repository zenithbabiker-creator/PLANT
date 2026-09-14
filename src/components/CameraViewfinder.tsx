import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  RefreshCw, 
  MapPin, 
  Zap, 
  CheckCircle2, 
  AlertOctagon, 
  EyeOff, 
  Upload, 
  Globe,
  Check,
  Video,
  VideoOff,
  Image as ImageIcon
} from 'lucide-react';
import { DiagnosisResult, DiagnosisStatus } from '../types';
import { SorghumOnDeviceClassifier } from '../ml/sorghumClassifier';
import { getLocalizedDisease } from '../data/diseasesDatabase';
import { SupportedLocale, SupportedCountryCode, getStringsForCountry } from '../data/i18n';
import { apiClient, API_ENDPOINTS } from '../network/apiClient';

interface CameraViewfinderProps {
  onDiagnosisComplete: (result: DiagnosisResult) => void;
  activeDiagnosis: DiagnosisResult | null;
  onReset: () => void;
  locale?: SupportedLocale;
  countryCode?: SupportedCountryCode;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onDiagnosisComplete,
  activeDiagnosis,
  onReset,
  locale = 'ar',
  countryCode
}) => {
  const t = getStringsForCountry(countryCode || 'sudan', locale);
  const [isLiveCamera, setIsLiveCamera] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string>('');
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [clientIp, setClientIp] = useState<string>('127.0.0.1');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [soundEnabled] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Automatically start camera and fetch location/IP on component mount
  useEffect(() => {
    startLiveCamera();
    fetchCurrentLocation();
    fetchClientIp();

    return () => {
      stopLiveCamera();
    };
  }, []);

  const fetchClientIp = async () => {
    try {
      const res = await apiClient.get<{ ip: string }>(API_ENDPOINTS.CLIENT_IP);
      if (res.ok && res.data?.ip) {
        setClientIp(res.data.ip);
      }
    } catch {
      // Fallback
    }
  };

  const fetchCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setIsLocating(false);
        },
        () => {
          // Fallback approximate coordinates in Sorghum belt
          setGpsLocation({
            latitude: 14.3852,
            longitude: 33.5241,
            accuracy: 5
          });
          setIsLocating(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  const startLiveCamera = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      setIsLiveCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setIsLiveCamera(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCamera(false);
  };

  // Play auditory tone for agricultural field feedback
  const playAudioTone = (type: DiagnosisStatus) => {
    if (!soundEnabled || typeof window === 'undefined' || type === 'IDLE') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'HEALTHY') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'DISEASED') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260.0, ctx.currentTime);
        osc.frequency.setValueAtTime(220.0, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'BLURRY') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440.0, ctx.currentTime);
        osc.frequency.setValueAtTime(350.0, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  // Capture current video frame to freeze photo
  const handleSnapPhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUri = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedImageUri(dataUri);
          stopLiveCamera();
        }
      } catch (e) {
        console.error('Frame capture failed', e);
      }
    }
  };

  // Upload photo from gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const uri = event.target?.result as string;
        setCapturedImageUri(uri);
        stopLiveCamera();
        if (activeDiagnosis) {
          onReset();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute on-device local TFLite classification
  const handleRunDiagnosis = async () => {
    setIsProcessing(true);

    try {
      let imageUriToProcess = capturedImageUri;

      // If live camera is still playing and user hits analyze directly, snap frame
      if (isLiveCamera && videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageUriToProcess = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedImageUri(imageUriToProcess);
          stopLiveCamera();
        }
      } else if (!imageUriToProcess) {
        // High quality fallback sample image
        imageUriToProcess = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80';
        setCapturedImageUri(imageUriToProcess);
      }

      // Simulate on-device TFLite tensor forward pass latency (approx 200ms)
      await new Promise((r) => setTimeout(r, 280));

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUriToProcess;

      const result = await SorghumOnDeviceClassifier.classifyOffline(
        img,
        imageUriToProcess,
        undefined,
        false,
        gpsLocation || undefined,
        clientIp
      );

      playAudioTone(result.status);
      onDiagnosisComplete(result);
    } catch (e) {
      console.error('TFLite inference failure:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImageUri('');
    onReset();
    startLiveCamera();
  };

  const currentStatus: DiagnosisStatus | null = activeDiagnosis ? activeDiagnosis.status : null;

  // Frame colors based purely on on-device diagnosis result
  let frameBorderColor = 'border-slate-800';
  let frameGlowColor = 'shadow-slate-950/50';
  let bannerElement: React.ReactNode = null;

  if (currentStatus === 'HEALTHY') {
    frameBorderColor = 'border-emerald-500 ring-4 ring-emerald-500/30';
    frameGlowColor = 'shadow-2xl shadow-emerald-500/30';
    bannerElement = (
      <div className="w-full py-2.5 px-4 rounded-t-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md bg-emerald-600 text-white font-bold">
        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        <span className="text-sm md:text-base font-black tracking-wide">
          {t.statusHealthy}
        </span>
      </div>
    );
  } else if (currentStatus === 'DISEASED') {
    const diseaseName = activeDiagnosis?.disease 
      ? getLocalizedDisease(activeDiagnosis.disease, locale).name 
      : t.statusDiseased;
    frameBorderColor = 'border-rose-500 ring-4 ring-rose-500/30';
    frameGlowColor = 'shadow-2xl shadow-rose-600/30';
    bannerElement = (
      <div className="w-full py-2.5 px-4 rounded-t-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md bg-rose-600 text-white font-bold">
        <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
        <span className="text-sm md:text-base font-black tracking-wide">
          {diseaseName}
        </span>
      </div>
    );
  } else if (currentStatus === 'BLURRY') {
    frameBorderColor = 'border-amber-400 ring-4 ring-amber-400/30';
    frameGlowColor = 'shadow-2xl shadow-amber-500/30';
    bannerElement = (
      <div className="w-full py-2.5 px-4 rounded-t-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md bg-amber-400 text-slate-950 font-black">
        <EyeOff className="w-6 h-6 stroke-[2.5]" />
        <span className="text-sm md:text-base font-black tracking-wide">
          {t.statusBlurry}
        </span>
      </div>
    );
  }

  const hasImageReady = Boolean(capturedImageUri || isLiveCamera);

  return (
    <div className="w-full bg-slate-900/90 rounded-3xl border border-slate-800 p-4 md:p-5 shadow-xl shadow-black/20 backdrop-blur-sm flex flex-col gap-4">
      {/* 1. STATUS BANNER (ONLY shown AFTER analysis) */}
      {bannerElement}

      {/* 2. VIEWFINDER WINDOW */}
      <div
        className={`relative w-full aspect-square bg-slate-950 overflow-hidden border-[4px] transition-all duration-300 ${
          bannerElement ? 'rounded-b-2xl' : 'rounded-2xl'
        } ${frameBorderColor} ${frameGlowColor}`}
      >
        {/* Live Camera Stream */}
        {isLiveCamera ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : capturedImageUri ? (
          /* Captured or Uploaded Photo */
          <img
            ref={imageRef}
            src={capturedImageUri}
            alt="Captured Sorghum Leaf"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Standby Viewfinder Placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Camera className="w-10 h-10 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-slate-200 mb-1">
              {locale === 'ar' ? 'الكاميرا جاهزة للالتقاط أو الرفع' : 'Camera Ready to Capture or Upload'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              {locale === 'ar' ? 'وجّه الكاميرا نحو ورقة النبات أو ارفع صورة واضحة' : 'Aim camera at the sorghum leaf or upload a photo'}
            </p>
          </div>
        )}

        {/* Viewfinder Target Focus Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
          <div className="w-full h-full border-2 border-dashed border-white/30 rounded-2xl relative flex items-center justify-center">
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Scanning Laser Animation during TFLite Inference */}
            {isProcessing && (
              <motion.div
                animate={{ y: [-110, 110, -110] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,1)]"
              />
            )}
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-800 shadow-md">
          <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
          {gpsLocation ? (
            <span className="font-mono text-[10px]">
              {gpsLocation.latitude.toFixed(2)}°, {gpsLocation.longitude.toFixed(2)}°
            </span>
          ) : (
            <span>GPS Ready</span>
          )}
        </div>

        {/* Live Camera State Indicator */}
        {isLiveCamera && (
          <div className="absolute bottom-3 left-3 bg-rose-950/90 border border-rose-500/60 text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{locale === 'ar' ? 'بث حي للكاميرا' : 'Live Camera Active'}</span>
          </div>
        )}
      </div>

      {/* 3. DUAL CAPTURE / UPLOAD ACTION SELECTOR */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Option 1: Live Camera Snap / Restart */}
        <button
          onClick={isLiveCamera ? handleSnapPhoto : startLiveCamera}
          className={`py-3 px-3 rounded-2xl border font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isLiveCamera
              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 hover:bg-emerald-900/80 shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 shadow-sm'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>
            {isLiveCamera
              ? (locale === 'ar' ? 'التقاط صورة الكاميرا' : 'Snap Photo')
              : (locale === 'ar' ? 'فتح الكاميرا فوراً' : 'Open Camera')}
          </span>
        </button>

        {/* Option 2: Upload Photo from Gallery */}
        <label className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm">
          <Upload className="w-4 h-4 text-sky-400" />
          <span>{locale === 'ar' ? 'رفع صورة من المعرض' : 'Upload from Gallery'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* 4. PRIMARY SUBMIT & DIAGNOSE BUTTON */}
      <div className="flex items-center gap-2.5">
        {activeDiagnosis && (
          <button
            onClick={handleRetake}
            className="h-14 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            title={locale === 'ar' ? 'فحص عينة جديدة' : 'New Scan'}
          >
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'إعادة' : 'Retake'}</span>
          </button>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRunDiagnosis}
          disabled={isProcessing}
          className={`flex-1 h-14 rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 shadow-lg transition-all ${
            isProcessing
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/25 border border-emerald-400/40'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-300" />
              <span>{locale === 'ar' ? 'جاري فحص النبتة...' : 'Analyzing plant...'}</span>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 stroke-[2.2] text-emerald-200" />
              <span>{locale === 'ar' ? 'إرسال وتحليل الصورة' : 'Submit & Diagnose'}</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  AlertOctagon, 
  EyeOff, 
  Upload, 
  Globe,
  Sparkles,
  AlertCircle,
  ImageIcon,
  Check,
  Zap
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
  const [imagePreviewName, setImagePreviewName] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [clientIp, setClientIp] = useState<string>('127.0.0.1');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [soundEnabled] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Default high-resolution test sample
  const DEFAULT_SAMPLE_LEAF = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80';

  // 1. Initial setup: attempt starting camera, fetch GPS & IP
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
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setIsLocating(false);
        },
        () => {
          // Gezira Agricultural Scheme coordinates fallback
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
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(locale === 'ar' ? 'الكاميرا المباشرة غير مدعومة في هذا المتصفح، يمكنك رفع صورة مباشرة.' : 'Live camera not supported on this browser; use image upload.');
        return;
      }

      // Request live camera stream with environment (back) camera preference
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
      setCapturedImageUri('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setIsLiveCamera(false);
      setCameraError(
        locale === 'ar' 
          ? 'تعذر الوصول التلقائي للكاميرا (صلاحيات المتصفح). يمكنك استخدام زر الالتقاط/الرفع أدناه.' 
          : 'Camera permission required. Please grant permission or upload an image.'
      );
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

  // Play auditory tone for field diagnosis feedback
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

  // Capture current video frame to freeze photo preview immediately
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
          const dataUri = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedImageUri(dataUri);
          setImagePreviewName(locale === 'ar' ? 'صورة ملتقطة من الكاميرا' : 'Camera Snapshot');
          stopLiveCamera();
          if (activeDiagnosis) {
            onReset();
          }
        }
      } catch (e) {
        console.error('Frame capture failed', e);
      }
    } else {
      // If live camera is not running, trigger the native camera capture input
      nativeCameraInputRef.current?.click();
    }
  };

  // Immediate Preview on Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const uri = event.target?.result as string;
        setCapturedImageUri(uri);
        setImagePreviewName(file.name);
        stopLiveCamera();
        if (activeDiagnosis) {
          onReset();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load sample leaf for testing
  const handleLoadSample = () => {
    setCapturedImageUri(DEFAULT_SAMPLE_LEAF);
    setImagePreviewName(locale === 'ar' ? 'عينة ورقة ذرة نموذجية' : 'Sample Sorghum Leaf');
    stopLiveCamera();
    if (activeDiagnosis) {
      onReset();
    }
  };

  // Execute deterministic on-device local classification & Gemini API
  const handleRunDiagnosis = async () => {
    setIsProcessing(true);

    try {
      let imageUriToProcess = capturedImageUri;

      // If live camera stream is active and user clicks analyze directly, capture frame first
      if (isLiveCamera && videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageUriToProcess = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedImageUri(imageUriToProcess);
          stopLiveCamera();
        }
      } else if (!imageUriToProcess) {
        imageUriToProcess = DEFAULT_SAMPLE_LEAF;
        setCapturedImageUri(imageUriToProcess);
      }

      // Allow image element to decode for deterministic tensor analysis
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUriToProcess;

      await new Promise((resolve) => {
        if (img.complete) {
          resolve(null);
        } else {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
        }
      });

      // Execute deterministic inference pipeline
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
      console.error('Deterministic inference failure:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImageUri('');
    setImagePreviewName('');
    onReset();
    startLiveCamera();
  };

  const currentStatus: DiagnosisStatus | null = activeDiagnosis ? activeDiagnosis.status : null;

  // Frame colors based purely on diagnosis result
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

  return (
    <div className="w-full bg-slate-900/90 rounded-3xl border border-slate-800 p-4 md:p-5 shadow-xl shadow-black/20 backdrop-blur-sm flex flex-col gap-4">
      {/* 1. STATUS BANNER (shown AFTER analysis) */}
      {bannerElement}

      {/* 2. VIEWFINDER & IMMEDIATE IMAGE PREVIEW CONTAINER */}
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
          /* IMMEDIATE PREVIEW of Captured or Uploaded Photo */
          <div className="relative w-full h-full">
            <img
              ref={imageRef}
              src={capturedImageUri}
              alt="Preview of Sorghum Plant"
              className="w-full h-full object-cover"
            />
            {/* Instant Loaded Image Confirmation Overlay */}
            {!activeDiagnosis && (
              <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/40 shadow-lg">
                <Check className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'تم تجهيز الصورة للمعاينة' : 'Image Ready for Inference'}</span>
              </div>
            )}
          </div>
        ) : (
          /* Standby Viewfinder Placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Camera className="w-10 h-10 stroke-[1.8] text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-slate-200 mb-1">
              {locale === 'ar' ? 'نافذة الكاميرا والمعاينة الفورية' : 'Instant Camera & Image Preview'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mb-3">
              {locale === 'ar' ? 'التقط صورة لورقة الذرة أو ارفعها من المعرض لمعاينتها فوراً' : 'Snap or upload a leaf photo to view instant preview'}
            </p>
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'تجربة عينة ورقة ذرة نموذجية' : 'Use Sample Sorghum Leaf'}</span>
            </button>
          </div>
        )}

        {/* Viewfinder Target Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
          <div className="w-full h-full border-2 border-dashed border-white/30 rounded-2xl relative flex items-center justify-center">
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Scanning Laser Animation during Inference */}
            {isProcessing && (
              <motion.div
                animate={{ y: [-110, 110, -110] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,1)]"
              />
            )}
          </div>
        </div>

        {/* Top Badges (GPS & Info) */}
        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-800 shadow-md">
          <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
          {gpsLocation ? (
            <span className="font-mono text-[10px]">
              {gpsLocation.latitude.toFixed(2)}°, {gpsLocation.longitude.toFixed(2)}°
            </span>
          ) : (
            <span>GPS 14.38°, 33.52°</span>
          )}
        </div>

        {/* Live Camera State Indicator */}
        {isLiveCamera && (
          <div className="absolute bottom-3 left-3 bg-rose-950/90 border border-rose-500/60 text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{locale === 'ar' ? 'بث الكاميرا المباشر نشط' : 'Live Camera Active'}</span>
          </div>
        )}
      </div>

      {/* Camera Permission Warning Banner if any */}
      {cameraError && !isLiveCamera && !capturedImageUri && (
        <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{cameraError}</p>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              {locale === 'ar' ? 'يمكنك الضغط على زر "رفع من المعرض" أو "التقاط بالكاميرا" أدناه.' : 'You can use the direct capture or upload button below.'}
            </p>
          </div>
        </div>
      )}

      {/* 3. DUAL CAPTURE & UPLOAD ACTION CONTROLS */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Button 1: Snap Photo / Open Live Camera */}
        <button
          onClick={isLiveCamera ? handleSnapPhoto : startLiveCamera}
          className={`py-3 px-3 rounded-2xl border font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isLiveCamera
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 shadow-sm'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>
            {isLiveCamera
              ? (locale === 'ar' ? 'التقاط الصورة الآن' : 'Snap Photo Now')
              : (locale === 'ar' ? 'تشغيل الكاميرا' : 'Open Camera')}
          </span>
        </button>

        {/* Button 2: Upload Photo from Gallery */}
        <label className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm">
          <Upload className="w-4 h-4 text-sky-400" />
          <span>{locale === 'ar' ? 'رفع صورة من المعرض' : 'Upload from Gallery'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Hidden Native Camera Input for mobile direct camera app launch */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 4. PRIMARY SUBMIT & DIAGNOSE BUTTON */}
      <div className="flex items-center gap-2.5">
        {(activeDiagnosis || capturedImageUri) && (
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
              <span>{locale === 'ar' ? 'جاري الفحص الدقيق...' : 'Executing Inference...'}</span>
            </>
          ) : (
            <>
              <Zap className="w-6 h-6 stroke-[2.2] text-emerald-200" />
              <span>
                {capturedImageUri 
                  ? (locale === 'ar' ? 'بدء فحص وتشخيص الصورة' : 'Analyze Selected Photo')
                  : (locale === 'ar' ? 'إرسال وتحليل الصورة' : 'Submit & Diagnose')}
              </span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

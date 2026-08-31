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
  Radio
} from 'lucide-react';
import { DiagnosisResult, DiagnosisStatus } from '../types';
import { SorghumOnDeviceClassifier } from '../ml/sorghumClassifier';
import { INITIAL_SORGHUM_DISEASES, getLocalizedDisease } from '../data/diseasesDatabase';
import { SupportedLocale, SupportedCountryCode, STRINGS, getStringsForCountry } from '../data/i18n';

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
  const t = countryCode ? getStringsForCountry(countryCode) : (STRINGS[locale] || STRINGS.ar);
  const [isLiveCamera, setIsLiveCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [soundEnabled] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch real GPS location when component mounts
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

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
          // Fallback approximate Sorghum Belt coordinates
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

  // Play auditory cue for low-literacy farmers
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
        // Cheerful high double tone
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'DISEASED') {
        // Deep alert warning tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260.0, ctx.currentTime);
        osc.frequency.setValueAtTime(220.0, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'BLURRY') {
        // Pulsing re-try chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440.0, ctx.currentTime);
        osc.frequency.setValueAtTime(350.0, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context may be restricted
    }
  };

  // Toggle Live Camera Stream
  const toggleLiveCamera = async () => {
    if (isLiveCamera) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsLiveCamera(false);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false
        });
        setIsLiveCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        setCameraError(locale === 'ar' ? 'تعذر فتح الكاميرا الحية، يمكنك رفع صورة من جهازك' : 'Could not access live camera. You can upload a photo.');
        setIsLiveCamera(false);
      }
    }
  };

  // Process Diagnosis
  const handleCaptureAndDiagnose = async () => {
    setIsProcessing(true);

    try {
      let imageUriToUse = currentImageUri;

      // Extract frame if live camera
      if (isLiveCamera && videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 480;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          imageUriToUse = canvas.toDataURL('image/jpeg', 0.85);
          setCurrentImageUri(imageUriToUse);
        }
      } else if (!imageUriToUse) {
        // If neither live camera nor uploaded image, pick a realistic sample image for on-device inference
        const rand = Math.random();
        const diseaseSample = rand < 0.35 
          ? INITIAL_SORGHUM_DISEASES[0] // Healthy
          : (rand < 0.70 ? INITIAL_SORGHUM_DISEASES[1] : INITIAL_SORGHUM_DISEASES[2]);
        imageUriToUse = diseaseSample.sample_image_url || '';
        setCurrentImageUri(imageUriToUse);
      }

      // Simulate on-device inference latency (150ms on mobile NPU/TFLite)
      await new Promise((r) => setTimeout(r, 260));

      const mockImg = new Image();
      mockImg.crossOrigin = 'anonymous';
      mockImg.src = imageUriToUse;

      const result = await SorghumOnDeviceClassifier.classifyOffline(
        mockImg,
        imageUriToUse,
        undefined,
        false,
        gpsLocation || undefined
      );

      playAudioTone(result.status);
      onDiagnosisComplete(result);
    } catch (e) {
      console.error('Inference error', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const uri = event.target?.result as string;
        setCurrentImageUri(uri);
        if (isLiveCamera) {
          toggleLiveCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentStatus: DiagnosisStatus | null = activeDiagnosis ? activeDiagnosis.status : null;

  // Single Result Status Display Conditions:
  // 1. GREEN (Healthy): "لا تبدو أي أعراض ظاهرة"
  // 2. RED (Diseased): [اسم المرض المكتشف]
  // 3. YELLOW (Blurry/Uncertain): "إعادة التصوير"
  let frameBorderColor = 'border-slate-800';
  let frameGlowColor = 'shadow-slate-950/50';
  let bannerElement: React.ReactNode = null;

  if (currentStatus === 'HEALTHY') {
    frameBorderColor = 'border-emerald-500 ring-4 ring-emerald-500/30';
    frameGlowColor = 'shadow-2xl shadow-emerald-500/30';
    bannerElement = (
      <div className="w-full py-2.5 px-4 rounded-t-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md bg-emerald-600 text-white">
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
      <div className="w-full py-2.5 px-4 rounded-t-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md bg-rose-600 text-white">
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
    <div className="w-full bg-slate-900/90 rounded-3xl border border-slate-800 p-4 md:p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
      {/* 1. VISUAL VIEWFINDER CONTAINER */}
      <div className="w-full">
        {/* Status Indicator Banner: ONLY shown AFTER offline diagnosis */}
        {bannerElement}

        {/* The Viewfinder Screen with Clean Placeholder or Video / Image */}
        <div
          className={`relative w-full aspect-square bg-slate-950 overflow-hidden border-[4px] transition-all duration-300 ${
            bannerElement ? 'rounded-b-2xl' : 'rounded-2xl'
          } ${frameBorderColor} ${frameGlowColor}`}
        >
          {/* Live Video OR Image Preview OR Clean Blank Placeholder */}
          {isLiveCamera ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : currentImageUri ? (
            <img
              ref={imageRef}
              src={currentImageUri}
              alt="Sorghum plant leaf"
              className="w-full h-full object-cover transition-transform duration-300"
            />
          ) : (
            /* Blank Placeholder ready for Live Stream or Capture */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
              <div className="w-20 h-20 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
                <Camera className="w-10 h-10 stroke-[1.8] text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
                {locale === 'ar' 
                  ? 'المعاينة جاهزة لاستقبال تغذية الكاميرا الحية أو التقاط صورة الورقة' 
                  : 'Viewfinder ready for live camera stream or leaf photo capture'}
              </p>
            </div>
          )}

          {/* Viewfinder Target Crosshairs / Alignment Box */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="w-full h-full border-2 border-dashed border-white/40 rounded-2xl relative flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white/80 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white/80 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white/80 rounded-br-lg" />

              {/* Center scan line animation when processing */}
              {isProcessing && (
                <motion.div
                  animate={{ y: [-100, 100, -100] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.9)]"
                />
              )}
            </div>
          </div>

          {/* Top-Right Badge: GPS Auto-Tagger */}
          <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-800 shadow-md">
            <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
            {gpsLocation ? (
              <span className="font-mono text-[10px]">
                {gpsLocation.latitude.toFixed(2)}°, {gpsLocation.longitude.toFixed(2)}°
              </span>
            ) : (
              <span>GPS Active</span>
            )}
          </div>

          {/* Top-Left Badge: On-Device AI Engine */}
          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-800 shadow-md">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-bold">{t.offlineBadge}</span>
          </div>

          {/* Bottom Retake prompt if blurry */}
          {currentStatus === 'BLURRY' && (
            <div className="absolute bottom-4 inset-x-4 bg-amber-500/95 backdrop-blur-md text-slate-950 p-3 rounded-2xl text-center shadow-xl border border-amber-300">
              <p className="text-xs font-black">
                {t.blurryAlert}
              </p>
            </div>
          )}
        </div>

        {/* 2. PRIMARY ACTION CONTROLS (Large touch targets for farmers) */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {/* Re-capture / Reset */}
          {activeDiagnosis && (
            <button
              onClick={() => {
                setCurrentImageUri('');
                onReset();
              }}
              className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center shadow-md border border-slate-700 transition-all active:scale-95"
              title={t.statusBlurry}
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          )}

          {/* MAIN BIG VISUAL SCAN BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCaptureAndDiagnose}
            disabled={isProcessing}
            className={`flex-1 h-14 rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 shadow-lg transition-all ${
              isProcessing
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-500/25 border border-emerald-400/40'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-300" />
                <span>{t.analyzingBtn}</span>
              </>
            ) : (
              <>
                <Camera className="w-7 h-7 stroke-[2.4]" />
                <span>{t.scanPlantBtn}</span>
              </>
            )}
          </motion.button>

          {/* Custom Photo Upload Button */}
          <label className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center shadow-md border border-slate-700 transition-all active:scale-95 cursor-pointer">
            <Upload className="w-6 h-6 text-emerald-400" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Live Camera Toggle Button */}
          <button
            onClick={toggleLiveCamera}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all active:scale-95 border ${
              isLiveCamera
                ? 'bg-rose-950/80 text-rose-400 border-rose-600 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isLiveCamera ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا الحية'}
          >
            <Radio className={`w-6 h-6 ${isLiveCamera ? 'text-rose-400' : ''}`} />
          </button>
        </div>

        {/* Camera error notification if blocked */}
        {cameraError && (
          <p className="text-xs text-rose-400 text-center mt-2 font-medium">
            {cameraError}
          </p>
        )}
      </div>
    </div>
  );
};

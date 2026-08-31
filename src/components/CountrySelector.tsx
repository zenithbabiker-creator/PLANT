import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe2, 
  ChevronDown, 
  Check, 
  Languages, 
  ArrowRightLeft, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  SupportedCountryCode, 
  COUNTRY_CONFIGS, 
  CountryConfig, 
  getStringsForCountry 
} from '../data/i18n';

interface CountrySelectorProps {
  currentCountry: SupportedCountryCode;
  onSelectCountry: (country: SupportedCountryCode) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  currentCountry,
  onSelectCountry
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeConfig = COUNTRY_CONFIGS[currentCountry] || COUNTRY_CONFIGS.sudan;
  const t = getStringsForCountry(currentCountry);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const countriesList = Object.values(COUNTRY_CONFIGS);

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'ar': return 'العربية (Arabic)';
      case 'rw': return 'Ikinyarwanda (Kinyarwanda)';
      case 'sw': return 'Kiswahili (Swahili)';
      case 'ny': return 'Chichewa';
      case 'en': return 'English';
      default: return lang;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="country-selector-wrapper">
      {/* Trigger Button */}
      <button
        id="country-selector-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 shadow-md backdrop-blur-md transition-all duration-200 text-slate-200 group"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg leading-none" role="img" aria-label={activeConfig.nameEn}>
          {activeConfig.flag}
        </span>
        <div className="flex flex-col text-start">
          <span className="text-xs font-bold text-white flex items-center gap-1">
            <span>{activeConfig.nameNative}</span>
            <span className="text-[10px] font-medium text-slate-400 font-mono">({activeConfig.nameEn})</span>
          </span>
          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
            <Languages className="w-2.5 h-2.5" />
            <span>{activeConfig.primaryLanguage.toUpperCase()}</span>
            <span className="text-slate-500">•</span>
            <span className="uppercase text-slate-400">{activeConfig.direction}</span>
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          id="country-selector-menu"
          className="absolute z-50 mt-2 w-72 md:w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/80 backdrop-blur-xl p-2 animate-in fade-in zoom-in-95 duration-150 right-0 sm:right-auto"
          role="listbox"
        >
          <div className="px-3 py-2 border-b border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>{t.countrySelectorLabel || 'Select Country & Language'}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              6 African Challenge Countries
            </span>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
            {countriesList.map((country) => {
              const isSelected = country.id === currentCountry;
              return (
                <button
                  key={country.id}
                  id={`country-option-${country.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectCountry(country.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-start transition-all ${
                    isSelected
                      ? 'bg-emerald-950/80 border border-emerald-500/80 text-white'
                      : 'hover:bg-slate-800/80 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none" role="img" aria-label={country.nameEn}>
                      {country.flag}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs font-bold text-white">
                          {country.nameNative}
                        </strong>
                        {country.nameNative !== country.nameEn && (
                          <span className="text-[11px] text-slate-400">({country.nameEn})</span>
                        )}
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span className="text-emerald-400">
                          {getLanguageLabel(country.primaryLanguage)}
                        </span>
                        {country.fallbackLanguage && country.fallbackLanguage !== country.primaryLanguage && (
                          <span>(Fallback: {country.fallbackLanguage.toUpperCase()})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      country.direction === 'rtl' 
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50' 
                        : 'bg-sky-950/70 text-sky-300 border border-sky-800/50'
                    }`}>
                      {country.direction.toUpperCase()}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 px-2.5 py-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-slate-500" />
              <span>RTL: Sudan • LTR: 5 Countries</span>
            </span>
            <span className="text-emerald-400 font-bold">Automatic Dynamic i18n</span>
          </div>
        </div>
      )}
    </div>
  );
};

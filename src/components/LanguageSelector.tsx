import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { 
  SupportedLanguageCode, 
  SUPPORTED_LANGUAGES, 
  LanguageConfig 
} from '../data/i18n';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguageCode;
  onSelectLanguage: (language: SupportedLanguageCode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeConfig = SUPPORTED_LANGUAGES[currentLanguage] || SUPPORTED_LANGUAGES.en;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languagesList = Object.values(SUPPORTED_LANGUAGES);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="language-selector-wrapper">
      <div className="flex items-center gap-1.5">
        {/* Quick Language Switch Button (Toggle directly between Arabic & English with one tap) */}
        <button
          id="quick-lang-toggle"
          type="button"
          onClick={() => onSelectLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm transition-all duration-150 text-xs font-bold"
          title={currentLanguage === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentLanguage === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
        </button>

        {/* Detailed Dropdown for All Languages */}
        <button
          id="language-dropdown-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 shadow-md backdrop-blur-md transition-all duration-200 text-slate-200 group"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-sm leading-none" role="img" aria-label={activeConfig.nameEn}>
            {activeConfig.flag}
          </span>
          <span className="text-xs font-semibold text-white">
            {activeConfig.nameNative}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Language Dropdown Menu */}
      {isOpen && (
        <div
          id="language-selector-menu"
          className="absolute z-50 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/80 backdrop-blur-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 right-0 sm:right-auto"
          role="listbox"
        >
          <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Choose Language / اختر اللغة</span>
          </div>

          <div className="space-y-0.5">
            {languagesList.map((lang: LanguageConfig) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  id={`language-option-${lang.code}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-start transition-all ${
                    isSelected
                      ? 'bg-emerald-950/80 border border-emerald-500/80 text-white'
                      : 'hover:bg-slate-800/80 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white leading-tight">
                        {lang.nameNative}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {lang.nameEn} ({lang.code.toUpperCase()})
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

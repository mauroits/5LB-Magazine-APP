import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const IconDEX: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="50" rx="46" ry="40" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.25))" />
    {/* Shadow behind DEX text */}
    <text x="51" y="60" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="38" fontStyle="italic" fill="#000000" opacity="0.35" textAnchor="middle">
      DEX
    </text>
    {/* Cyan/blue slanted DEX text */}
    <text x="49" y="58" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="38" fontStyle="italic" fill="#38bdf8" textAnchor="middle">
      DEX
    </text>
  </svg>
);

export const IconNeofiti: React.FC<IconProps> = ({ className = 'w-6 h-5' }) => (
  <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="35" rx="58" ry="32" fill="#ffeb3b" stroke="#fbc02d" strokeWidth="1.5" />
    {/* 5LB with underline */}
    <text x="60" y="32" fontFamily="Georgia, serif" fontWeight="bold" fontSize="23" fill="#000000" textAnchor="middle">
      5LB
    </text>
    <line x1="28" y1="36" x2="92" y2="36" stroke="#000000" strokeWidth="2" />
    <text x="60" y="54" fontFamily="Impact, system-ui, sans-serif" fontWeight="normal" fontSize="16" fill="#000000" letterSpacing="0.5" textAnchor="middle">
      PER NEOFITI
    </text>
  </svg>
);

export const IconCognitivo: React.FC<IconProps> = ({ className = 'w-6 h-5' }) => (
  <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="35" rx="58" ry="32" fill="#00e676" stroke="#00c853" strokeWidth="1.5" />
    <text x="42" y="32" fontFamily="Georgia, serif" fontWeight="bold" fontSize="22" fill="#000000" textAnchor="middle">
      5LB
    </text>
    <text x="82" y="32" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="17" fill="#000000" textAnchor="middle">
      OK
    </text>
    <line x1="24" y1="36" x2="96" y2="36" stroke="#000000" strokeWidth="2" />
    <text x="60" y="55" fontFamily="Impact, system-ui, sans-serif" fontSize="16" fill="#000000" letterSpacing="0.5" textAnchor="middle">
      COGNITIVO
    </text>
  </svg>
);

export const IconApplicativo: React.FC<IconProps> = ({ className = 'w-6 h-5' }) => (
  <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="35" rx="58" ry="32" fill="#2979ff" stroke="#1d4ed8" strokeWidth="1.5" />
    <text x="42" y="32" fontFamily="Georgia, serif" fontWeight="bold" fontSize="22" fill="#ffffff" textAnchor="middle">
      5LB
    </text>
    <text x="82" y="32" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="17" fill="#ffffff" textAnchor="middle">
      OK
    </text>
    <line x1="24" y1="36" x2="96" y2="36" stroke="#ffffff" strokeWidth="2" />
    <text x="60" y="55" fontFamily="Impact, system-ui, sans-serif" fontSize="15" fill="#ffffff" letterSpacing="0.5" textAnchor="middle">
      APPLICATIVO
    </text>
  </svg>
);

export const IconOperatori: React.FC<IconProps> = ({ className = 'w-6 h-5' }) => (
  <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="35" rx="58" ry="32" fill="#880e4f" stroke="#4a0022" strokeWidth="1.5" />
    <text x="42" y="32" fontFamily="Georgia, serif" fontWeight="bold" fontSize="22" fill="#ffffff" textAnchor="middle">
      5LB
    </text>
    <text x="82" y="32" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="#ffffff" textAnchor="middle">
      PRO
    </text>
    <line x1="24" y1="36" x2="96" y2="36" stroke="#ffffff" strokeWidth="2" />
    <text x="60" y="55" fontFamily="Impact, system-ui, sans-serif" fontSize="15" fill="#ffffff" letterSpacing="0.5" textAnchor="middle">
      OPERATORI
    </text>
  </svg>
);

export const IconPresenzaLab: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#111827" stroke="#374151" strokeWidth="2" />
    <text x="50" y="38" fontFamily="Georgia, serif" fontStyle="italic" fontSize="16" fill="#f3f4f6" textAnchor="middle">
      Presenza
    </text>
    <text x="35" y="66" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24" fill="#ffffff" textAnchor="middle">
      LAB
    </text>
    <text x="68" y="66" fontFamily="Georgia, serif" fontWeight="bold" fontSize="24" fill="#a5b4fc" textAnchor="middle">
      5LB
    </text>
  </svg>
);

export const IconPresencingCircle: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Swirling sky blue brush arc */}
    <path
      d="M20 50 A 32 32 0 1 1 55 82 A 38 38 0 0 0 20 50"
      fill="#38bdf8"
    />
    <path
      d="M26 40 C 35 18, 65 18, 80 35 C 88 45, 88 65, 75 78 C 65 88, 48 85, 45 80"
      stroke="#0284c7"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Yellow 3-branched stick figure/star */}
    <line x1="50" y1="30" x2="50" y2="70" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
    <line x1="38" y1="42" x2="62" y2="58" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
    <line x1="62" y1="42" x2="38" y2="58" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const IconConsulenza: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Orange 5 */}
    <text x="32" y="70" fontFamily="Georgia, serif" fontWeight="bold" fontSize="62" fill="#ff5722">
      5
    </text>
    {/* Dark navy phone receiver handset tilted */}
    <path
      d="M 68 30 C 65 24 58 24 55 28 L 51 34 C 48 38 49 43 53 47 L 57 51 C 61 55 66 56 70 53 L 76 49 C 80 46 80 39 74 36 Z M 52 75 C 68 85 85 68 75 52 L 72 55 C 80 66 66 80 55 72 Z"
      fill="#0f172a"
    />
    <path
      d="M78 35 C82 42, 82 52, 75 60 L68 72 C64 77, 57 78, 52 74 L46 68 C42 64, 43 57, 48 53 L54 48 C57 45, 63 46, 67 50 L71 44 C67 38, 70 33, 75 32 Z"
      fill="#0f172a"
    />
  </svg>
);

export const IconFramework: React.FC<IconProps> = ({ className = 'w-8 h-5' }) => (
  <svg viewBox="0 0 140 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="5" y="44" fontFamily="Georgia, serif" fontWeight="bold" fontSize="42" fill="#2563eb">
      5LB
    </text>
    <text x="68" y="42" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="normal" fontSize="22" fill="#0f172a">
      framework
    </text>
  </svg>
);

export const IconHameriano: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stylized orange organic letter M with split */}
    <path
      d="M18 15 C26 15 36 20 40 28 L40 85 C32 85 22 82 18 78 Z"
      fill="#ff6b00"
    />
    <path
      d="M82 15 C74 15 64 20 60 28 L60 85 C68 85 78 82 82 78 Z"
      fill="#ff6b00"
    />
    <path
      d="M44 32 L50 20 L56 32 L56 82 L44 82 Z"
      fill="#ff8533"
    />
  </svg>
);

export const IconAndrogyne: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Yellow crossing arrows */}
    <path
      d="M10 32 L36 32 C48 32, 54 68, 66 68 L80 68"
      stroke="#eab308"
      strokeWidth="12"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M75 58 L92 68 L75 78 Z"
      fill="#eab308"
    />
    <path
      d="M10 68 L36 68 C48 68, 54 32, 66 32 L80 32"
      stroke="#eab308"
      strokeWidth="12"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M75 22 L92 32 L75 42 Z"
      fill="#eab308"
    />
  </svg>
);

export const IconCovid19: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="18" fill="#ef4444" />
    {/* 5 spokes with circle heads */}
    {[0, 72, 144, 216, 288].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 50 + Math.cos(rad) * 16;
      const y1 = 50 + Math.sin(rad) * 16;
      const x2 = 50 + Math.cos(rad) * 35;
      const y2 = 50 + Math.sin(rad) * 35;
      return (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
          <circle cx={x2} cy={y2} r="10" fill="#dc2626" />
        </g>
      );
    })}
  </svg>
);

export const Icon5LBHeaderLogo: React.FC<{ className?: string }> = ({ className = 'h-10' }) => (
  <div className={`flex items-baseline font-serif ${className}`}>
    <span className="text-3xl font-extrabold text-orange-500 tracking-tight">5LB</span>
    <span className="ml-1 text-2xl font-bold text-white tracking-normal font-sans">Magazine</span>
  </div>
);

export const IconNotebookLM: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="notebookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#9B72CF" />
        <stop offset="100%" stopColor="#EA4335" />
      </linearGradient>
    </defs>
    <rect x="15" y="15" width="70" height="70" rx="18" fill="url(#notebookGrad)" />
    {/* Notebook spine */}
    <rect x="23" y="24" width="6" height="52" rx="3" fill="#ffffff" opacity="0.6" />
    {/* AI spark stars */}
    <path
      d="M58 34 C58 40, 64 44, 70 44 C64 44, 58 48, 58 54 C58 48, 52 44, 46 44 C52 44, 58 40, 58 34 Z"
      fill="#ffffff"
    />
    <path
      d="M44 56 C44 59, 47 61, 50 61 C47 61, 44 63, 44 66 C44 63, 41 61, 38 61 C41 61, 44 59, 44 56 Z"
      fill="#ffffff"
      opacity="0.9"
    />
  </svg>
);

/**
 * ============================================================================
 * ICONE CATEGORIE EZIOLOGIA (Conformi allo screenshot di riferimento)
 * ============================================================================
 */

// Vie respiratorie (Polmoni)
export const IconLungs: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Trachea with cartilaginous rings */}
    <path
      d="M14.5 4 H17.5 V10 C17.5 11 18.5 12 19.5 13 M14.5 10 C14.5 11 13.5 12 12.5 13"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line x1="14.5" y1="6" x2="17.5" y2="6" stroke="#0f172a" strokeWidth="1.2" />
    <line x1="14.5" y1="8" x2="17.5" y2="8" stroke="#0f172a" strokeWidth="1.2" />
    {/* Right Lung (anatomical right / viewer's left) */}
    <path
      d="M13 11.5 C11 10.5 7.5 12.5 6 15.5 C4.5 19 4.8 24 7.5 27 C10 29 13.5 27.5 14 24.5 C14.5 21 14 16 13 11.5 Z"
      fill="#f472b6"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M5.5 19 C8 19.5 11 19.5 13.5 18" stroke="#be185d" strokeWidth="1.2" strokeLinecap="round" />
    {/* Left Lung (anatomical left / viewer's right with cardiac notch indent) */}
    <path
      d="M19 11.5 C21 10.5 24.5 12.5 26 15.5 C27.5 19 27.2 24 24.5 27 C22 29 19.5 26.5 19 24 C18.2 20 18 16 19 11.5 Z"
      fill="#f472b6"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M26.5 19 C24 19.5 21 19.5 18.5 18" stroke="#be185d" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Cavità orale (Labbra rosse)
export const IconMouth: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Upper lip */}
    <path
      d="M4 16 C8 10.5 12 10.5 16 12.5 C20 10.5 24 10.5 28 16 C24 17.5 20 17 16 16.5 C12 17 8 17.5 4 16 Z"
      fill="#ef4444"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Lower lip */}
    <path
      d="M4 16 C8 17.5 12 17 16 16.5 C20 17 24 17.5 28 16 C26 23.5 18 24 16 24 C14 24 6 23.5 4 16 Z"
      fill="#dc2626"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Inner white slit */}
    <path
      d="M8.5 16 C11.5 15.5 14 15.2 16 15.2 C18 15.2 20.5 15.5 23.5 16 C21 17 18 17.2 16 17.2 C14 17.2 11 17 8.5 16 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="1"
    />
  </svg>
);

// Seno (Fonendoscopio / Stetoscopio)
export const IconStethoscope: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Earpieces */}
    <circle cx="8" cy="6" r="1.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
    <circle cx="15" cy="6" r="1.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
    {/* Binaural metal tubes */}
    <path
      d="M8 7.5 C8 12 10.5 14 11.5 14 C12.5 14 15 12 15 7.5"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Blue flexible tubing */}
    <path
      d="M11.5 14 V17 C11.5 22.5 17 25 20.5 22 C23.5 19 21.5 15 18 15"
      stroke="#0284c7"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M11.5 14 V17 C11.5 22.5 17 25 20.5 22 C23.5 19 21.5 15 18 15"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    {/* Metallic connector */}
    <line x1="20.5" y1="22" x2="23" y2="24" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
    {/* Diaphragm / chest piece */}
    <circle cx="25" cy="25.5" r="4" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.8" />
    <circle cx="25" cy="25.5" r="2.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
  </svg>
);

// App. gastro-intestinale (Piatto, forchetta e coltello)
export const IconGastro: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fork on left */}
    <path
      d="M5.5 6 V12.5 C5.5 14 7 15 8 15 V26 M8 6 V12.5 M10.5 6 V12.5 C10.5 14 9 15 8 15"
      stroke="#0f172a"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Round plate in center */}
    <circle cx="16" cy="16" r="7.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" />
    <circle cx="16" cy="16" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
    {/* Knife on right */}
    <path
      d="M24 6 C26 8 26 14.5 24 15.5 V26"
      stroke="#0f172a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// App. cardio-circolatorio (Cuore)
export const IconHeartEzio: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 27.5 C15.4 27 6 20 4.5 13.5 C3.2 8 7.5 4 12.5 4.5 C14.5 4.7 15.5 5.8 16 6.8 C16.5 5.8 17.5 4.7 19.5 4.5 C24.5 4 28.8 8 27.5 13.5 C26 20 16.6 27 16 27.5 Z"
      fill="#ef4444"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Glossy highlight */}
    <path
      d="M8.5 8.5 C7.5 10 7.2 12 7.6 13.8"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

// Apparato urinario (Goccia d'acqua)
export const IconUrinary: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 4 C16 4 7 15 7 21 C7 26 11 29 16 29 C21 29 25 26 25 21 C25 15 16 4 16 4 Z"
      fill="#38bdf8"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Highlight reflection */}
    <path
      d="M11 20 C10.5 17 13 12 14.5 10"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

// Apparato genitale (Elica del DNA)
export const IconDNA: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-45 16 16)">
      {/* 4 horizontal colored rungs */}
      <line x1="10" y1="8" x2="22" y2="8" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="12" y1="13" x2="20" y2="13" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="10" y1="18" x2="22" y2="18" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="12" y1="23" x2="20" y2="23" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" />
      {/* Strands */}
      <path
        d="M9 5 C11 10.5 21 12.5 21 17 C21 21.5 11 23.5 9 29"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M23 5 C21 10.5 11 12.5 11 17 C11 21.5 21 23.5 23 29"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
);

// App. muscolo-scheletrico (Osso)
export const IconBone: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-45 16 16)">
      <path
        d="M9 13.5 C7 13.5 5.5 12 5.5 10 C5.5 8 7 6.5 9 6.5 C10 6.5 11 7 11.5 8 C12 7 13 6.5 14 6.5 C16 6.5 17.5 8 17.5 10 C17.5 12 16 13.5 14 13.5 H13.5 V18.5 H14 C16 18.5 17.5 20 17.5 22 C17.5 24 16 25.5 14 25.5 C13 25.5 12 25 11.5 24 C11 25 10 25.5 9 25.5 C7 25.5 5.5 24 5.5 22 C5.5 20 7 18.5 9 18.5 H9.5 V13.5 H9 Z"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// La pelle (Mano aperta)
export const IconSkin: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.5 16 C7 16.5 6 18 6.5 20 C7.8 23.5 10.5 27.5 14.5 28.5 C19 29.5 23.5 27.5 25 23 C25.8 20.5 25.5 17 25 14 C24.8 12.8 23.5 12.5 22.5 13.5 C22.2 11.5 20.8 11.2 19.8 12.2 C19.5 10 18 9.5 17 10.5 C16.5 7.8 15 7.5 14 8.5 C13 9.5 13 14 13 17 L12 16.5 C10.8 15.5 9.5 15.5 8.5 16 Z"
      fill="#f59e0b"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

// Sistema nervoso (Cervello)
export const IconBrain: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 6 C12 6 8.5 8 6.5 11 C4.5 13.5 4.5 16.5 5.8 19 C5 21 5.5 23.5 7.2 25 C9 26.5 12 26.5 14.5 25.2 C15 25.6 15.8 25.6 16.5 25.2 C19 26.5 22 26.5 23.8 25 C25.5 23.5 26 21 25.2 19 C26.5 16.5 26.5 13.5 24.5 11 C22.5 8 19 6 16 6 Z"
      fill="#f472b6"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 7.5 V24 M11.5 11.5 C13.5 13.5 13.5 16.5 11.5 18.5 M19.5 11.5 C17.5 13.5 17.5 16.5 19.5 18.5 M7 15.5 C9.5 15.5 10.5 17.5 11.5 20.5 M24 15.5 C21.5 15.5 20.5 17.5 19.5 20.5"
      stroke="#0f172a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Vista, udito, olfatto (Occhio)
export const IconEyeSenses: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White Sclera */}
    <path
      d="M4 16 C8 10 16 6.5 16 6.5 C16 6.5 24 10 28 16 C24 22 16 25.5 16 25.5 C16 25.5 8 22 4 16 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Amber / brown Iris */}
    <circle cx="16" cy="16" r="5.5" fill="#d97706" stroke="#0f172a" strokeWidth="1.6" />
    {/* Dark Pupil */}
    <circle cx="16" cy="16" r="2.8" fill="#0f172a" />
    {/* White glint */}
    <circle cx="14.6" cy="14.6" r="1.1" fill="#ffffff" />
  </svg>
);

// Intolleranze e allergie (Ramoscello con foglie verdi)
export const IconAllergiesLeaf: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stalk */}
    <path
      d="M7 26 C12 21 16 15 25 5"
      stroke="#166534"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Top leaf */}
    <path
      d="M25 5 C25 9.5 21 11.5 18 10.5 C18 6.5 21 4.5 25 5 Z"
      fill="#4ade80"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Right upper leaf */}
    <path
      d="M20 12.5 C24 13.5 25 18 21.5 19 C18 18 17.5 14 20 12.5 Z"
      fill="#22c55e"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Left middle leaf */}
    <path
      d="M15 14 C12 12.5 7.5 15.5 9 19 C12.5 19.5 14.5 16.5 15 14 Z"
      fill="#4ade80"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Right lower leaf */}
    <path
      d="M15 20 C18.5 21 19 25 16 26 C13 25 13 22 15 20 Z"
      fill="#22c55e"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Left lower leaf */}
    <path
      d="M11 21 C8.5 20 5 22.5 6 25.5 C9 26 10.5 23.5 11 21 Z"
      fill="#4ade80"
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

// Psicosi (Fulmine giallo)
export const IconLightningPsicosi: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 3.5 L8 16.5 H16 L14 28.5 L24 14.5 H16 L18 3.5 Z"
      fill="#facc15"
      stroke="#0f172a"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

// La lateralità (Bilancia della giustizia)
export const IconScalesLaterality: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base stand */}
    <path d="M11 27 H21 V25 C21 24.2 19 24 16 24 C13 24 11 24.2 11 25 Z" fill="#eab308" stroke="#0f172a" strokeWidth="1.6" />
    {/* Central Pillar */}
    <line x1="16" y1="7" x2="16" y2="24" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
    {/* Top finial / circle */}
    <circle cx="16" cy="6.5" r="2" fill="#facc15" stroke="#0f172a" strokeWidth="1.6" />
    {/* Horizontal crossbeam */}
    <line x1="6.5" y1="10.5" x2="25.5" y2="10.5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
    {/* Left Pan */}
    <line x1="6.5" y1="10.5" x2="4" y2="18.5" stroke="#0f172a" strokeWidth="1.3" />
    <line x1="6.5" y1="10.5" x2="9" y2="18.5" stroke="#0f172a" strokeWidth="1.3" />
    <path d="M3.5 18.5 C3.5 21 9.5 21 9.5 18.5 Z" fill="#facc15" stroke="#0f172a" strokeWidth="1.6" />
    {/* Right Pan */}
    <line x1="25.5" y1="10.5" x2="23" y2="18.5" stroke="#0f172a" strokeWidth="1.3" />
    <line x1="25.5" y1="10.5" x2="28" y2="18.5" stroke="#0f172a" strokeWidth="1.3" />
    <path d="M22.5 18.5 C22.5 21 28.5 21 28.5 18.5 Z" fill="#facc15" stroke="#0f172a" strokeWidth="1.6" />
  </svg>
);


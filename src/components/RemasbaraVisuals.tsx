import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const RemasbaraLogo: React.FC<LogoProps> = ({ className = '', size = 76 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Resmi Remasbara - Remaja Masjid Baiturrahman Cikumpa Kota Depok"
    >
      <defs>
        {/* Top Arc for Circular Text: REMAJA MASJID BAITURRAHMAN */}
        <path
          id="topTextArc"
          d="M 40,150 A 110,110 0 1,1 260,150"
          fill="none"
        />
        {/* Bottom Arc for Circular Text: KOTA DEPOK */}
        <path
          id="bottomTextArc"
          d="M 260,150 A 110,110 0 0,1 40,150"
          fill="none"
        />
        {/* Shadow filter for slight depth */}
        <filter id="subtleDrop" x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Outer red boundary ring */}
      <circle cx="150" cy="150" r="144" fill="#d9121b" />
      <circle cx="150" cy="150" r="144" stroke="#ffffff" strokeWidth="4" />
      <circle cx="150" cy="150" r="138" stroke="#ffffff" strokeWidth="2.5" />

      {/* Inner circular white separator line between text band and center disc */}
      <circle cx="150" cy="150" r="82" fill="#d9121b" stroke="#ffffff" strokeWidth="3" />

      {/* TOP CIRCULAR TEXT: REMAJA MASJID BAITURRAHMAN */}
      <text
        fill="#ffffff"
        fontSize="17.5"
        fontWeight="800"
        letterSpacing="2.8"
        fontFamily="Arial, 'Plus Jakarta Sans', sans-serif"
      >
        <textPath href="#topTextArc" startOffset="50%" textAnchor="middle">
          REMAJA MASJID BAITURRAHMAN
        </textPath>
      </text>

      {/* TWO SEPARATOR DOTS */}
      <circle cx="34" cy="150" r="6" fill="#ffffff" />
      <circle cx="266" cy="150" r="6" fill="#ffffff" />

      {/* BOTTOM CIRCULAR TEXT: KOTA DEPOK */}
      <text
        fill="#ffffff"
        fontSize="20.5"
        fontWeight="900"
        letterSpacing="4"
        fontFamily="Arial, 'Plus Jakarta Sans', sans-serif"
      >
        <textPath href="#bottomTextArc" startOffset="50%" textAnchor="middle">
          KOTA DEPOK
        </textPath>
      </text>

      {/* CENTER EMBLEM GRAPHICS */}
      <g id="centerGraphic">
        {/* Crescent Moon Swoosh wrapping from left over the top */}
        <path
          d="M 98,172 C 86,136 102,96 136,78 C 160,65 190,68 206,78 C 172,70 134,84 116,112 C 104,130 102,152 108,170 Z"
          fill="#ffffff"
        />

        {/* 5 Horizontal Speed Bars on the upper right */}
        <rect x="162" y="108" width="56" height="7.5" fill="#ffffff" rx="1.5" />
        <rect x="170" y="119" width="48" height="7.5" fill="#ffffff" rx="1.5" />
        <rect x="178" y="130" width="40" height="7.5" fill="#ffffff" rx="1.5" />
        <rect x="181" y="141" width="53" height="7.5" fill="#ffffff" rx="1.5" />
        <rect x="188" y="152" width="46" height="7.5" fill="#ffffff" rx="1.5" />

        {/* Mosque Silhouette: Minaret & Dome in pure White */}
        {/* Left Minaret */}
        <rect x="121" y="122" width="8" height="52" fill="#ffffff" />
        <path d="M 120,122 L 130,122 L 128,114 L 122,114 Z" fill="#ffffff" />
        <path d="M 125,103 C 122,107 122,114 122,114 L 128,114 C 128,114 128,107 125,103 Z" fill="#ffffff" />
        {/* Minaret Crescent Finial */}
        <circle cx="125" cy="101" r="1.8" fill="#ffffff" />

        {/* Small arch wall left */}
        <path d="M 106,174 L 106,168 C 106,164 110,161 114,161 L 116,161 L 116,174 Z" fill="#ffffff" />

        {/* Main Central Mosque Dome */}
        <path
          d="M 128,174 L 128,162 C 128,154 133,142 142,136 C 146,133 148,127 148,122 L 150,122 C 150,127 152,133 156,136 C 165,142 170,154 170,162 L 170,174 Z"
          fill="#ffffff"
        />
        {/* Dome Crescent Pinnacle */}
        <path
          d="M 149,102 C 153,102 156,105 156,109 C 156,113 153,116 149,116 C 147,116 145,115 144,114 C 147,114 150,112 150,109 C 150,106 147,104 144,104 C 145,103 147,102 149,102 Z"
          fill="#ffffff"
        />
        <rect x="148.5" y="116" width="1.8" height="6.5" fill="#ffffff" />

        {/* Right Building Block Behind / Connecting */}
        <rect x="170" y="162" width="34" height="12" fill="#ffffff" />

        {/* Base Solid White Area for REMASBARA CIKUMPA text */}
        <rect x="100" y="174" width="104" height="38" fill="#ffffff" rx="1.5" />

        {/* Text inside White Base: REMASBARA / CIKUMPA in Red */}
        <text
          x="152"
          y="189"
          textAnchor="middle"
          fill="#d9121b"
          fontSize="12.5"
          fontWeight="900"
          letterSpacing="1.8"
          fontFamily="Arial, 'Plus Jakarta Sans', sans-serif"
        >
          REMASBARA
        </text>

        {/* Underline beneath REMASBARA */}
        <line x1="108" y1="193" x2="196" y2="193" stroke="#d9121b" strokeWidth="1.8" />

        <text
          x="152"
          y="207"
          textAnchor="middle"
          fill="#d9121b"
          fontSize="10.8"
          fontWeight="800"
          letterSpacing="3"
          fontFamily="Arial, 'Plus Jakarta Sans', sans-serif"
        >
          CIKUMPA
        </text>
      </g>
    </svg>
  );
};

interface StampProps {
  color?: 'emerald' | 'blue' | 'purple' | 'red';
  opacity?: number;
  className?: string;
  size?: number;
}

export const RemasbaraOfficialStamp: React.FC<StampProps> = ({
  color = 'red',
  opacity = 0.92,
  className = '',
  size = 135,
}) => {
  const colorMap = {
    red: {
      stroke: '#d9121b',
      text: '#d9121b',
      fill: 'rgba(217, 18, 27, 0.04)',
    },
    emerald: {
      stroke: '#047857',
      text: '#047857',
      fill: 'rgba(4, 120, 87, 0.04)',
    },
    blue: {
      stroke: '#1d4ed8',
      text: '#1d4ed8',
      fill: 'rgba(29, 78, 216, 0.04)',
    },
    purple: {
      stroke: '#6d28d9',
      text: '#6d28d9',
      fill: 'rgba(109, 40, 217, 0.04)',
    },
  };

  const selected = colorMap[color] || colorMap.red;

  return (
    <div
      style={{ opacity, width: size, height: size }}
      className={`relative select-none pointer-events-none transform -rotate-6 ${className}`}
      title="Stempel Resmi Remasbara Baiturrahman Cikumpa Depok"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer double borders */}
        <circle cx="100" cy="100" r="95" stroke={selected.stroke} strokeWidth="3.5" fill={selected.fill} />
        <circle cx="100" cy="100" r="88" stroke={selected.stroke} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="62" stroke={selected.stroke} strokeWidth="2" strokeDasharray="4 2" />

        {/* Circular text path for TOP text: REMAJA MASJID BAITURRAHMAN */}
        <defs>
          <path
            id="stampTopArc"
            d="M 22,100 A 78,78 0 0,1 178,100"
            fill="none"
          />
          <path
            id="stampBottomArc"
            d="M 178,100 A 78,78 0 0,1 22,100"
            fill="none"
          />
        </defs>

        <text
          fill={selected.text}
          fontSize="11.5"
          fontWeight="bold"
          letterSpacing="2.8"
          fontFamily="Arial, sans-serif"
        >
          <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
            REMAJA MASJID BAITURRAHMAN
          </textPath>
        </text>

        <text
          fill={selected.text}
          fontSize="11.5"
          fontWeight="bold"
          letterSpacing="3"
          fontFamily="Arial, sans-serif"
        >
          <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
            ★ CIKUMPA DEPOK ★
          </textPath>
        </text>

        {/* Center decorative emblem & text */}
        <path
          d="M 100,68 C 103,73 108,76 108,82 C 108,87 104,90 100,90 C 96,90 92,87 92,82 C 92,76 97,73 100,68 Z"
          fill={selected.stroke}
        />
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill={selected.text}
          fontSize="17"
          fontWeight="900"
          letterSpacing="2.5"
          fontFamily="Arial, sans-serif"
        >
          REMASBARA
        </text>
        <line x1="72" y1="114" x2="128" y2="114" stroke={selected.stroke} strokeWidth="1.5" />
        <text
          x="100"
          y="126"
          textAnchor="middle"
          fill={selected.text}
          fontSize="9.5"
          fontWeight="bold"
          letterSpacing="1"
          fontFamily="Arial, sans-serif"
        >
          PENGURUS HARIAN
        </text>
      </svg>
    </div>
  );
};

export const KemasjidanOfficialStamp: React.FC<StampProps> = ({
  color = 'emerald',
  opacity = 0.92,
  className = '',
  size = 135,
}) => {
  const colorMap = {
    red: {
      stroke: '#d9121b',
      text: '#d9121b',
      fill: 'rgba(217, 18, 27, 0.04)',
    },
    emerald: {
      stroke: '#047857',
      text: '#047857',
      fill: 'rgba(4, 120, 87, 0.04)',
    },
    blue: {
      stroke: '#1d4ed8',
      text: '#1d4ed8',
      fill: 'rgba(29, 78, 216, 0.04)',
    },
    purple: {
      stroke: '#6d28d9',
      text: '#6d28d9',
      fill: 'rgba(109, 40, 217, 0.04)',
    },
  };

  const selected = colorMap[color] || colorMap.emerald;

  return (
    <div
      style={{ opacity, width: size, height: size }}
      className={`relative select-none pointer-events-none transform -rotate-6 ${className}`}
      title="Stempel Resmi Bidang Kemasjidan Yayasan Masjid Baiturrahman"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer double borders */}
        <circle cx="100" cy="100" r="95" stroke={selected.stroke} strokeWidth="3.5" fill={selected.fill} />
        <circle cx="100" cy="100" r="88" stroke={selected.stroke} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="62" stroke={selected.stroke} strokeWidth="2" strokeDasharray="4 2" />

        <defs>
          <path
            id="kemasjidanTopArc"
            d="M 22,100 A 78,78 0 0,1 178,100"
            fill="none"
          />
          <path
            id="kemasjidanBottomArc"
            d="M 178,100 A 78,78 0 0,1 22,100"
            fill="none"
          />
        </defs>

        <text
          fill={selected.text}
          fontSize="10.8"
          fontWeight="bold"
          letterSpacing="2.2"
          fontFamily="Arial, sans-serif"
        >
          <textPath href="#kemasjidanTopArc" startOffset="50%" textAnchor="middle">
            YAYASAN MASJID BAITURRAHMAN
          </textPath>
        </text>

        <text
          fill={selected.text}
          fontSize="11"
          fontWeight="bold"
          letterSpacing="2.5"
          fontFamily="Arial, sans-serif"
        >
          <textPath href="#kemasjidanBottomArc" startOffset="50%" textAnchor="middle">
            ★ BIDANG KEMASJIDAN ★
          </textPath>
        </text>

        {/* Center emblem: Dome shape */}
        <path
          d="M 100,68 C 105,74 112,80 112,86 C 112,92 106,94 100,94 C 94,94 88,92 88,86 C 88,80 95,74 100,68 Z"
          fill={selected.stroke}
        />
        <text
          x="100"
          y="110"
          textAnchor="middle"
          fill={selected.text}
          fontSize="14"
          fontWeight="900"
          letterSpacing="1.8"
          fontFamily="Arial, sans-serif"
        >
          KEMASJIDAN
        </text>
        <line x1="68" y1="116" x2="132" y2="116" stroke={selected.stroke} strokeWidth="1.5" />
        <text
          x="100"
          y="128"
          textAnchor="middle"
          fill={selected.text}
          fontSize="9"
          fontWeight="bold"
          letterSpacing="1"
          fontFamily="Arial, sans-serif"
        >
          MEKARJAYA DEPOK
        </text>
      </svg>
    </div>
  );
};

export const YayasanOfficialStamp: React.FC<StampProps> = ({
  color = 'emerald',
  opacity = 0.92,
  className = '',
  size = 135,
}) => {
  const colorMap = {
    red: {
      stroke: '#d9121b',
      text: '#d9121b',
      fill: 'rgba(217, 18, 27, 0.04)',
    },
    emerald: {
      stroke: '#047857',
      text: '#047857',
      fill: 'rgba(4, 120, 87, 0.04)',
    },
    blue: {
      stroke: '#1d4ed8',
      text: '#1d4ed8',
      fill: 'rgba(29, 78, 216, 0.04)',
    },
    purple: {
      stroke: '#6d28d9',
      text: '#6d28d9',
      fill: 'rgba(109, 40, 217, 0.04)',
    },
  };

  const selected = colorMap[color] || colorMap.emerald;

  return (
    <div
      style={{ opacity, width: size, height: size }}
      className={`relative select-none pointer-events-none transform -rotate-6 ${className}`}
      title="Stempel Resmi Yayasan Masjid Baiturrahman"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer double borders */}
        <circle cx="100" cy="100" r="95" stroke={selected.stroke} strokeWidth="3.5" fill={selected.fill} />
        <circle cx="100" cy="100" r="88" stroke={selected.stroke} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="62" stroke={selected.stroke} strokeWidth="2" strokeDasharray="4 2" />

        <defs>
          <path
            id="yayasanTopArc"
            d="M 22,100 A 78,78 0 0,1 178,100"
            fill="none"
          />
          <path
            id="yayasanBottomArc"
            d="M 178,100 A 78,78 0 0,1 22,100"
            fill="none"
          />
        </defs>

        <text
          fill={selected.text}
          fontSize="10.8"
          fontWeight="bold"
          letterSpacing="2.2"
          fontFamily="Arial, sans-serif"
        >
          <textPath href="#yayasanTopArc" startOffset="50%" textAnchor="middle">
            YAYASAN MASJID BAITURRAHMAN
          </textPath>
        </text>

        <text
          fill={selected.text}
          fontSize="11.5"
          fontWeight="bold"
          letterSpacing="3"
          fontFamily="Arial, sans-serif"
        >
          <textPath href="#yayasanBottomArc" startOffset="50%" textAnchor="middle">
            ★ KOTA DEPOK ★
          </textPath>
        </text>

        {/* Center emblem: 8-pointed star / emblem */}
        <polygon
          points="100,70 104,79 113,80 106,87 108,96 100,91 92,96 94,87 87,80 96,79"
          fill={selected.stroke}
        />
        <text
          x="100"
          y="111"
          textAnchor="middle"
          fill={selected.text}
          fontSize="16"
          fontWeight="900"
          letterSpacing="2.2"
          fontFamily="Arial, sans-serif"
        >
          YAYASAN
        </text>
        <line x1="68" y1="117" x2="132" y2="117" stroke={selected.stroke} strokeWidth="1.5" />
        <text
          x="100"
          y="129"
          textAnchor="middle"
          fill={selected.text}
          fontSize="9"
          fontWeight="bold"
          letterSpacing="1"
          fontFamily="Arial, sans-serif"
        >
          PENGURUS HARIAN
        </text>
      </svg>
    </div>
  );
};

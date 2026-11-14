import React from 'react';

interface MakeQRLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/** MakeQR brand mark: a QR code with a spark in the corner. */
export const MakeQRLogo: React.FC<MakeQRLogoProps> = ({ className = 'h-9 w-9', size, showText = false }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <div className={`inline-flex items-center gap-2 ${showText ? '' : 'shrink-0'}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        fill="none"
        className={className}
        width={size}
        height={size}
        role="img"
        aria-label="MakeQR"
      >
        <defs>
          <linearGradient id={`mq-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset=".55" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#db2777" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill={`url(#mq-${id})`} />
        <g fill="none" stroke="#fff" strokeWidth="5">
          <rect x="15.5" y="15.5" width="31" height="31" rx="9" />
          <rect x="73.5" y="15.5" width="31" height="31" rx="9" />
          <rect x="15.5" y="73.5" width="31" height="31" rx="9" />
        </g>
        <g fill="#fff">
          <rect x="25" y="25" width="12" height="12" rx="3.5" />
          <rect x="83" y="25" width="12" height="12" rx="3.5" />
          <rect x="25" y="83" width="12" height="12" rx="3.5" />
          <rect x="56" y="18" width="9" height="9" rx="3" opacity=".85" />
          <rect x="56" y="36" width="9" height="9" rx="3" />
          <rect x="18" y="56" width="9" height="9" rx="3" />
          <rect x="36" y="56" width="9" height="9" rx="3" opacity=".85" />
          <rect x="56" y="56" width="9" height="9" rx="3" />
          <rect x="74" y="56" width="9" height="9" rx="3" opacity=".85" />
          <rect x="92" y="56" width="9" height="9" rx="3" />
          <rect x="56" y="74" width="9" height="9" rx="3" opacity=".85" />
          <rect x="74" y="92" width="9" height="9" rx="3" />
        </g>
        <path d="M91 72l4.2 9.8L105 86l-9.8 4.2L91 100l-4.2-9.8L77 86l9.8-4.2z" fill="#fbbf24" />
      </svg>
      {showText && <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">MakeQR</span>}
    </div>
  );
};

import React, { useId } from 'react';
import { ExclusiveDesign } from '../utils/tiers';

// A tiny decorative QR-like pattern (not scannable) used to preview a design
const N = 13;
const SEED = '1011010011101001101101001011001110100110110010100111010110100110010110011010010101101001101011100101';
const isFinder = (x: number, y: number) => (x < 4 && y < 4) || (x > N - 5 && y < 4) || (x < 4 && y > N - 5);

export const DesignSwatch: React.FC<{ design: ExclusiveDesign; size?: number }> = ({ design, size = 72 }) => {
  const id = useId().replace(/:/g, '');
  const { colors, shapes } = design;
  const round = shapes.dotType === 'dots' || shapes.dotType === 'extra-rounded' || shapes.dotType === 'rounded' || shapes.dotType === 'classy-rounded';
  const dotR = shapes.dotType === 'dots' ? 0.5 : shapes.dotType === 'square' ? 0 : 0.3;
  const eyeR = shapes.cornerSquareType === 'square' ? 0 : 0.9;
  const rad = (angle: number) => ({ x2: 50 + 50 * Math.cos((angle * Math.PI) / 180), y2: 50 + 50 * Math.sin((angle * Math.PI) / 180) });
  const g = rad(colors.gradientAngle);
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (isFinder(x, y)) continue;
      if (SEED[(y * N + x) % SEED.length] === '1') {
        cells.push(<rect key={`${x}-${y}`} x={x + (round ? 0.08 : 0)} y={y + (round ? 0.08 : 0)} width={round ? 0.84 : 1} height={round ? 0.84 : 1} rx={dotR} fill={`url(#g${id})`} />);
      }
    }
  }
  const eye = (ox: number, oy: number) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox + 0.5} y={oy + 0.5} width={3} height={3} rx={eyeR} fill="none" stroke={colors.eyeOuterColor} strokeWidth={1} />
      <rect x={ox + 1.4} y={oy + 1.4} width={1.2} height={1.2} rx={0.6} fill={colors.eyeInnerColor} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="rounded-lg shadow-sm" role="img" aria-label={`${design.name} preview`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0%" y1="0%" x2={`${g.x2}%`} y2={`${g.y2}%`}>
          <stop offset="0%" stopColor={colors.fgColor1} />
          <stop offset="100%" stopColor={colors.fgColor2} />
        </linearGradient>
      </defs>
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill={colors.bgColor} />
      {cells}
      {eye(0, 0)}{eye(N - 4, 0)}{eye(0, N - 4)}
    </svg>
  );
};

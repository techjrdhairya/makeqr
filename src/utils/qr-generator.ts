import QRCodeStyling, { Options } from 'qr-code-styling';
import jsQR from 'jsqr';
import { QRConfig, ScanVerificationResult } from '../types';
import { generatePayloadString } from './vcard-wifi-helpers';
import { BUILTIN_LOGOS } from './qr-constants';

/**
 * The exact text/URL a QR code encodes. Use this everywhere a link or content is shown or copied,
 * so it can never disagree with what the QR code really contains.
 */
export function getConfigPayload(config: QRConfig): string {
  return generatePayloadString(config.contentType, {
    url: config.url,
    text: config.text,
    file: config.file,
    wifi: config.wifi,
    vcard: config.vcard,
    email: config.email,
    phone: config.phone,
    sms: config.sms,
    event: config.event,
    geo: config.geo,
    crypto: config.crypto,
    quicklink: config.quicklink,
    page: config.page,
    social: config.social,
    dynamic: config.dynamic,
    expirationDate: config.expirationDate,
    expirationMessage: config.expirationMessage,
  });
}

/**
 * Builds standard QRCodeStyling options from our QRConfig
 */
export function buildQRCodeStylingOptions(config: QRConfig, size: number = 320): Options {
  const payload = getConfigPayload(config);

  // Resolve logo image
  let logoUrl: string | undefined = undefined;
  if (config.logo.sourceType === 'builtin') {
    const found = BUILTIN_LOGOS.find((l) => l.id === config.logo.builtinId);
    logoUrl = found?.svgDataUri;
  } else if (config.logo.sourceType === 'upload' && config.logo.uploadedUrl) {
    logoUrl = config.logo.uploadedUrl;
  }

  // Foreground gradient vs solid
  const dotsOptions: Options['dotsOptions'] = {
    type: config.shapes.dotType,
    color: config.colors.fgColor1,
  };

  if (config.colors.foregroundType !== 'none') {
    const angleRad = (config.colors.gradientAngle * Math.PI) / 180;
    dotsOptions.gradient = {
      type: config.colors.foregroundType,
      rotation: angleRad,
      colorStops: [
        { offset: 0, color: config.colors.fgColor1 },
        { offset: 1, color: config.colors.fgColor2 },
      ],
    };
  }

  const cornersSquareOptions: Options['cornersSquareOptions'] = {
    type: config.shapes.cornerSquareType,
  };
  if (config.colors.customEyeColors) {
    cornersSquareOptions.color = config.colors.eyeOuterColor;
  } else if (config.colors.foregroundType === 'none') {
    cornersSquareOptions.color = config.colors.fgColor1;
  }

  const cornersDotOptions: Options['cornersDotOptions'] = {
    type: config.shapes.cornerDotType,
  };
  if (config.colors.customEyeColors) {
    cornersDotOptions.color = config.colors.eyeInnerColor;
  } else if (config.colors.foregroundType === 'none') {
    cornersDotOptions.color = config.colors.fgColor1;
  }

  // Ensure payload never exceeds QR code physical matrix overflow (~2800 chars)
  const safeData = payload && payload.length > 2800 
    ? payload.substring(0, 2750) 
    : (payload || 'https://example.com');

  return {
    width: size,
    height: size,
    type: 'canvas',
    data: safeData,
    margin: 10,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: config.logo.sourceType !== 'none' ? 'H' : config.errorCorrectionLevel,
    },
    image: logoUrl,
    imageOptions: {
      hideBackgroundDots: config.logo.hideBackgroundDots,
      imageSize: config.logo.size,
      margin: config.logo.margin,
      crossOrigin: 'anonymous',
    },
    dotsOptions,
    cornersSquareOptions,
    cornersDotOptions,
    backgroundOptions: {
      color: config.colors.isTransparentBg ? 'rgba(255,255,255,0)' : config.colors.bgColor,
    },
  };
}

/**
 * Calculates luminance of a hex color
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates contrast ratio and scanability health score
 */
export function calculateScanHealth(config: QRConfig): {
  score: number;
  contrastRatio: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  warnings: string[];
} {
  const warnings: string[] = [];
  let score = 100;

  // 1. Contrast check
  const bgL = config.colors.isTransparentBg ? 1.0 : getLuminance(config.colors.bgColor);
  const fg1L = getLuminance(config.colors.fgColor1);
  const ratio1 = (Math.max(bgL, fg1L) + 0.05) / (Math.min(bgL, fg1L) + 0.05);

  let effectiveRatio = ratio1;
  if (config.colors.foregroundType !== 'none') {
    const fg2L = getLuminance(config.colors.fgColor2);
    const ratio2 = (Math.max(bgL, fg2L) + 0.05) / (Math.min(bgL, fg2L) + 0.05);
    effectiveRatio = Math.min(ratio1, ratio2);
  }

  if (effectiveRatio < 3) {
    score -= 35;
    warnings.push('Contrast ratio is very low (< 3:1). Cameras may fail to detect.');
  } else if (effectiveRatio < 4.5) {
    score -= 15;
    warnings.push('Moderate contrast. We recommend increasing difference between QR and background.');
  }

  // 2. Logo size vs error correction
  if (config.logo.sourceType !== 'none') {
    if (config.logo.size > 0.32) {
      score -= 15;
      warnings.push('Large logo covers substantial data area. Keep error correction on High (H).');
    }
  }

  // 3. Inverted colors (light QR on dark background)
  if (fg1L > bgL) {
    // Light on dark
    score -= 5;
    warnings.push('Light-on-dark QR codes can take slightly longer for older phone cameras to focus.');
  }

  // 4. Payload density
  const payload = generatePayloadString(config.contentType, {
    url: config.url,
    text: config.text,
    file: config.file,
    wifi: config.wifi,
    vcard: config.vcard,
    email: config.email,
    phone: config.phone,
    sms: config.sms,
    quicklink: config.quicklink,
    page: config.page,
  });

  if (payload.length > 800) {
    score -= 10;
    warnings.push('Data payload is quite long, producing dense modules. Print at 5x5 cm or larger.');
  }

  score = Math.max(20, Math.min(100, score));

  let grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
  if (score >= 90) grade = 'Excellent';
  else if (score >= 75) grade = 'Good';
  else if (score >= 50) grade = 'Fair';
  else grade = 'Poor';

  return {
    score,
    contrastRatio: Number(effectiveRatio.toFixed(2)),
    grade,
    warnings,
  };
}

/**
 * Composites the branded frame around the generated QR code canvas
 * Returns a high-res output HTMLCanvasElement
 */
export async function compositeFramedQR(
  qrCanvas: HTMLCanvasElement,
  config: QRConfig,
  targetQRSize: number = 600
): Promise<HTMLCanvasElement> {
  const { frame } = config;
  const outCanvas = document.createElement('canvas');
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return qrCanvas;

  if (frame.style === 'none') {
    outCanvas.width = targetQRSize;
    outCanvas.height = targetQRSize;
    ctx.drawImage(qrCanvas, 0, 0, targetQRSize, targetQRSize);
    return outCanvas;
  }

  const scale = targetQRSize / 320;
  const qrPadding = Math.round(24 * scale);

  switch (frame.style) {
    case 'bottom-banner': {
      const bannerHeight = Math.round(72 * scale);
      const subHeight = frame.subtitle ? Math.round(24 * scale) : 0;
      const totalWidth = targetQRSize + qrPadding * 2;
      const totalHeight = targetQRSize + qrPadding * 2 + bannerHeight + subHeight;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Outer card background
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(20 * scale));
      ctx.fill();

      // Card border
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeStyle = '#e2e8f0';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(20 * scale));
      ctx.stroke();

      // Draw QR Canvas
      ctx.drawImage(qrCanvas, qrPadding, qrPadding, targetQRSize, targetQRSize);

      // Bottom banner box
      const bannerY = targetQRSize + qrPadding + Math.round(12 * scale);
      const bannerW = totalWidth - qrPadding * 2;
      const bannerH = bannerHeight + subHeight - Math.round(12 * scale);

      ctx.fillStyle = frame.frameColor || '#1e1b4b';
      roundRect(ctx, qrPadding, bannerY, bannerW, bannerH, Math.round(12 * scale));
      ctx.fill();

      // Banner text
      ctx.fillStyle = frame.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(20 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      
      const titleY = frame.subtitle
        ? bannerY + Math.round(24 * scale)
        : bannerY + bannerH / 2;
      ctx.fillText(frame.title || 'SCAN ME', totalWidth / 2, titleY);

      if (frame.subtitle) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.font = `500 ${Math.round(12 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillText(frame.subtitle, totalWidth / 2, titleY + Math.round(24 * scale));
      }

      break;
    }

    case 'top-pill': {
      const topHeight = Math.round(68 * scale);
      const totalWidth = targetQRSize + qrPadding * 2;
      const totalHeight = targetQRSize + qrPadding * 2 + topHeight;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Outer card background
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(20 * scale));
      ctx.fill();

      // Card border
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeStyle = '#e2e8f0';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(20 * scale));
      ctx.stroke();

      // Top pill bar
      const pillMarginX = qrPadding;
      const pillY = qrPadding;
      const pillW = totalWidth - pillMarginX * 2;
      const pillH = Math.round(44 * scale);

      ctx.fillStyle = frame.frameColor || '#1e1b4b';
      roundRect(ctx, pillMarginX, pillY, pillW, pillH, Math.round(22 * scale));
      ctx.fill();

      // Title in pill
      ctx.fillStyle = frame.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(16 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(frame.title || 'SCAN TO VISIT', totalWidth / 2, pillY + pillH / 2);

      // Draw QR Canvas below pill
      ctx.drawImage(
        qrCanvas,
        qrPadding,
        pillY + pillH + Math.round(14 * scale),
        targetQRSize,
        targetQRSize
      );

      break;
    }

    case 'polaroid': {
      const bottomCaptionHeight = Math.round(90 * scale);
      const totalWidth = targetQRSize + qrPadding * 2;
      const totalHeight = targetQRSize + qrPadding * 1.5 + bottomCaptionHeight;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Polaroid paper background
      ctx.fillStyle = '#fdfdfd';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(10 * scale));
      ctx.fill();

      // Paper shadow border
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeStyle = '#e2e8f0';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(10 * scale));
      ctx.stroke();

      // Draw QR Canvas
      ctx.drawImage(qrCanvas, qrPadding, qrPadding, targetQRSize, targetQRSize);

      // Title
      ctx.fillStyle = frame.frameColor || '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(22 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(
        frame.title || 'SCAN ME',
        totalWidth / 2,
        targetQRSize + qrPadding + Math.round(36 * scale)
      );

      // Subtitle
      if (frame.subtitle) {
        ctx.fillStyle = '#64748b';
        ctx.font = `500 ${Math.round(13 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillText(
          frame.subtitle,
          totalWidth / 2,
          targetQRSize + qrPadding + Math.round(62 * scale)
        );
      }

      break;
    }

    case 'badge-tag': {
      const headerH = Math.round(50 * scale);
      const footerH = Math.round(60 * scale);
      const totalWidth = targetQRSize + qrPadding * 2;
      const totalHeight = targetQRSize + headerH + footerH + qrPadding;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Tag background
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(24 * scale));
      ctx.fill();

      // Border
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeStyle = '#cbd5e1';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(24 * scale));
      ctx.stroke();

      // Hang hole at top
      ctx.beginPath();
      ctx.arc(totalWidth / 2, Math.round(22 * scale), Math.round(8 * scale), 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Draw QR
      ctx.drawImage(qrCanvas, qrPadding, headerH, targetQRSize, targetQRSize);

      // Dashed divider line
      ctx.beginPath();
      ctx.setLineDash([Math.round(6 * scale), Math.round(6 * scale)]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = Math.round(1.5 * scale);
      ctx.moveTo(qrPadding, headerH + targetQRSize + Math.round(10 * scale));
      ctx.lineTo(totalWidth - qrPadding, headerH + targetQRSize + Math.round(10 * scale));
      ctx.stroke();
      ctx.setLineDash([]);

      // Footer badge label
      ctx.fillStyle = frame.frameColor || '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(18 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(
        frame.title || 'SPECIAL OFFER',
        totalWidth / 2,
        headerH + targetQRSize + Math.round(38 * scale)
      );

      break;
    }

    case 'minimal-border': {
      const captionH = Math.round(44 * scale);
      const totalWidth = targetQRSize + qrPadding * 2;
      const totalHeight = targetQRSize + qrPadding * 2 + captionH;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Outer thin line
      ctx.strokeStyle = frame.frameColor || '#1e293b';
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeRect(
        Math.round(10 * scale),
        Math.round(10 * scale),
        totalWidth - Math.round(20 * scale),
        totalHeight - Math.round(20 * scale)
      );

      // Inner bracket accents at 4 corners
      const cornerLen = Math.round(18 * scale);
      ctx.lineWidth = Math.round(4 * scale);

      // Top-left
      ctx.beginPath();
      ctx.moveTo(Math.round(6 * scale), Math.round(6 * scale) + cornerLen);
      ctx.lineTo(Math.round(6 * scale), Math.round(6 * scale));
      ctx.lineTo(Math.round(6 * scale) + cornerLen, Math.round(6 * scale));
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(totalWidth - Math.round(6 * scale) - cornerLen, Math.round(6 * scale));
      ctx.lineTo(totalWidth - Math.round(6 * scale), Math.round(6 * scale));
      ctx.lineTo(totalWidth - Math.round(6 * scale), Math.round(6 * scale) + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(Math.round(6 * scale), totalHeight - Math.round(6 * scale) - cornerLen);
      ctx.lineTo(Math.round(6 * scale), totalHeight - Math.round(6 * scale));
      ctx.lineTo(Math.round(6 * scale) + cornerLen, totalHeight - Math.round(6 * scale));
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(totalWidth - Math.round(6 * scale) - cornerLen, totalHeight - Math.round(6 * scale));
      ctx.lineTo(totalWidth - Math.round(6 * scale), totalHeight - Math.round(6 * scale));
      ctx.lineTo(totalWidth - Math.round(6 * scale), totalHeight - Math.round(6 * scale) - cornerLen);
      ctx.stroke();

      // QR Image
      ctx.drawImage(qrCanvas, qrPadding, qrPadding, targetQRSize, targetQRSize);

      // Bottom title pill
      ctx.fillStyle = frame.frameColor || '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(15 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(
        frame.title || 'CONNECT WITH US',
        totalWidth / 2,
        targetQRSize + qrPadding + Math.round(22 * scale)
      );

      break;
    }

    case 'phone-frame': {
      const notchH = Math.round(32 * scale);
      const footerH = Math.round(50 * scale);
      const totalWidth = targetQRSize + qrPadding * 2;
      const totalHeight = targetQRSize + qrPadding * 2 + notchH + footerH;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Phone outer chassis
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(36 * scale));
      ctx.fill();

      // Screen area
      const screenPadding = Math.round(12 * scale);
      const screenW = totalWidth - screenPadding * 2;
      const screenH = totalHeight - screenPadding * 2;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, screenPadding, screenPadding, screenW, screenH, Math.round(26 * scale));
      ctx.fill();

      // Dynamic Island / Notch
      const notchW = Math.round(100 * scale);
      const notchActualH = Math.round(22 * scale);
      ctx.fillStyle = '#0f172a';
      roundRect(
        ctx,
        (totalWidth - notchW) / 2,
        screenPadding + Math.round(10 * scale),
        notchW,
        notchActualH,
        Math.round(11 * scale)
      );
      ctx.fill();

      // Draw QR on screen
      const qrY = screenPadding + notchH + Math.round(16 * scale);
      ctx.drawImage(qrCanvas, qrPadding, qrY, targetQRSize, targetQRSize);

      // Label below QR
      ctx.fillStyle = frame.frameColor || '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(17 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(frame.title || 'SCAN ON PHONE', totalWidth / 2, qrY + targetQRSize + Math.round(24 * scale));

      break;
    }

    case 'stamp': {
      const bannerH = Math.round(64 * scale);
      const totalWidth = targetQRSize + qrPadding * 2.2;
      const totalHeight = targetQRSize + qrPadding * 2.2 + bannerH;

      outCanvas.width = totalWidth;
      outCanvas.height = totalHeight;

      // Base background
      ctx.fillStyle = '#fffbeb';
      roundRect(ctx, 0, 0, totalWidth, totalHeight, Math.round(8 * scale));
      ctx.fill();

      // Inner dashed border
      ctx.strokeStyle = frame.frameColor || '#b45309';
      ctx.lineWidth = Math.round(2.5 * scale);
      ctx.setLineDash([Math.round(8 * scale), Math.round(5 * scale)]);
      ctx.strokeRect(
        Math.round(12 * scale),
        Math.round(12 * scale),
        totalWidth - Math.round(24 * scale),
        totalHeight - Math.round(24 * scale)
      );
      ctx.setLineDash([]);

      // Draw QR Canvas
      ctx.drawImage(
        qrCanvas,
        Math.round(qrPadding * 1.1),
        Math.round(qrPadding * 1.1),
        targetQRSize,
        targetQRSize
      );

      // Stamp bottom banner
      ctx.fillStyle = frame.frameColor || '#b45309';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(18 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(
        frame.title || 'VERIFIED CODE',
        totalWidth / 2,
        Math.round(qrPadding * 1.1) + targetQRSize + Math.round(30 * scale)
      );

      break;
    }

    default:
      outCanvas.width = targetQRSize;
      outCanvas.height = targetQRSize;
      ctx.drawImage(qrCanvas, 0, 0, targetQRSize, targetQRSize);
      break;
  }

  return outCanvas;
}

/**
 * Utility to draw rounded rectangles on canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Automates real-time verification of the generated QR canvas using jsQR
 */
export function verifyQRCodeScannability(canvas: HTMLCanvasElement): ScanVerificationResult {
  const startTime = performance.now();
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { verified: false, errorReason: 'Could not access canvas rendering context' };
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    const latency = Math.max(1, Math.round(performance.now() - startTime));

    if (code && code.data) {
      return {
        verified: true,
        decodedData: code.data,
        latencyMs: latency,
      };
    }
    return {
      verified: false,
      latencyMs: latency,
      errorReason: 'Camera engine could not decode matrix. Try increasing contrast or reducing logo size.',
    };
  } catch (err: any) {
    return {
      verified: false,
      latencyMs: Math.round(performance.now() - startTime),
      errorReason: err?.message || 'Scan test failed',
    };
  }
}


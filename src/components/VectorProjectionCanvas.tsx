/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef } from 'react';

interface VectorProjectionCanvasProps {
  words: string[];
  coordinates: Record<string, { x: number; y: number }>;
  similarities: Record<string, number>;
  outlier: string | null;
  colorHexes: Record<string, string>;
}

export const VectorProjectionCanvas: React.FC<VectorProjectionCanvasProps> = ({
  words,
  coordinates,
  similarities,
  outlier,
  colorHexes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, centerY);
    ctx.lineTo(width - 30, centerY);
    ctx.moveTo(centerX, 30);
    ctx.lineTo(centerX, height - 30);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('1. Vektör Boyutu (Renk Ekseni →)', width - 180, centerY - 8);
    ctx.fillText('↑ 2. Vektör Boyutu', centerX + 8, 25);

    // Points to render: all words + 'renk' reference point
    const allPoints = [...words];
    if (coordinates['renk'] && !allPoints.includes('renk')) {
      allPoints.push('renk');
    }

    // Find min and max for scaling
    let minX = -0.5,
      maxX = 1.2,
      minY = -0.5,
      maxY = 1.2;

    allPoints.forEach((w) => {
      const p = coordinates[w];
      if (p) {
        if (p.x < minX) minX = p.x - 0.2;
        if (p.x > maxX) maxX = p.x + 0.2;
        if (p.y < minY) minY = p.y - 0.2;
        if (p.y > maxY) maxY = p.y + 0.2;
      }
    });

    const pad = 55;
    const mapX = (x: number) => pad + ((x - minX) / (maxX - minX)) * (width - pad * 2);
    const mapY = (y: number) => height - (pad + ((y - minY) / (maxY - minY)) * (height - pad * 2));

    // Draw connection lines to 'renk' anchor point if present
    const renkCoord = coordinates['renk'];
    if (renkCoord) {
      const rx = mapX(renkCoord.x);
      const ry = mapY(renkCoord.y);

      words.forEach((w) => {
        const c = coordinates[w];
        if (!c) return;
        const px = mapX(c.x);
        const py = mapY(c.y);

        const isOutlier = w === outlier;
        ctx.beginPath();
        ctx.strokeStyle = isOutlier ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)';
        ctx.setLineDash(isOutlier ? [4, 4] : [2, 2]);
        ctx.lineWidth = isOutlier ? 1.5 : 1;
        ctx.moveTo(rx, ry);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw points
    allPoints.forEach((w) => {
      const c = coordinates[w];
      if (!c) return;
      const px = mapX(c.x);
      const py = mapY(c.y);

      const isAnchor = w === 'renk';
      const isOutlier = w === outlier;
      const hexColor = colorHexes[w] || (isAnchor ? '#f59e0b' : isOutlier ? '#ef4444' : '#38bdf8');

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(px, py, isAnchor ? 14 : isOutlier ? 16 : 12, 0, Math.PI * 2);
      ctx.fillStyle = isOutlier ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)';
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(px, py, isAnchor ? 7 : isOutlier ? 8 : 7, 0, Math.PI * 2);
      ctx.fillStyle = hexColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = isOutlier ? '#fca5a5' : isAnchor ? '#fcd34d' : '#f8fafc';
      const labelText = isAnchor ? '★ RENK (Çapa Noktası)' : w.toUpperCase();
      ctx.fillText(labelText, px + 12, py + 4);

      // Score sub-label
      if (!isAnchor && similarities[w] !== undefined && similarities[w] !== null) {
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = isOutlier ? '#ef4444' : '#94a3b8';
        ctx.fillText(`benzerlik: ${similarities[w]}`, px + 12, py + 18);
      }
    });
  }, [words, coordinates, similarities, outlier, colorHexes]);

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-300 backdrop-blur-sm">
        <span>📍</span> Word2Vec (100D → 2D) Vektör Uzayı İzdüşümü
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-80 block"
        style={{ width: '100%', height: '320px' }}
      />
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, Upload, PenTool } from 'lucide-react';

interface SignatureCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  signatoryName?: string;
  signatoryRole?: string;
}

export const SignatureCanvasModal: React.FC<SignatureCanvasModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Gores Tanda Tangan Digital',
  signatoryName = '',
  signatoryRole = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#0f172a');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        initCanvas();
      }, 50);
    }
  }, [isOpen]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset size based on CSS display size for crisp retina lines
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.clearRect(0, 0, rect.width, rect.height);

    setHistory([]);
    setHasDrawn(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history state before new stroke
    setHistory((prev) => [...prev, canvas.toDataURL()]);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHistory([]);
    setHasDrawn(false);
  };

  const undoLastStroke = () => {
    if (history.length === 0) {
      clearCanvas();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevSnapshot = history[history.length - 1];
    const newHist = history.slice(0, -1);
    setHistory(newHist);

    const img = new Image();
    img.src = prevSnapshot;
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
      if (newHist.length === 0) {
        setHasDrawn(false);
      }
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = result;
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0, 0, w, h);

        // Aspect fit image
        const scale = Math.min((w * 0.8) / img.width, (h * 0.8) / img.height);
        const nw = img.width * scale;
        const nh = img.height * scale;
        const ox = (w - nw) / 2;
        const oy = (h - nh) / 2;

        ctx.drawImage(img, ox, oy, nw, nh);
        setHasDrawn(true);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Trim empty / transparent margins for precise bounding box
    const trimmedDataUrl = trimCanvasWhitespace(canvas);
    onSave(trimmedDataUrl);
    onClose();
  };

  /**
   * Pemotongan otomatis (auto-trim) ruang kosong di sekitar goresan TTD
   */
  const trimCanvasWhitespace = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return canvas.toDataURL('image/png');

    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Deteksi piksel coretan: bukan transparan dan bukan putih murni
          const isWhite = r > 240 && g > 240 && b > 240;
          const isDrawn = a > 20 && !isWhite;

          if (isDrawn) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Jika kanvas kosong atau tidak terdeteksi coretan
      if (maxX < minX || maxY < minY) {
        return canvas.toDataURL('image/png');
      }

      // Padding proporsional sekitar 6-8px agar garis tepi tidak terpotong kaku
      const padding = 8;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
      const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;

      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) return canvas.toDataURL('image/png');

      croppedCtx.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Konversi pixel putih/hampir putih menjadi transparan agar hasil presisi seperti PNG transparan
      try {
        const croppedImgData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight);
        const cData = croppedImgData.data;
        let modified = false;
        for (let i = 0; i < cData.length; i += 4) {
          const r = cData[i];
          const g = cData[i + 1];
          const b = cData[i + 2];
          const a = cData[i + 3];
          if (a > 0 && r > 235 && g > 235 && b > 235) {
            cData[i + 3] = 0;
            modified = true;
          }
        }
        if (modified) {
          croppedCtx.putImageData(croppedImgData, 0, 0);
        }
      } catch (err) {
        // Fallback jika getImageData dibatasi cross-origin
      }

      return croppedCanvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Trim canvas error, fallback to full canvas:', e);
      return canvas.toDataURL('image/png');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-emerald-700" />
              {title}
            </h3>
            {signatoryName && (
              <p className="text-xs text-slate-500 mt-0.5">
                {signatoryRole ? `${signatoryRole} — ` : ''}
                {signatoryName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Warna Tinta:</span>
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition-transform ${
                  penColor === '#0f172a' ? 'scale-110 border-emerald-600 ring-2 ring-emerald-200' : 'border-transparent'
                }`}
                title="Tinta Hitam"
              />
              <button
                type="button"
                onClick={() => setPenColor('#1e40af')}
                className={`w-6 h-6 rounded-full bg-blue-800 border-2 transition-transform ${
                  penColor === '#1e40af' ? 'scale-110 border-emerald-600 ring-2 ring-emerald-200' : 'border-transparent'
                }`}
                title="Tinta Biru Resmi"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Ketebalan:</span>
              {[2, 3, 5].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPenWidth(w)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    penWidth === w ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w === 2 ? 'Halus' : w === 3 ? 'Sedang' : 'Tebal'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={undoLastStroke}
                disabled={history.length === 0}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 flex items-center gap-1 border border-slate-200 rounded hover:bg-slate-50"
                title="Batalkan goresan terakhir"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="px-2.5 py-1 text-red-600 hover:text-red-700 border border-red-200 rounded hover:bg-red-50"
              >
                Bersihkan
              </button>
            </div>
          </div>

          {/* Interactive Canvas Board */}
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-52 cursor-crosshair touch-none bg-radial from-slate-50/50 to-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 select-none">
                <PenTool className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
                <span className="text-xs font-medium">Sentuh atau gunakan kursor mouse untuk membuat tanda tangan</span>
                <span className="text-[11px] text-slate-400">Area kanvas tanda tangan Remasbara Baiturrahman</span>
              </div>
            )}
          </div>

          {/* Alternative Upload */}
          <div className="flex items-center justify-between pt-1">
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Gambar Tanda Tangan (PNG Transparan/Foto)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">Format PNG/JPEG</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasDrawn}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Gunakan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};

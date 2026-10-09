/**
 * Helper to process, crop bounding box, trim whitespace/transparent margins,
 * and convert near-white background to transparent for digital signatures.
 */

export function trimCanvasWhitespace(canvas: HTMLCanvasElement): string {
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

        // Deteksi piksel coretan: bukan transparan dan bukan putih terang
        const isWhite = r > 235 && g > 235 && b > 235;
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

    // Konversi pixel putih/hampir putih menjadi transparan agar hasil bersih seperti PNG transparan
    try {
      const croppedImgData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight);
      const cData = croppedImgData.data;
      let modified = false;
      for (let i = 0; i < cData.length; i += 4) {
        const r = cData[i];
        const g = cData[i + 1];
        const b = cData[i + 2];
        const a = cData[i + 3];
        if (a > 0 && r > 230 && g > 230 && b > 230) {
          cData[i + 3] = 0;
          modified = true;
        }
      }
      if (modified) {
        croppedCtx.putImageData(croppedImgData, 0, 0);
      }
    } catch {
      // Ignore cross-origin issues
    }

    return croppedCanvas.toDataURL('image/png');
  } catch (e) {
    console.warn('Trim canvas error, fallback to full canvas:', e);
    return canvas.toDataURL('image/png');
  }
}

/**
 * Reads an uploaded image file, renders to canvas, trims empty space & white background,
 * and returns a crisp transparent PNG data URL.
 */
export function processSignatureImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar tanda tangan'));
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('Berkas kosong'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak didukung'));
      img.onload = () => {
        try {
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = img.naturalWidth || img.width;
          offscreenCanvas.height = img.naturalHeight || img.height;

          const ctx = offscreenCanvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const trimmed = trimCanvasWhitespace(offscreenCanvas);
          resolve(trimmed);
        } catch (err) {
          console.warn('Gagal memproses trim gambar, menggunakan gambar asli:', err);
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

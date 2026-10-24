/**
 * Utility helper to process, resize, and optimize uploaded stamp image files.
 * Transforms images (PNG, JPG, WebP) into lightweight transparent PNG Data URLs
 * suitable for instant cloud sync to Supabase and crisp A4 document rendering.
 */

export interface ProcessStampOptions {
  maxDimension?: number;
  removeWhiteBackground?: boolean;
}

export function processStampImageFile(
  file: File,
  options: ProcessStampOptions = {}
): Promise<string> {
  const { maxDimension = 512, removeWhiteBackground = true } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas harus berupa file gambar (PNG, JPG, JPEG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar stempel'));
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('Berkas stempel kosong'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak didukung'));
      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          if (originalWidth === 0 || originalHeight === 0) {
            resolve(result);
            return;
          }

          // Calculate scaled dimensions while preserving aspect ratio
          let targetWidth = originalWidth;
          let targetHeight = originalHeight;

          if (originalWidth > maxDimension || originalHeight > maxDimension) {
            if (originalWidth >= originalHeight) {
              targetWidth = maxDimension;
              targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
            } else {
              targetHeight = maxDimension;
              targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Draw the resized image
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // If removeWhiteBackground is enabled and file is JPG or has white background
          if (removeWhiteBackground) {
            try {
              const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
              const data = imgData.data;
              let modified = false;

              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // Turn near-white/light gray background into transparent
                if (a > 10 && r > 230 && g > 230 && b > 230) {
                  data[i + 3] = 0;
                  modified = true;
                }
              }

              if (modified) {
                ctx.putImageData(imgData, 0, 0);
              }
            } catch {
              // Ignore any pixel manipulation error and continue
            }
          }

          const optimizedDataUrl = canvas.toDataURL('image/png');
          resolve(optimizedDataUrl);
        } catch (err) {
          console.warn('Gagal optimasi gambar stempel, menggunakan data asli:', err);
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Utility helper to process, resize, and optimize uploaded organization logo image files.
 * Transforms images (PNG, JPG, WebP) into lightweight crisp PNG Data URLs (max 512px).
 */
export function processLogoImageFile(file: File, maxDimension = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas harus berupa file gambar (PNG, JPG, JPEG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar logo'));
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('Berkas logo kosong'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar logo tidak didukung'));
      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          if (originalWidth === 0 || originalHeight === 0) {
            resolve(result);
            return;
          }

          let targetWidth = originalWidth;
          let targetHeight = originalHeight;

          if (originalWidth > maxDimension || originalHeight > maxDimension) {
            if (originalWidth >= originalHeight) {
              targetWidth = maxDimension;
              targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
            } else {
              targetHeight = maxDimension;
              targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const optimized = canvas.toDataURL('image/png');
          resolve(optimized);
        } catch (err) {
          console.warn('Gagal optimasi logo, menggunakan data asli:', err);
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

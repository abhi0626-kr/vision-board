/**
 * Compresses an image file client-side using HTML Canvas.
 * Adaptively scales down dimensions and quality to ensure the data URL
 * stays comfortably under `targetMaxChars` (~200KB) so the encrypted
 * vault document never exceeds Firestore's 1MB single-document limit.
 */
export async function compressImageFile(
  file: File,
  targetMaxChars = 220_000
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        const renderCanvas = (maxDimension: number, quality: number): string => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) return reader.result as string;

          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', quality);
        };

        // Pass 1: standard web resolution (850px, quality 0.7)
        let result = renderCanvas(850, 0.7);

        // Pass 2: scale down if still exceeding target size
        if (result.length > targetMaxChars) {
          result = renderCanvas(680, 0.6);
        }

        // Pass 3: further compression if needed
        if (result.length > targetMaxChars) {
          result = renderCanvas(520, 0.5);
        }

        // Pass 4: aggressive fallback for extremely high-detail images
        if (result.length > targetMaxChars) {
          result = renderCanvas(400, 0.4);
        }

        const approxSize = Math.round((result.length * 3) / 4);
        resolve({ dataUrl: result, size: approxSize });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Runs a promise with a timeout in milliseconds.
 * Rejects if the timeout is reached before the promise resolves.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg = 'Operation timed out'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

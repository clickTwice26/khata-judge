import { AnswerImage } from '../types';

/**
 * Resizes an image file if it exceeds maxDimension (e.g. 2048px)
 * to ensure high OCR accuracy while keeping payload lightweight and fast.
 */
export async function processAnswerImageFile(file: File): Promise<AnswerImage> {
  return new Promise((resolve, reject) => {
    // Only accept image types
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (JPG, PNG, WEBP, etc.)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.onload = () => {
        const maxDimension = 2048;
        let width = img.width;
        let height = img.height;

        // Resize down proportionally if larger than 2048px
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
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to original raw data
          const rawBase64 = (reader.result as string).split(',')[1] || '';
          resolve({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            dataUrl: reader.result as string,
            base64: rawBase64,
            sizeKb: Math.round(file.size / 1024),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Keep high quality JPEG (0.92) for crisp handwriting legibility
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        const base64 = dataUrl.split(',')[1] || '';
        const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          mimeType,
          dataUrl,
          base64,
          sizeKb,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Shared photo-crop helpers used by every post composer.
// The crop frame has a fixed aspect ratio; the image beneath it is panned/zoomed.
export const CROP_ASPECT = 4 / 3;
export const MAX_OUTPUT_WIDTH = 1600;

/** Maps the visible crop frame back to pixels in the original image. */
export function cropBoxToNatural({ frameW, frameH, naturalW, naturalH, offset, zoom }) {
  const baseScale = Math.max(frameW / naturalW, frameH / naturalH);
  const scale = baseScale * zoom;
  const sx = Math.min(Math.max(0, -offset.x / scale), naturalW);
  const sy = Math.min(Math.max(0, -offset.y / scale), naturalH);
  const sw = Math.min(naturalW - sx, frameW / scale);
  const sh = Math.min(naturalH - sy, frameH / scale);
  return { sx, sy, sw, sh };
}

/** Draws the selected region to a canvas and returns it as an uploaded-ready File. */
export async function cropImageToFile(image, box, fileName = 'photo.jpg') {
  const scale = Math.min(1, MAX_OUTPUT_WIDTH / box.sw);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(box.sw * scale));
  canvas.height = Math.max(1, Math.round(box.sh * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, box.sx, box.sy, box.sw, box.sh, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  const base = (fileName || 'photo').replace(/\.[^.]+$/, '');
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}
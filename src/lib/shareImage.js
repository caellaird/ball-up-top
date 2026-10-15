// Robust mobile sharing helpers. Web Share API with files is the reliable way
// to get a generated image into Instagram/TikTok (the app appears as a target
// in the native sheet and opens with the image attached) and to save an image
// to the device. All calls rethrow AbortError when the user cancels the native
// sheet so callers can keep their UI open.
import { toast } from 'sonner';

export function canShareFiles(file) {
  try {
    return !!(
      file &&
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

export function hasNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function isIOS() {
  return (
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream
  );
}

// Copy text to the clipboard, with a legacy execCommand fallback for webviews
// that don't expose navigator.clipboard.
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Save an image File to the device. On iOS the only reliable path is the
// native share sheet (Save Image → Photos); elsewhere a direct anchor
// download is used.
export async function saveImageToDevice(file, filename = 'ball-up-top.png') {
  if (isIOS() && canShareFiles(file)) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Share an image to a specific app (Instagram / TikTok). When the device
// supports file sharing, opens the native share sheet with the image
// attached so the user can pick the app (which then opens with the image).
// Otherwise copies the link and launches the app via deep link (web fallback
// if the app isn't installed). Returns true when the native sheet was used.
export async function shareImageToApp(file, { url, scheme, fallback, label }) {
  if (canShareFiles(file)) {
    await navigator.share({ files: [file], text: url });
    return true;
  }
  await copyToClipboard(url);
  toast.success(`Link copied — paste in ${label}`);
  const start = Date.now();
  try {
    window.location.href = scheme;
  } catch {}
  setTimeout(() => {
    if (!document.hidden && Date.now() - start < 2500) {
      window.open(fallback, '_blank', 'noopener');
    }
  }, 1200);
  return false;
}
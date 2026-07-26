import React, { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Camera, Loader2, RotateCcw, Check, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cropBannerAndCompress } from '@/lib/imageUtils';

export default function BannerUpload({ profile, onUploaded }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const [showSheet, setShowSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastFile, setLastFile] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError(true);
      setErrorMsg('Please select an image file (JPEG, PNG, etc.)');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(true);
      setErrorMsg('Image must be under 10MB');
      return false;
    }
    return true;
  };

  const upload = async (file) => {
    setUploading(true);
    setError(false);
    setErrorMsg('');
    setSuccess(false);
    try {
      const processed = await cropBannerAndCompress(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: processed });
      const updated = await base44.entities.Profile.update(profile.id, { banner_url: file_url });
      onUploaded(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError(true);
      setErrorMsg('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setUploading(true);
    const updated = await base44.entities.Profile.update(profile.id, { banner_url: '' });
    onUploaded(updated);
    setUploading(false);
    setShowSheet(false);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!validateFile(file)) return;
    setShowSheet(false);
    setLastFile(file);
    upload(file);
  };

  return (
    <div className="relative">
      <div
        className="h-32 bg-gradient-to-r from-primary to-secondary relative"
        style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <button
          onClick={() => setShowSheet(true)}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg"
          type="button"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Camera className="w-4 h-4 text-white" />
          )}
        </button>
        {error && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-background/90 rounded-full px-2 py-1">
            <span className="text-[10px] text-destructive font-semibold">{errorMsg}</span>
            {lastFile && (
              <button
                type="button"
                onClick={() => upload(lastFile)}
                className="text-[10px] text-destructive font-bold flex items-center gap-0.5"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle className="font-heading">Banner Photo</SheetTitle></SheetHeader>
          <div className="space-y-2 mt-4 pb-4">
            <button onClick={() => cameraRef.current?.click()} className="w-full text-left px-4 py-3 rounded-2xl bg-muted font-semibold text-sm" type="button">
              Take Photo
            </button>
            <button onClick={() => galleryRef.current?.click()} className="w-full text-left px-4 py-3 rounded-2xl bg-muted font-semibold text-sm" type="button">
              Choose from Library
            </button>
            {profile?.banner_url && (
              <button onClick={remove} className="w-full text-left px-4 py-3 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center gap-2" type="button">
                <Trash2 className="w-4 h-4" /> Remove Banner
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
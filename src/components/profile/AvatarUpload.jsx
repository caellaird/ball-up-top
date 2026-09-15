import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Camera, Loader2, RotateCcw, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cropSquareAndCompress } from '@/lib/imageUtils';
import { invalidateProfile } from '@/lib/ensureProfile';

export default function AvatarUpload({ profile, fallback, onUploaded, size = 'w-20 h-20' }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const [showSheet, setShowSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastFile, setLastFile] = useState(null);

  const upload = async (file) => {
    setUploading(true);
    setError(false);
    setSuccess(false);
    try {
      const processed = await cropSquareAndCompress(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: processed });
      const updated = await base44.entities.Profile.update(profile.id, { avatar_url: file_url });
      invalidateProfile(profile.created_by_id);
      onUploaded(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setShowSheet(false);
    setLastFile(file);
    upload(file);
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setShowSheet(true)} className="relative block" type="button">
        <Avatar className={`${size} border-4 border-background`}>
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : success ? (
            <Check className="w-3.5 h-3.5 text-white" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-white" />
          )}
        </span>
      </button>

      {error && (
        <button
          type="button"
          onClick={() => lastFile && upload(lastFile)}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-destructive font-semibold flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Upload failed, retry
        </button>
      )}

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle className="font-heading">Profile Photo</SheetTitle></SheetHeader>
          <div className="space-y-2 mt-4 pb-4">
            <button onClick={() => cameraRef.current?.click()} className="w-full text-left px-4 py-3 rounded-2xl bg-muted font-semibold text-sm" type="button">
              Take Photo
            </button>
            <button onClick={() => galleryRef.current?.click()} className="w-full text-left px-4 py-3 rounded-2xl bg-muted font-semibold text-sm" type="button">
              Choose from Library
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
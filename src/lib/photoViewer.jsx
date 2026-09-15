import { createContext, useContext } from 'react';

const PhotoViewerContext = createContext(null);

export { PhotoViewerContext };

export function usePhotoViewer() {
  const ctx = useContext(PhotoViewerContext);
  if (!ctx) {
    throw new Error('usePhotoViewer must be used within PhotoViewerProvider');
  }
  return ctx;
}
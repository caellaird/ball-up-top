import React, { useState, useCallback } from 'react';
import { PhotoViewerContext } from '@/lib/photoViewer';
import GlobalPhotoViewer from '@/components/shared/GlobalPhotoViewer';

export default function PhotoViewerProvider({ children }) {
  const [viewer, setViewer] = useState(null);

  const open = useCallback((urls, initialIndex = 0) => {
    const list = Array.isArray(urls) ? urls.filter(Boolean) : urls ? [urls] : [];
    if (!list.length) return;
    setViewer({ urls: list, initialIndex: Math.min(initialIndex, list.length - 1) });
  }, []);

  const close = useCallback(() => setViewer(null), []);

  return (
    <PhotoViewerContext.Provider value={{ open, close }}>
      {children}
      {viewer && (
        <GlobalPhotoViewer
          urls={viewer.urls}
          initialIndex={viewer.initialIndex}
          onClose={close}
        />
      )}
    </PhotoViewerContext.Provider>
  );
}
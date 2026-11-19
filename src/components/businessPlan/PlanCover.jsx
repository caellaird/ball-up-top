import React from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LOGO_URL } from '@/lib/constants';

export default function PlanCover({ meta, generatedAt, onDownload, downloading }) {
  return (
    <div className="relative overflow-hidden rounded-3xl brand-gradient text-white arena-shadow">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.6), transparent 45%), radial-gradient(circle at 88% 85%, rgba(0,0,0,0.4), transparent 50%)',
        }}
      />
      <div className="relative px-6 py-8 sm:px-10 sm:py-11">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Ball Up Top" className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white/40" />
          <div>
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
              Ball Up Top
            </p>
            <p className="text-[11px] text-white/70">{meta.site}</p>
          </div>
        </div>

        <h1 className="mt-7 font-heading text-3xl sm:text-4xl font-extrabold leading-[1.08] tracking-tight max-w-2xl">
          Business Plan and Product Reference
        </h1>
        <p className="mt-3 max-w-xl text-sm sm:text-base leading-7 text-white/85">{meta.tagline}</p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-white/75">
          <span>{meta.version}</span>
          <span className="h-1 w-1 rounded-full bg-white/50" />
          <span>Generated {generatedAt}</span>
          <span className="h-1 w-1 rounded-full bg-white/50" />
          <span>{meta.preparedFor}</span>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            onClick={onDownload}
            disabled={downloading}
            className="h-12 rounded-full bg-white bg-none px-6 font-bold text-secondary shadow-lg hover:bg-white/90"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? 'Building PDF' : 'Download PDF'}
          </Button>
          <span className="flex items-center gap-2 text-[12px] text-white/75">
            <FileText className="h-3.5 w-3.5" />
            Full document with contents and page numbers
          </span>
        </div>
      </div>
    </div>
  );
}
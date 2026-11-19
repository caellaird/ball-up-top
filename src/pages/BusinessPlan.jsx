import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlanCover from '@/components/businessPlan/PlanCover';
import PlanToc from '@/components/businessPlan/PlanToc';
import PlanSectionView from '@/components/businessPlan/PlanSectionView';
import { PLAN_META, getPlanSections } from '@/lib/businessPlan/content';
import { downloadPlanPdf } from '@/lib/businessPlan/pdf';
import { loadPlanSnapshot } from '@/lib/businessPlan/snapshot';

const generatedLabel = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function BusinessPlan() {
  const [snapshot, setSnapshot] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [generatedAt] = useState(generatedLabel);

  useEffect(() => {
    let alive = true;
    loadPlanSnapshot().then((data) => {
      if (alive) setSnapshot(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const sections = useMemo(() => {
    let n = 0;
    return getPlanSections(snapshot).map((section) =>
      section.part ? section : { ...section, num: String((n += 1)).padStart(2, '0') },
    );
  }, [snapshot]);

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadPlanPdf(sections, PLAN_META);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link
            to="/"
            className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="sm"
            className="rounded-full px-4 font-bold"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8">
        <PlanCover
          meta={PLAN_META}
          generatedAt={generatedAt}
          onDownload={handleDownload}
          downloading={downloading}
        />

        <div className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 text-[12.5px] leading-6 text-muted-foreground">
          This document is generated from the app itself, so it always matches what is built. Press
          Download PDF for the full version with a table of contents and page numbers. Targets,
          assumptions and unbuilt ideas are labelled; record counts in the appendix are live and
          refresh when this page loads.
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <PlanToc sections={sections} />
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            {sections.map((section) => (
              <PlanSectionView key={section.id} section={section} />
            ))}
            <p className="border-t border-border/70 pt-5 text-[11.5px] leading-5 text-muted-foreground">
              {PLAN_META.confidential}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGoBack } from "@/hooks/useGoBack";

export default function LegalLayout({ title, updated, children }) {
  const goBack = useGoBack("/login");
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 safe-top bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-[44px] px-2 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="font-heading font-semibold text-sm">Ball Up Top</span>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <h1 className="font-heading text-3xl font-bold mb-2">{title}</h1>
        {updated && <p className="text-xs text-muted-foreground mb-6">Last updated: {updated}</p>}
        <div className="prose prose-sm max-w-none text-foreground space-y-4 [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:text-sm [&_ul]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}
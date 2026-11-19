import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function PlanFlow({ steps, title }) {
  return (
    <div className="mb-6">
      {title && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
          {title}
        </p>
      )}
      <ol className="relative space-y-0">
        {steps.map((step, i) => (
          <li key={i}>
            <div className="flex gap-3 rounded-xl border border-border/70 bg-muted/30 py-3 px-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full brand-gradient text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[13.5px] leading-6 text-foreground/80">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-start pl-[26px] py-1">
                <ArrowDown className="h-3.5 w-3.5 text-primary/50" />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
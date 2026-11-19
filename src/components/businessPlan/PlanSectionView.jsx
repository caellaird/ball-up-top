import React from 'react';
import PlanBlock from './PlanBlock';

export default function PlanSectionView({ section }) {
  if (section.part) {
    return (
      <section className="scroll-mt-24 pt-6">
        <div className="rounded-2xl border border-border/70 bg-muted/40 px-5 py-5">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Part
          </p>
          <h2 className="mt-1 font-heading text-xl sm:text-2xl font-extrabold tracking-tight">
            {section.title}
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">{section.intro}</p>
        </div>
      </section>
    );
  }

  return (
    <section id={section.id} className="scroll-mt-24 border-t border-border/70 pt-7">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] font-bold text-primary/70">{section.num}</span>
        <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
          {section.title}
        </h2>
      </div>
      <div className="mt-3 h-[3px] w-12 rounded-full bg-accent" />
      <div className="mt-5">
        {section.blocks.map((block, i) => (
          <PlanBlock key={i} block={block} />
        ))}
      </div>
    </section>
  );
}
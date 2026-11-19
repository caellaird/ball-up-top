import React from 'react';

export default function PlanToc({ sections }) {
  return (
    <nav className="space-y-1.5">
      <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Contents
      </p>
      {sections.map((section) => {
        if (section.part) {
          return (
            <p
              key={section.id}
              className="pt-3 pb-1 font-heading text-[11px] font-bold uppercase tracking-wide text-primary"
            >
              {section.title}
            </p>
          );
        }
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] leading-5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          >
            <span className="font-mono text-[10.5px] text-primary/70 pt-0.5">{section.num}</span>
            <span>{section.title}</span>
          </a>
        );
      })}
    </nav>
  );
}
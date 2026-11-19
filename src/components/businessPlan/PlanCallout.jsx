import React from 'react';

export default function PlanCallout({ label, text }) {
  return (
    <div className="mb-6 rounded-xl border-l-[3px] border-primary bg-primary/5 px-4 py-3.5">
      <p className="font-heading text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
        {label}
      </p>
      <p className="text-[13.5px] leading-6 text-foreground/80">{text}</p>
    </div>
  );
}
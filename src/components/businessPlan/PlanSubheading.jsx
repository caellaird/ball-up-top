import React from 'react';

export default function PlanSubheading({ text }) {
  return (
    <h4 className="font-heading text-base font-bold text-foreground mt-7 mb-2.5 tracking-tight">
      {text}
    </h4>
  );
}
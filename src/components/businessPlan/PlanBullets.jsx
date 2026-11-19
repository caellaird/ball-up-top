import React from 'react';

export default function PlanBullets({ items }) {
  return (
    <ul className="mb-5 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-7 text-foreground/80">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
import React from 'react';

export default function PlanTable({ head, rows, widths }) {
  const fractions = widths || head.map(() => 1 / head.length);

  return (
    <div className="mb-6 -mx-1 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th
                key={i}
                style={{ width: `${fractions[i] * 100}%` }}
                className="bg-primary/10 px-3 py-2.5 font-heading text-[11px] font-bold uppercase tracking-wide text-foreground align-bottom"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={r % 2 ? 'bg-muted/40' : ''}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="border-b border-border/70 px-3 py-2.5 text-[13.5px] leading-6 text-foreground/80 align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
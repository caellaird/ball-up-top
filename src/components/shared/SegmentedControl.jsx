import React from 'react';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-muted rounded-full p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-sm font-semibold py-2 rounded-full transition ${
            value === opt.value ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 px-4">
      <h3 className="font-heading text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
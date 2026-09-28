import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { REACTION_EMOJIS } from '@/lib/reactions';

// A compact bottom sheet with the curated reaction set. Choosing an emoji
// fires onSelect and closes the sheet.
export default function ReactionPickerSheet({ open, onOpenChange, onSelect }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-6 pt-3">
        <SheetHeader className="text-center">
          <SheetTitle className="font-heading text-base">React</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                onOpenChange(false);
              }}
              className="aspect-square flex items-center justify-center text-3xl rounded-2xl bg-muted hover:bg-primary/10 active:scale-90 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
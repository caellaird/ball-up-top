// Shared class string that docks a Radix popper (Select / DropdownMenu Content)
// to the bottom of the viewport as a native-like slide-up sheet on mobile.
// `!important` utilities override the inline position/transform Radix Popper sets.
export const MOBILE_BOTTOM_SHEET_CLASS =
  "!fixed !inset-x-0 !bottom-0 !top-auto !left-0 !right-0 !w-auto !min-w-0 !max-h-[75dvh] " +
  "!translate-x-0 !translate-y-0 !rounded-t-2xl !rounded-b-none border-t " +
  "!pb-[max(0.75rem,env(safe-area-inset-bottom))] " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom";
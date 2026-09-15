import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGoBack } from '@/hooks/useGoBack';
import { cn } from '@/lib/utils';

/**
 * Reusable back button with a 44px minimum touch target.
 * History-aware: navigate(-1) when history exists, otherwise falls back to the given route.
 * Preserves the existing visual design — only the icon is visible; padding is transparent.
 */
export default function BackButton({
  fallback = '/',
  className,
  icon: Icon = ArrowLeft,
  iconClassName = 'w-5 h-5',
  ariaLabel = 'Go back',
  ...props
}) {
  const goBack = useGoBack(fallback);
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={ariaLabel}
      className={cn('flex items-center justify-center min-w-[44px] min-h-[44px] shrink-0', className)}
      {...props}
    >
      <Icon className={iconClassName} />
    </button>
  );
}
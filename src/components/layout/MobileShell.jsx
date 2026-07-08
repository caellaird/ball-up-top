import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function MobileShell() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-background flex flex-col shadow-2xl overflow-x-hidden">
        <main className="flex-1 overflow-y-auto pb-28">
          <Outlet context={{ user }} />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function AppLayout() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-60">
        <TopBar user={user} />
        <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
          <Outlet context={{ user }} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
import React from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import Header from '@/components/layout/Header';
import ExploreMap from '@/components/explore/ExploreMap';

export default function Explore() {
  const { user } = useOutletContext();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialEventId = params.get('event');
  return (
    <div className="h-full flex flex-col">
      <Header title="Explore" />
      <div className="flex-1 min-h-0">
        <ExploreMap user={user} initialEventId={initialEventId} onOpenChat={(chatId) => navigate(`/messages/${chatId}`)} />
      </div>
    </div>
  );
}
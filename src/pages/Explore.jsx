import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '@/components/layout/Header';
import CityRankings from '@/components/explore/CityRankings';
import { useGoBack } from '@/hooks/useGoBack';

export default function Explore() {
  const { user } = useOutletContext();
  const goBack = useGoBack();
  return (
    <div className="h-full flex flex-col">
      <Header title="Explore" onBack={goBack} />
      <div className="flex-1 min-h-0">
        <CityRankings user={user} />
      </div>
    </div>
  );
}
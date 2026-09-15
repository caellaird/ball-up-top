import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '@/components/layout/Header';
import CityRankings from '@/components/explore/CityRankings';

export default function Explore() {
  const { user } = useOutletContext();
  return (
    <div className="h-full flex flex-col">
      <Header title="Explore" backFallback="/" />
      <div className="flex-1 min-h-0">
        <CityRankings user={user} />
      </div>
    </div>
  );
}
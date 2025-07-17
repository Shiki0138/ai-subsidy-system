'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// ContentGenerationSystemをクライアントサイドでのみロード
const ContentGenerationSystem = dynamic(
  () => import('@/components/business-improvement/ContentGenerationSystem'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function ContentGeneratorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <ContentGenerationSystem />
      </Suspense>
    </div>
  );
}
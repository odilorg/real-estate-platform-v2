import { Suspense } from 'react';
import ProjectDetailClient from './ProjectDetailClient';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <ProjectDetailClient params={resolvedParams} />
    </Suspense>
  );
}

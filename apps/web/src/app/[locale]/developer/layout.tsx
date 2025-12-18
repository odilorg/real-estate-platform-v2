import { DeveloperNav } from './components/DeveloperNav';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <DeveloperNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

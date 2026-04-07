'use client';

import { BottomNav } from '@/components/layout/BottomNav';
import { ProgramContext, useProgramProvider } from '@/hooks/useActiveProgram';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const programValue = useProgramProvider();

  return (
    <ProgramContext.Provider value={programValue}>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </div>
    </ProgramContext.Provider>
  );
}

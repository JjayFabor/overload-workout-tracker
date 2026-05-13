"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProgramContext, useProgramProvider } from "@/hooks/useActiveProgram";
import {
  findExpiredTimerDrafts,
  clearTimerFieldsInDraft,
} from "@/lib/workoutDraft";
import { notifyRestTimerDone } from "@/hooks/useTimer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const programValue = useProgramProvider();
  const pathname = usePathname();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (pathname?.startsWith("/dashboard/workout")) return;
      for (const { routineId, payload } of findExpiredTimerDrafts()) {
        notifyRestTimerDone();
        clearTimerFieldsInDraft(routineId, payload);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pathname]);

  return (
    <ProgramContext.Provider value={programValue}>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </div>
    </ProgramContext.Provider>
  );
}

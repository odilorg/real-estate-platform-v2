"use client";

import TaskReminderBell from "./TaskReminderBell";

interface CrmTopBarProps {
  agencyId: string;
  userId?: string;
}

export function CrmTopBar({ agencyId, userId }: CrmTopBarProps) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <TaskReminderBell agencyId={agencyId} userId={userId} />
      </div>
    </div>
  );
}

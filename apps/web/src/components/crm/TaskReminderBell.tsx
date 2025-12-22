"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import TaskNotificationCenter from "./TaskNotificationCenter";

interface TaskReminderBellProps {
  agencyId: string;
  userId?: string;
}

export default function TaskReminderBell({ agencyId, userId }: TaskReminderBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetchReminderCounts();
    // Refresh counts every 5 minutes
    const interval = setInterval(fetchReminderCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [agencyId, userId]);

  const fetchReminderCounts = async () => {
    try {
      const upcomingRes = await fetch(
        `/api/agency-crm/tasks/upcoming${userId ? `?userId=${userId}` : ""}`,
        {
          headers: {
            "x-agency-id": agencyId,
          },
        }
      );
      const overdueRes = await fetch(
        `/api/agency-crm/tasks/overdue${userId ? `?userId=${userId}` : ""}`,
        {
          headers: {
            "x-agency-id": agencyId,
          },
        }
      );

      if (upcomingRes.ok && overdueRes.ok) {
        const upcomingTasks = await upcomingRes.json();
        const overdueTasks = await overdueRes.json();
        setUpcomingCount(upcomingTasks.length || 0);
        setOverdueCount(overdueTasks.length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch reminder counts:", error);
    }
  };

  const totalCount = upcomingCount + overdueCount;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Task reminders"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      <TaskNotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        agencyId={agencyId}
        userId={userId}
        upcomingCount={upcomingCount}
        overdueCount={overdueCount}
        onRefresh={fetchReminderCounts}
      />
    </>
  );
}

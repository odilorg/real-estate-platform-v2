"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, Clock } from "lucide-react";
import TaskReminderCard from "./TaskReminderCard";

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  dueDate: string;
  status: string;
  assignedTo?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface TaskNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  userId?: string;
  upcomingCount: number;
  overdueCount: number;
  onRefresh: () => void;
}

export default function TaskNotificationCenter({
  isOpen,
  onClose,
  agencyId,
  userId,
  upcomingCount,
  overdueCount,
  onRefresh,
}: TaskNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"overdue" | "upcoming">("overdue");
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, agencyId, userId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const [overdueRes, upcomingRes] = await Promise.all([
        fetch(`/api/agency-crm/tasks/overdue${userId ? `?userId=${userId}` : ""}`, {
          headers: { "x-agency-id": agencyId },
        }),
        fetch(`/api/agency-crm/tasks/upcoming${userId ? `?userId=${userId}` : ""}`, {
          headers: { "x-agency-id": agencyId },
        }),
      ]);

      if (overdueRes.ok && upcomingRes.ok) {
        setOverdueTasks(await overdueRes.json());
        setUpcomingTasks(await upcomingRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskAction = () => {
    fetchTasks();
    onRefresh();
  };

  if (!isOpen) return null;

  const tasks = activeTab === "overdue" ? overdueTasks : upcomingTasks;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Task Reminders
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("overdue")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "overdue"
                ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Overdue ({overdueCount})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "upcoming"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming ({upcomingCount})
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                {activeTab === "overdue" ? (
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                ) : (
                  <Clock className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No {activeTab} tasks
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskReminderCard
                  key={task.id}
                  task={task}
                  agencyId={agencyId}
                  onComplete={handleTaskAction}
                  onSnooze={handleTaskAction}
                  isOverdue={activeTab === "overdue"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

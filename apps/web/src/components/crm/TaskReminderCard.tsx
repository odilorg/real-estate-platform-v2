"use client";

import { Check, Clock, User, Phone } from "lucide-react";
import TaskSnoozeDropdown from "./TaskSnoozeDropdown";

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

interface TaskReminderCardProps {
  task: Task;
  agencyId: string;
  onComplete: () => void;
  onSnooze: () => void;
  isOverdue?: boolean;
}

const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const TYPE_LABELS = {
  FOLLOW_UP: "Follow Up",
  VIEWING: "Viewing",
  SEND_LISTINGS: "Send Listings",
  CONTRACT: "Contract",
  PAYMENT_FOLLOWUP: "Payment Follow-up",
  OTHER: "Other",
};

export default function TaskReminderCard({
  task,
  agencyId,
  onComplete,
  onSnooze,
  isOverdue = false,
}: TaskReminderCardProps) {
  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/agency-crm/tasks/${task.id}/complete`, {
        method: "POST",
        headers: {
          "x-agency-id": agencyId,
        },
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `in ${diffMins} min`;
    } else if (diffHours < 24) {
      return `in ${diffHours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        isOverdue
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] ||
                PRIORITY_COLORS.MEDIUM
              }`}
            >
              {task.priority}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {TYPE_LABELS[task.type as keyof typeof TYPE_LABELS] || task.type}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Task details */}
      <div className="flex flex-col gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
            {isOverdue ? "Overdue" : `Due ${formatDueDate(task.dueDate)}`}
          </span>
        </div>

        {task.assignedTo && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>
              {task.assignedTo.user.firstName} {task.assignedTo.user.lastName}
            </span>
          </div>
        )}

        {task.lead && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span>
              {task.lead.firstName} {task.lead.lastName}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleComplete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          Complete
        </button>

        <TaskSnoozeDropdown
          taskId={task.id}
          agencyId={agencyId}
          onSnooze={onSnooze}
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";

interface TaskSnoozeDropdownProps {
  taskId: string;
  agencyId: string;
  onSnooze: () => void;
}

const SNOOZE_OPTIONS = [
  { label: "1 hour", value: "1h", duration: "ONE_HOUR" },
  { label: "4 hours", value: "4h", duration: "FOUR_HOURS" },
  { label: "Tomorrow", value: "tomorrow", duration: "TOMORROW" },
  { label: "Next week", value: "next_week", duration: "NEXT_WEEK" },
  { label: "Custom...", value: "custom", duration: "CUSTOM" },
];

export default function TaskSnoozeDropdown({
  taskId,
  agencyId,
  onSnooze,
}: TaskSnoozeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const handleSnooze = async (duration: string, customDateValue?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agency-crm/tasks/${taskId}/snooze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agency-id": agencyId,
        },
        body: JSON.stringify({
          duration,
          customDate: customDateValue,
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        setShowCustom(false);
        setCustomDate("");
        onSnooze();
      } else {
        console.error("Failed to snooze task");
      }
    } catch (error) {
      console.error("Error snoozing task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: typeof SNOOZE_OPTIONS[0]) => {
    if (option.value === "custom") {
      setShowCustom(true);
    } else {
      handleSnooze(option.duration);
    }
  };

  const handleCustomSubmit = () => {
    if (customDate) {
      handleSnooze("CUSTOM", new Date(customDate).toISOString());
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <Clock className="w-4 h-4" />
        Snooze
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setShowCustom(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            {!showCustom ? (
              <div className="py-1">
                {SNOOZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Snooze until
                </label>
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customDate || isLoading}
                    className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

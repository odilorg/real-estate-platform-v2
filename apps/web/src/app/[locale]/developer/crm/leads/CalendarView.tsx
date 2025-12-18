'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  nextFollowUpAt?: string;
}

interface CalendarViewProps {
  leads: Lead[];
}

export default function CalendarView({ leads }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  // Next month navigation
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  // Group leads by date
  const leadsByDate: Record<string, Lead[]> = {};
  leads.forEach(lead => {
    if (lead.nextFollowUpAt) {
      const dateKey = new Date(lead.nextFollowUpAt).toDateString();
      if (!leadsByDate[dateKey]) {
        leadsByDate[dateKey] = [];
      }
      leadsByDate[dateKey].push(lead);
    }
  });

  // Get leads for a specific date
  const getLeadsForDate = (day: number) => {
    const date = new Date(year, month, day);
    return leadsByDate[date.toDateString()] || [];
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Generate calendar days
  const calendarDays = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="aspect-square p-1 md:p-2 border border-gray-100"></div>
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayLeads = getLeadsForDate(day);
    const hasLeads = dayLeads.length > 0;
    const urgentLeads = dayLeads.filter(l => l.priority === 'URGENT').length;
    const highLeads = dayLeads.filter(l => l.priority === 'HIGH').length;

    calendarDays.push(
      <button
        key={day}
        onClick={() => setSelectedDate(new Date(year, month, day))}
        className={`aspect-square p-1 md:p-2 border transition-all ${
          isSelected(day)
            ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500'
            : isToday(day)
            ? 'bg-blue-50 border-blue-300'
            : 'border-gray-100 hover:bg-gray-50'
        }`}
      >
        <div className="h-full flex flex-col">
          <span
            className={`text-xs md:text-sm font-medium ${
              isToday(day) ? 'text-blue-600' : 'text-gray-900'
            }`}
          >
            {day}
          </span>
          {hasLeads && (
            <div className="flex-1 flex flex-col gap-0.5 mt-1">
              {urgentLeads > 0 && (
                <div className="w-full h-1 md:h-1.5 bg-red-500 rounded-full" title={`${urgentLeads} срочных`}></div>
              )}
              {highLeads > 0 && (
                <div className="w-full h-1 md:h-1.5 bg-orange-500 rounded-full" title={`${highLeads} важных`}></div>
              )}
              {dayLeads.length - urgentLeads - highLeads > 0 && (
                <div className="w-full h-1 md:h-1.5 bg-blue-500 rounded-full" title={`${dayLeads.length - urgentLeads - highLeads} остальных`}></div>
              )}
              <span className="text-xs text-gray-600 mt-auto hidden md:block">{dayLeads.length}</span>
            </div>
          )}
        </div>
      </button>
    );
  }

  const selectedDateLeads = selectedDate ? leadsByDate[selectedDate.toDateString()] || [] : [];

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-3 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs md:text-sm font-medium text-gray-600 p-1 md:p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays}
        </div>

        {/* Legend */}
        <div className="mt-4 md:mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs md:text-sm font-medium text-gray-700 mb-2">Легенда:</p>
          <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Срочные</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Важные</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Обычные</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected date leads */}
      <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
          {selectedDate
            ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
            : 'Выберите дату'}
        </h3>

        {selectedDate ? (
          selectedDateLeads.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {selectedDateLeads.map(lead => (
                <Link key={lead.id} href={`/developer/crm/leads/${lead.id}`}>
                  <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 text-sm md:text-base">
                        {lead.firstName} {lead.lastName}
                      </h4>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lead.priority === 'URGENT'
                            ? 'bg-red-100 text-red-800'
                            : lead.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : lead.priority === 'MEDIUM'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {lead.priority === 'URGENT'
                          ? '🔥'
                          : lead.priority === 'HIGH'
                          ? '⚡'
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">{lead.phone}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <CalendarIcon className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Нет лидов на эту дату</p>
            </div>
          )
        ) : (
          <div className="text-center py-8 md:py-12">
            <CalendarIcon className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Выберите дату в календаре</p>
          </div>
        )}
      </div>
    </div>
  );
}

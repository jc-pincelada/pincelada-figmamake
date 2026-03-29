import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addYears,
  format,
  isSameMonth,
  isSameDay,
  isAfter,
  startOfYear,
} from 'date-fns';

type View = 'day' | 'month' | 'year';

interface CalendarPickerProps {
  selectedDate: string;
  datesWithData: Set<string>;
  caloriesByDate: Record<string, number>;
  goal: number;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function fromDateStr(s: string): Date {
  return new Date(s + 'T12:00:00');
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPicker({
  selectedDate,
  datesWithData,
  caloriesByDate,
  goal,
  onSelectDate,
  onClose,
}: CalendarPickerProps) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const selected = fromDateStr(selectedDate);

  const [view, setView] = useState<View>('day');
  const [viewDate, setViewDate] = useState(selected);

  // DAY VIEW
  function renderDayView() {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const weeks: Date[][] = [];
    let day = calStart;
    while (day <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      weeks.push(week);
    }

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(addMonths(viewDate, -1))}
            className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('month')}
            className="text-[16px] font-medium text-[#1A1A1A] hover:text-[#7C3AED] transition-colors"
            style={{ fontFamily: 'DM Sans' }}
          >
            {format(viewDate, 'MMMM yyyy')}
          </button>
          <button
            onClick={() => {
              const next = addMonths(viewDate, 1);
              if (startOfMonth(next) <= today) setViewDate(next);
            }}
            disabled={isSameMonth(viewDate, today)}
            className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div
              key={d}
              className="text-center text-[11px] uppercase tracking-[0.1em] text-gray-400 py-1"
              style={{ fontFamily: 'DM Sans' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map(d => {
              const ds = toDateStr(d);
              const inMonth = isSameMonth(d, viewDate);
              const isSelected = isSameDay(d, selected);
              const isToday = ds === todayStr;
              const isFuture = isAfter(d, today);
              const hasData = datesWithData.has(ds);
              const cals = caloriesByDate[ds];
              const over = cals !== undefined && cals > goal;

              return (
                <button
                  key={ds}
                  onClick={() => {
                    if (!isFuture) {
                      onSelectDate(ds);
                      onClose();
                    }
                  }}
                  disabled={isFuture}
                  className={`
                    relative flex flex-col items-center justify-center py-2 rounded-lg text-[14px] transition-colors
                    ${!inMonth ? 'text-gray-300' : ''}
                    ${inMonth && !isSelected && !isFuture ? 'text-[#1A1A1A] hover:bg-[#FAF9F6]' : ''}
                    ${isSelected ? 'bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white' : ''}
                    ${isFuture ? 'text-gray-200 cursor-not-allowed' : ''}
                    ${isToday && !isSelected ? 'font-bold' : ''}
                  `}
                  style={{ fontFamily: 'DM Sans' }}
                >
                  <span>{format(d, 'd')}</span>
                  {/* Data indicator dot */}
                  {hasData && !isSelected && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${over ? 'bg-[#DC2626]' : 'bg-[#7C3AED]'}`} />
                  )}
                  {hasData && isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </>
    );
  }

  // MONTH VIEW
  function renderMonthView() {
    const year = viewDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(addYears(viewDate, -1))}
            className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors"
            aria-label="Previous year"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('year')}
            className="text-[16px] font-medium text-[#1A1A1A] hover:text-[#7C3AED] transition-colors"
            style={{ fontFamily: 'DM Sans' }}
          >
            {year}
          </button>
          <button
            onClick={() => {
              const next = addYears(viewDate, 1);
              if (startOfYear(next) <= today) setViewDate(next);
            }}
            disabled={year >= today.getFullYear()}
            className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next year"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {months.map(m => {
            const monthStr = format(m, 'yyyy-MM');
            const isFuture = isAfter(m, today);
            const isCurrentMonth = isSameMonth(m, selected);
            const hasData = [...datesWithData].some(ds => ds.startsWith(monthStr));

            return (
              <button
                key={monthStr}
                onClick={() => {
                  if (!isFuture) {
                    setViewDate(m);
                    setView('day');
                  }
                }}
                disabled={isFuture}
                className={`
                  relative py-3 px-2 rounded-lg text-[14px] transition-colors
                  ${isCurrentMonth ? 'bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white' : ''}
                  ${!isCurrentMonth && !isFuture ? 'text-[#1A1A1A] hover:bg-[#FAF9F6]' : ''}
                  ${isFuture ? 'text-gray-200 cursor-not-allowed' : ''}
                `}
                style={{ fontFamily: 'DM Sans' }}
              >
                {format(m, 'MMM')}
                {hasData && !isCurrentMonth && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // YEAR VIEW
  function renderYearView() {
    const currentDecade = Math.floor(viewDate.getFullYear() / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => currentDecade - 1 + i);

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(addYears(viewDate, -10))}
            className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors"
            aria-label="Previous decade"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span
            className="text-[16px] font-medium text-[#1A1A1A]"
            style={{ fontFamily: 'DM Sans' }}
          >
            {currentDecade} – {currentDecade + 9}
          </span>
          <button
            onClick={() => {
              if (currentDecade + 10 <= today.getFullYear()) {
                setViewDate(addYears(viewDate, 10));
              }
            }}
            disabled={currentDecade + 10 > today.getFullYear()}
            className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next decade"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {years.map(y => {
            const isFuture = y > today.getFullYear();
            const isSelected = y === selected.getFullYear();
            const inDecade = y >= currentDecade && y <= currentDecade + 9;
            const yearStr = String(y);
            const hasData = [...datesWithData].some(ds => ds.startsWith(yearStr));

            return (
              <button
                key={y}
                onClick={() => {
                  if (!isFuture) {
                    setViewDate(new Date(y, viewDate.getMonth(), 1));
                    setView('month');
                  }
                }}
                disabled={isFuture}
                className={`
                  relative py-3 px-2 rounded-lg text-[14px] transition-colors
                  ${!inDecade ? 'text-gray-300' : ''}
                  ${isSelected && inDecade ? 'bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white' : ''}
                  ${!isSelected && inDecade && !isFuture ? 'text-[#1A1A1A] hover:bg-[#FAF9F6]' : ''}
                  ${isFuture ? 'text-gray-200 cursor-not-allowed' : ''}
                `}
                style={{ fontFamily: 'DM Sans' }}
              >
                {y}
                {hasData && !isSelected && inDecade && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-[700px] mx-auto px-6 md:px-12 py-4">
        {/* View tabs */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-full p-1 w-fit">
          {(['day', 'month', 'year'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-[12px] uppercase tracking-[0.1em] transition-colors ${
                view === v
                  ? 'bg-white text-[#1A1A1A] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ fontFamily: 'DM Sans' }}
            >
              {v}
            </button>
          ))}
        </div>

        {view === 'day' && renderDayView()}
        {view === 'month' && renderMonthView()}
        {view === 'year' && renderYearView()}

        {/* Today shortcut */}
        <div className="mt-3 text-center">
          <button
            onClick={() => { onSelectDate(todayStr); onClose(); }}
            className="text-[13px] text-[#7C3AED] hover:underline"
            style={{ fontFamily: 'DM Sans' }}
          >
            Go to today
          </button>
        </div>
      </div>
    </div>
  );
}

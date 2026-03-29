import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Zap, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, ChevronRight as ArrowRight } from 'lucide-react';
import FoodPhotoAnalyzer from './components/FoodPhotoAnalyzer';
import type { Ingredient } from './components/FoodPhotoAnalyzer';
import CalendarPicker from './components/CalendarPicker';
import HistoryChart from './components/HistoryChart';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: Ingredient[];
}

interface DayData {
  entries: FoodEntry[];
  goal: number;
}

interface AllData {
  days: Record<string, DayData>;
  goal: number;
}

const DEFAULT_GOAL = 2000;
const STORAGE_KEY = 'calorie_tracker_data';

// Macro goals as rough percentages of calorie goal
// ~50% carbs, ~25% protein, ~25% fat
function macroGoals(calGoal: number) {
  return {
    protein: Math.round((calGoal * 0.25) / 4), // 4 cal/g
    carbs: Math.round((calGoal * 0.50) / 4),   // 4 cal/g
    fat: Math.round((calGoal * 0.25) / 9),     // 9 cal/g
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayKey();
  const yesterday = shiftDate(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function loadAll(): AllData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { days: {}, goal: DEFAULT_GOAL };
    const data = JSON.parse(raw);
    if (data.date && data.entries) {
      const migrated: AllData = {
        days: { [data.date]: { entries: data.entries, goal: data.goal || DEFAULT_GOAL } },
        goal: data.goal || DEFAULT_GOAL,
      };
      return migrated;
    }
    return { days: data.days || {}, goal: data.goal || DEFAULT_GOAL };
  } catch {
    return { days: {}, goal: DEFAULT_GOAL };
  }
}

function loadDay(allData: AllData, dateKey: string): DayData {
  return allData.days[dateKey] || { entries: [], goal: allData.goal };
}

// SVG circular progress ring
function ProgressRing({ percent, size = 180, stroke = 14, overBudget }: { percent: number; size?: number; stroke?: number; overBudget: boolean }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(percent, 100);
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f0f0f0"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={overBudget ? '#DC2626' : 'url(#progressGradient)'}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function App() {
  const [allData, setAllData] = useState<AllData>(loadAll);
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const isToday = selectedDate === getTodayKey();
  const dayData = loadDay(allData, selectedDate);
  const entries = dayData.entries;
  const goal = allData.goal;

  const persist = useCallback((data: AllData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  useEffect(() => {
    persist(allData);
  }, [allData, persist]);

  function setEntries(updater: FoodEntry[] | ((prev: FoodEntry[]) => FoodEntry[])) {
    setAllData(prev => {
      const currentEntries = prev.days[selectedDate]?.entries || [];
      const newEntries = typeof updater === 'function' ? updater(currentEntries) : updater;
      return {
        ...prev,
        days: {
          ...prev.days,
          [selectedDate]: { entries: newEntries, goal: prev.goal },
        },
      };
    });
  }

  function setGoal(newGoal: number) {
    setAllData(prev => ({ ...prev, goal: newGoal }));
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = entries.reduce((sum, e) => sum + e.fat, 0);
  const percent = goal > 0 ? Math.round((totalCalories / goal) * 100) : 0;
  const overBudget = totalCalories > goal;
  const remaining = goal - totalCalories;
  const mGoals = macroGoals(goal);

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !calories) return;
    setEntries(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      },
    ]);
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[700px] mx-auto px-6 md:px-12 py-5">
          <h1
            className="text-[24px] md:text-[28px] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]"
            style={{ fontFamily: 'DM Serif Display' }}
          >
            CalorieTracker
          </h1>

          {/* Date navigation */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span
                className="text-[14px] text-[#1A1A1A] font-medium min-w-[180px] text-center"
                style={{ fontFamily: 'DM Sans' }}
              >
                {formatFullDate(selectedDate)}
              </span>
              <button
                onClick={() => {
                  const next = shiftDate(selectedDate, 1);
                  if (next <= getTodayKey()) setSelectedDate(next);
                }}
                disabled={isToday}
                className="p-1 text-gray-400 hover:text-[#7C3AED] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(getTodayKey())}
                  className="ml-1 text-[12px] text-[#7C3AED] hover:underline"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  Back to today
                </button>
              )}
            </div>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`flex items-center gap-1 text-[12px] transition-colors ${showCalendar ? 'text-[#7C3AED]' : 'text-gray-400 hover:text-[#7C3AED]'}`}
              style={{ fontFamily: 'DM Sans' }}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
        </div>
      </header>

      {/* Calendar picker */}
      {showCalendar && (
        <CalendarPicker
          selectedDate={selectedDate}
          datesWithData={new Set(Object.keys(allData.days).filter(k => allData.days[k].entries.length > 0))}
          caloriesByDate={Object.fromEntries(
            Object.entries(allData.days).map(([k, v]) => [k, v.entries.reduce((s, e) => s + e.calories, 0)])
          )}
          goal={allData.goal}
          onSelectDate={setSelectedDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <main className="max-w-[700px] mx-auto px-6 md:px-12 py-6 space-y-6">

        {/* ── Daily Intake Card ── */}
        <section className="bg-gradient-to-br from-[#7C3AED]/10 via-[#6366F1]/5 to-[#3B82F6]/10 rounded-2xl p-6 md:p-8 border border-[#7C3AED]/10">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-[#7C3AED]" />
            <span
              className="text-[15px] font-medium text-[#1A1A1A]"
              style={{ fontFamily: 'DM Sans' }}
            >
              Daily Intake
            </span>
            {editingGoal ? (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  value={goal}
                  onChange={e => setGoal(Number(e.target.value))}
                  className="w-20 px-2 py-1 text-[14px] border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none bg-white"
                  style={{ fontFamily: 'DM Sans' }}
                />
                <button
                  onClick={() => setEditingGoal(false)}
                  className="text-[12px] text-[#7C3AED] hover:underline"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                className="ml-auto text-[12px] text-gray-400 hover:text-[#7C3AED] transition-colors"
                style={{ fontFamily: 'DM Sans' }}
              >
                Goal: {goal} kcal
              </button>
            )}
          </div>

          {/* Ring + Stats */}
          <div className="flex items-center justify-center gap-8">
            {/* Circular ring */}
            <div className="relative">
              <ProgressRing percent={percent} size={160} stroke={12} overBudget={overBudget} />
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-[36px] leading-[1] tracking-[-0.02em] font-bold ${overBudget ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}
                  style={{ fontFamily: 'DM Sans' }}
                >
                  {percent}%
                </span>
                {overBudget && <span className="text-[18px] mt-1">🐷</span>}
              </div>
            </div>

            {/* Calories summary */}
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-xl px-5 py-3 border border-gray-100 shadow-sm text-center">
                <div
                  className={`text-[28px] leading-[1.1] tracking-[-0.02em] font-bold ${overBudget ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}
                  style={{ fontFamily: 'DM Sans' }}
                >
                  {totalCalories}
                </div>
                <div className="w-12 h-[1px] bg-gray-200 mx-auto my-1.5" />
                <div
                  className="text-[14px] text-gray-400"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  {goal}
                </div>
              </div>
              <div
                className={`text-[13px] text-center ${overBudget ? 'text-[#DC2626] font-medium' : 'text-gray-500'}`}
                style={{ fontFamily: 'DM Sans' }}
              >
                {overBudget ? `${Math.abs(remaining)} over` : `${remaining} left`}
              </div>
            </div>
          </div>
        </section>

        {/* ── Nutritions Card ── */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span
                className="text-[15px] font-medium text-[#1A1A1A]"
                style={{ fontFamily: 'DM Sans' }}
              >
                Nutritions
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </div>

          <div className="space-y-5">
            <MacroBar label="Carbs" current={totalCarbs} target={mGoals.carbs} color="#DC2626" />
            <MacroBar label="Fat" current={totalFat} target={mGoals.fat} color="#F59E0B" />
            <MacroBar label="Protein" current={totalProtein} target={mGoals.protein} color="#3B82F6" />
          </div>
        </section>

        {/* ── Add Food ── */}
        {isToday && (
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200">
            <div
              className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-4"
              style={{ fontFamily: 'DM Sans' }}
            >
              Add Food
            </div>

            <FoodPhotoAnalyzer
              onResult={(result) => {
                setEntries(prev => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    name: result.name,
                    calories: result.calories,
                    protein: result.protein,
                    carbs: result.carbs,
                    fat: result.fat,
                    ingredients: result.ingredients,
                  },
                ]);
              }}
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[12px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>
                  or enter manually
                </span>
              </div>
            </div>

            <form onSubmit={addEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>
                    Food name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Grilled chicken breast"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7C3AED] focus:outline-none transition-colors"
                    style={{ fontFamily: 'DM Sans' }}
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>Calories (kcal)</label>
                  <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7C3AED] focus:outline-none transition-colors" style={{ fontFamily: 'DM Sans' }} />
                </div>
                <div>
                  <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>Protein (g)</label>
                  <input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="0" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7C3AED] focus:outline-none transition-colors" style={{ fontFamily: 'DM Sans' }} />
                </div>
                <div>
                  <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>Carbs (g)</label>
                  <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="0" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7C3AED] focus:outline-none transition-colors" style={{ fontFamily: 'DM Sans' }} />
                </div>
                <div>
                  <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>Fat (g)</label>
                  <input type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder="0" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7C3AED] focus:outline-none transition-colors" style={{ fontFamily: 'DM Sans' }} />
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-8 py-3 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ fontFamily: 'DM Sans' }}
              >
                <Plus className="w-5 h-5" />
                Add Entry
              </button>
            </form>
          </section>
        )}

        {/* ── Food Log ── */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200">
          <div
            className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-4"
            style={{ fontFamily: 'DM Sans' }}
          >
            {formatDateLabel(selectedDate)}'s Log ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
          </div>

          {entries.length === 0 ? (
            <p className="text-[16px] text-gray-400 text-center py-8" style={{ fontFamily: 'DM Sans' }}>
              No food logged yet. Add your first meal above.
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map(entry => (
                <FoodLogEntry key={entry.id} entry={entry} onRemove={isToday ? () => removeEntry(entry.id) : undefined} />
              ))}
            </ul>
          )}
        </section>

        {/* ── History Chart ── */}
        <HistoryChart days={allData.days} goal={goal} />
      </main>
    </div>
  );
}

/* ── Macro progress bar (like the reference's Nutritions section) ── */
function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-gray-600 w-16" style={{ fontFamily: 'DM Sans' }}>{label}</span>
          <span className="text-[13px] font-medium text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{pct}%</span>
        </div>
        <span className="text-[13px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>
          {current} / {target} g
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Food log entry with expandable ingredients ── */
function FoodLogEntry({ entry, onRemove }: { entry: FoodEntry; onRemove?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasIngredients = entry.ingredients && entry.ingredients.length > 0;

  return (
    <li className="rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasIngredients && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-[#7C3AED] transition-colors shrink-0"
              aria-label={expanded ? 'Collapse ingredients' : 'Expand ingredients'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <div className="min-w-0">
            <div className="text-[15px] text-[#1A1A1A] font-medium truncate" style={{ fontFamily: 'DM Sans' }}>
              {entry.name}
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5" style={{ fontFamily: 'DM Sans' }}>
              P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g
              {hasIngredients && (
                <span className="ml-2 text-gray-300">· {entry.ingredients!.length} items</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[16px] text-[#1A1A1A] font-medium" style={{ fontFamily: 'DM Sans' }}>
            {entry.calories}
            <span className="text-[12px] text-gray-400 ml-1">kcal</span>
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-gray-300 hover:text-red-500 transition-colors"
              aria-label={`Remove ${entry.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasIngredients && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-[#FAF9F6] rounded-lg p-3 space-y-2">
            {entry.ingredients!.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]" style={{ fontFamily: 'DM Sans' }}>
                <span className="text-gray-600">{ing.name}</span>
                <div className="flex items-center gap-3 text-gray-400">
                  <span>{ing.quantity} {ing.unit}</span>
                  <span className="w-14 text-right">{ing.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

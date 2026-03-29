import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Flame, Apple, Beef, Droplets, ChevronDown, ChevronUp } from 'lucide-react';
import FoodPhotoAnalyzer from './components/FoodPhotoAnalyzer';
import type { Ingredient } from './components/FoodPhotoAnalyzer';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: Ingredient[];
}

const DEFAULT_GOAL = 2000;
const STORAGE_KEY = 'calorie_tracker_data';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadToday(): { entries: FoodEntry[]; goal: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], goal: DEFAULT_GOAL };
    const data = JSON.parse(raw);
    if (data.date === getTodayKey()) {
      return { entries: data.entries || [], goal: data.goal || DEFAULT_GOAL };
    }
    return { entries: [], goal: data.goal || DEFAULT_GOAL };
  } catch {
    return { entries: [], goal: DEFAULT_GOAL };
  }
}

export default function App() {
  const [entries, setEntries] = useState<FoodEntry[]>(() => loadToday().entries);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [goal, setGoal] = useState(() => loadToday().goal);
  const [editingGoal, setEditingGoal] = useState(false);

  const persist = useCallback((newEntries: FoodEntry[], newGoal: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: getTodayKey(),
      entries: newEntries,
      goal: newGoal,
    }));
  }, []);

  useEffect(() => {
    persist(entries, goal);
  }, [entries, goal, persist]);

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = entries.reduce((sum, e) => sum + e.fat, 0);
  const progress = Math.min((totalCalories / goal) * 100, 100);
  const overBudget = totalCalories > goal;
  const remaining = goal - totalCalories;

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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[700px] mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <div>
            <h1
              className="text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]"
              style={{ fontFamily: 'DM Serif Display' }}
            >
              Calorie Tracker
            </h1>
            <p
              className="text-[14px] text-gray-500 mt-1"
              style={{ fontFamily: 'DM Sans' }}
            >
              {today}
            </p>
          </div>
          <Flame className="w-8 h-8 text-[#7C3AED]" />
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 md:px-12 py-8 space-y-8">
        {/* Daily Progress */}
        <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div
              className="text-[11px] uppercase tracking-[0.15em] text-gray-500"
              style={{ fontFamily: 'DM Sans' }}
            >
              Daily Progress
            </div>
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={goal}
                  onChange={e => setGoal(Number(e.target.value))}
                  className="w-20 px-2 py-1 text-[14px] border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none"
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
                className="text-[12px] text-gray-400 hover:text-[#7C3AED] transition-colors"
                style={{ fontFamily: 'DM Sans' }}
              >
                Goal: {goal} kcal
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-[#DC2626]' : 'bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span
                className={`text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.02em] ${overBudget ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}
                style={{ fontFamily: 'DM Serif Display' }}
              >
                {totalCalories}
              </span>
              <span
                className="text-[16px] text-gray-500 ml-2"
                style={{ fontFamily: 'DM Sans' }}
              >
                kcal consumed
              </span>
            </div>
            <span
              className={`text-[16px] ${overBudget ? 'text-[#DC2626] font-medium' : 'text-gray-500'}`}
              style={{ fontFamily: 'DM Sans' }}
            >
              {overBudget && '😞 '}{remaining} {overBudget ? 'over' : 'remaining'}
            </span>
          </div>

          {/* Macro summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <MacroStat icon={<Beef className="w-4 h-4" />} label="Protein" value={`${totalProtein}g`} color="text-red-500" />
            <MacroStat icon={<Apple className="w-4 h-4" />} label="Carbs" value={`${totalCarbs}g`} color="text-amber-500" />
            <MacroStat icon={<Droplets className="w-4 h-4" />} label="Fat" value={`${totalFat}g`} color="text-blue-500" />
          </div>
        </section>

        {/* Add Food Form */}
        <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
          <div
            className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-4"
            style={{ fontFamily: 'DM Sans' }}
          >
            Add Food
          </div>

          {/* AI Photo Analysis */}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors"
                  style={{ fontFamily: 'DM Sans' }}
                />
              </div>
              <div>
                <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors"
                  style={{ fontFamily: 'DM Sans' }}
                />
              </div>
              <div>
                <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors"
                  style={{ fontFamily: 'DM Sans' }}
                />
              </div>
              <div>
                <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors"
                  style={{ fontFamily: 'DM Sans' }}
                />
              </div>
              <div>
                <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors"
                  style={{ fontFamily: 'DM Sans' }}
                />
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

        {/* Food Log */}
        <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
          <div
            className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-4"
            style={{ fontFamily: 'DM Sans' }}
          >
            Today's Log ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
          </div>

          {entries.length === 0 ? (
            <p
              className="text-[16px] text-gray-400 text-center py-8"
              style={{ fontFamily: 'DM Sans' }}
            >
              No food logged yet. Add your first meal above.
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map(entry => (
                <FoodLogEntry key={entry.id} entry={entry} onRemove={() => removeEntry(entry.id)} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function FoodLogEntry({ entry, onRemove }: { entry: FoodEntry; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasIngredients = entry.ingredients && entry.ingredients.length > 0;

  return (
    <li className="rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
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
            <div
              className="text-[16px] text-[#1A1A1A] font-medium truncate"
              style={{ fontFamily: 'DM Sans' }}
            >
              {entry.name}
            </div>
            <div
              className="text-[13px] text-gray-400 mt-0.5"
              style={{ fontFamily: 'DM Sans' }}
            >
              P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g
              {hasIngredients && (
                <span className="ml-2 text-gray-300">· {entry.ingredients!.length} items</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span
            className="text-[18px] text-[#1A1A1A] font-medium"
            style={{ fontFamily: 'DM Sans' }}
          >
            {entry.calories}
            <span className="text-[13px] text-gray-400 ml-1">kcal</span>
          </span>
          <button
            onClick={onRemove}
            className="text-gray-300 hover:text-red-500 transition-colors"
            aria-label={`Remove ${entry.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded ingredients */}
      {expanded && hasIngredients && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-[#FAF9F6] rounded-lg p-3 space-y-2">
            {entry.ingredients!.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]" style={{ fontFamily: 'DM Sans' }}>
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

function MacroStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-[12px] uppercase tracking-[0.1em]" style={{ fontFamily: 'DM Sans' }}>
          {label}
        </span>
      </div>
      <div
        className="text-[20px] text-[#1A1A1A] font-medium"
        style={{ fontFamily: 'DM Sans' }}
      >
        {value}
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Check, Pencil } from 'lucide-react';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: 'g' | 'pc';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisResult {
  name: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodPhotoAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

function scaleIngredient(ingredient: Ingredient, originalQty: number, newQty: number): Ingredient {
  if (originalQty === 0) return ingredient;
  const ratio = newQty / originalQty;
  return {
    ...ingredient,
    quantity: newQty,
    calories: Math.round(ingredient.calories * ratio),
    protein: Math.round(ingredient.protein * ratio * 10) / 10,
    carbs: Math.round(ingredient.carbs * ratio * 10) / 10,
    fat: Math.round(ingredient.fat * ratio * 10) / 10,
  };
}

function sumIngredients(ingredients: Ingredient[]): { calories: number; protein: number; carbs: number; fat: number } {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: Math.round((acc.protein + ing.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + ing.carbs) * 10) / 10,
      fat: Math.round((acc.fat + ing.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

const PROMPT = `Analyze this food photo. Identify each visible ingredient/component separately and estimate its nutritional content.

For the unit field, use "pc" (pieces) for items that are naturally counted: tortillas, tostadas, bread slices, eggs, tacos, empanadas, cookies, rolls, buns, patties, drumsticks, wings, etc. Use "g" (grams) for everything else: meats, rice, beans, vegetables, cheese, sauces, etc.

Respond ONLY with valid JSON in this exact format, no other text:
{"name": "brief meal description", "ingredients": [{"name": "ingredient name", "quantity": 0, "unit": "g", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}]}

Calories in kcal, protein/carbs/fat in grams per ingredient. Be accurate with portion size estimates.`;

export default function FoodPhotoAnalyzer({ onResult }: FoodPhotoAnalyzerProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [originalQuantities, setOriginalQuantities] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function saveApiKey() {
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey.trim());
      setShowKeyInput(false);
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setError('');
      setShowReview(false);
    };
    reader.readAsDataURL(file);
  }

  function clearAll() {
    setPreview(null);
    setError('');
    setShowReview(false);
    setIngredients([]);
    setOriginalQuantities([]);
    setMealName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  function updateIngredientQty(index: number, newQty: number) {
    setIngredients(prev =>
      prev.map((ing, i) =>
        i === index ? scaleIngredient(ing, originalQuantities[i], newQty) : ing,
      ),
    );
  }

  function confirmIngredients() {
    const totals = sumIngredients(ingredients);
    onResult({
      name: mealName,
      ingredients,
      ...totals,
    });
    clearAll();
  }

  async function analyzePhoto() {
    if (!preview || !apiKey) return;

    setAnalyzing(true);
    setError('');

    const base64Data = preview.split(',')[1];
    const mediaType = preview.split(';')[0].split(':')[1];

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64Data },
                },
                { type: 'text', text: PROMPT },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      setMealName(parsed.name);
      setIngredients(parsed.ingredients);
      setOriginalQuantities(parsed.ingredients.map((ing: Ingredient) => ing.quantity));
      setShowReview(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }

  const totals = showReview ? sumIngredients(ingredients) : null;

  return (
    <div className="space-y-4">
      {/* API Key Section */}
      {showKeyInput ? (
        <div className="p-4 bg-[#F5F0A0] rounded-lg border border-gray-200">
          <label className="block text-[14px] text-gray-600 mb-1" style={{ fontFamily: 'DM Sans' }}>
            Anthropic API Key
          </label>
          <p className="text-[12px] text-gray-400 mb-2" style={{ fontFamily: 'DM Sans' }}>
            Required for AI photo analysis. Stored locally in your browser.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#4E5D8A] focus:outline-none transition-colors text-[14px]"
              style={{ fontFamily: 'DM Sans' }}
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-gradient-to-br from-[#4E5D8A] via-[#6B9BD2] to-[#9EC55A] text-white rounded-full text-[14px] hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'DM Sans' }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-full text-[14px] text-gray-600 hover:border-[#4E5D8A] hover:text-[#4E5D8A] transition-colors"
              style={{ fontFamily: 'DM Sans' }}
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-full text-[14px] text-gray-600 hover:border-[#4E5D8A] hover:text-[#4E5D8A] transition-colors"
              style={{ fontFamily: 'DM Sans' }}
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>
          <button
            onClick={() => setShowKeyInput(true)}
            className="text-[12px] text-gray-400 hover:text-[#4E5D8A] transition-colors"
            style={{ fontFamily: 'DM Sans' }}
          >
            Change API key
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Image Preview + Analyze Button */}
      {preview && !showReview && (
        <div className="relative">
          <img
            src={preview}
            alt="Food to analyze"
            className="w-full max-h-[300px] object-cover rounded-lg border border-gray-200"
          />
          <button
            onClick={clearAll}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={analyzePhoto}
            disabled={analyzing}
            className="mt-3 w-full px-8 py-3 bg-gradient-to-br from-[#4E5D8A] via-[#6B9BD2] to-[#9EC55A] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ fontFamily: 'DM Sans' }}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Analyze with AI
              </>
            )}
          </button>
        </div>
      )}

      {/* Ingredient Review */}
      {showReview && (
        <div className="space-y-4">
          {/* Photo thumbnail + meal name */}
          <div className="flex items-center gap-3">
            {preview && (
              <img
                src={preview}
                alt="Analyzed food"
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
              />
            )}
            <div className="flex-1">
              <div
                className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-1"
                style={{ fontFamily: 'DM Sans' }}
              >
                AI Detected
              </div>
              <div
                className="text-[18px] text-[#1A1A1A] font-medium"
                style={{ fontFamily: 'DM Sans' }}
              >
                {mealName}
              </div>
            </div>
            <button
              onClick={clearAll}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Discard analysis"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ingredient list */}
          <div className="space-y-2">
            <div
              className="text-[11px] uppercase tracking-[0.15em] text-gray-500"
              style={{ fontFamily: 'DM Sans' }}
            >
              Ingredients — adjust quantities if needed
            </div>
            {ingredients.map((ing, i) => (
              <IngredientRow
                key={i}
                ingredient={ing}
                onQuantityChange={(qty) => updateIngredientQty(i, qty)}
              />
            ))}
          </div>

          {/* Totals */}
          {totals && (
            <div className="flex items-center justify-between px-3 py-2 bg-[#F5F0A0] rounded-lg">
              <span className="text-[14px] font-medium text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                Total
              </span>
              <div className="flex items-center gap-4 text-[13px] text-gray-500" style={{ fontFamily: 'DM Sans' }}>
                <span>{totals.calories} kcal</span>
                <span>P: {totals.protein}g</span>
                <span>C: {totals.carbs}g</span>
                <span>F: {totals.fat}g</span>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={confirmIngredients}
            className="w-full px-8 py-3 bg-gradient-to-br from-[#4E5D8A] via-[#6B9BD2] to-[#9EC55A] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ fontFamily: 'DM Sans' }}
          >
            <Check className="w-5 h-5" />
            Add to Log
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[14px] text-red-500" style={{ fontFamily: 'DM Sans' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function IngredientRow({
  ingredient,
  onQuantityChange,
}: {
  ingredient: Ingredient;
  onQuantityChange: (qty: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(ingredient.quantity));

  function startEdit() {
    setEditValue(String(ingredient.quantity));
    setEditing(true);
  }

  function commitEdit() {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      onQuantityChange(val);
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="text-[15px] text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
          {ingredient.name}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {/* Editable quantity */}
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => e.key === 'Enter' && commitEdit()}
              autoFocus
              min="0"
              step={ingredient.unit === 'pc' ? '1' : 'any'}
              className="w-16 px-2 py-1 text-[14px] text-right border-2 border-[#4E5D8A] rounded-lg focus:outline-none"
              style={{ fontFamily: 'DM Sans' }}
            />
            <span className="text-[13px] text-gray-400 w-5" style={{ fontFamily: 'DM Sans' }}>
              {ingredient.unit}
            </span>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span className="text-[14px] text-[#1A1A1A] font-medium" style={{ fontFamily: 'DM Sans' }}>
              {ingredient.quantity}
            </span>
            <span className="text-[13px] text-gray-400" style={{ fontFamily: 'DM Sans' }}>
              {ingredient.unit}
            </span>
            <Pencil className="w-3 h-3 text-gray-300 group-hover:text-[#4E5D8A] transition-colors" />
          </button>
        )}

        {/* Per-ingredient calories */}
        <span className="text-[13px] text-gray-400 w-16 text-right" style={{ fontFamily: 'DM Sans' }}>
          {ingredient.calories} kcal
        </span>
      </div>
    </div>
  );
}

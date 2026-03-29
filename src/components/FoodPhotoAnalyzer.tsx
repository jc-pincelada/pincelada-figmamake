import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';

interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodPhotoAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

export default function FoodPhotoAnalyzer({ onResult }: FoodPhotoAnalyzerProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
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
    };
    reader.readAsDataURL(file);
  }

  function clearPreview() {
    setPreview(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
          max_tokens: 256,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                {
                  type: 'text',
                  text: 'Analyze this food photo. Estimate the total nutritional content of everything visible. Respond ONLY with valid JSON in this exact format, no other text:\n{"name": "brief food description", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}\n\nCalories in kcal, protein/carbs/fat in grams. Be as accurate as possible with portion size estimates.',
                },
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

      const result: AnalysisResult = JSON.parse(jsonMatch[0]);
      onResult(result);
      clearPreview();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* API Key Section */}
      {showKeyInput ? (
        <div className="p-4 bg-[#FAF9F6] rounded-lg border border-gray-200">
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
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#7C3AED] focus:outline-none transition-colors text-[14px]"
              style={{ fontFamily: 'DM Sans' }}
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white rounded-full text-[14px] hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'DM Sans' }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-full text-[14px] text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
              style={{ fontFamily: 'DM Sans' }}
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-full text-[14px] text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
              style={{ fontFamily: 'DM Sans' }}
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>
          <button
            onClick={() => setShowKeyInput(true)}
            className="text-[12px] text-gray-400 hover:text-[#7C3AED] transition-colors"
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

      {/* Image Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Food to analyze"
            className="w-full max-h-[300px] object-cover rounded-lg border border-gray-200"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={analyzePhoto}
            disabled={analyzing}
            className="mt-3 w-full px-8 py-3 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#3B82F6] text-white rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Error */}
      {error && (
        <p className="text-[14px] text-red-500" style={{ fontFamily: 'DM Sans' }}>
          {error}
        </p>
      )}
    </div>
  );
}

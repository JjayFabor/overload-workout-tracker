'use client';

interface SetRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  targetReps: string;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onComplete: () => void;
  isComplete: boolean;
  accentColor: string;
  weightUnit?: string;
}

export function SetRow({
  setNumber,
  weight,
  reps,
  targetReps,
  onWeightChange,
  onRepsChange,
  onComplete,
  isComplete,
  accentColor,
  weightUnit = 'kg',
}: SetRowProps) {
  const handleBlur = () => {
    if (weight && reps && !isComplete) {
      onComplete();
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          isComplete ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isComplete ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          setNumber
        )}
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            inputMode="decimal"
            placeholder={weightUnit}
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-transparent focus:outline-none focus:ring-2"
            style={
              {
                '--tw-ring-color': accentColor,
              } as React.CSSProperties
            }
          />
        </div>
        <span className="text-gray-400">x</span>
        <div className="flex-1">
          <input
            type="number"
            inputMode="numeric"
            placeholder={targetReps}
            value={reps}
            onChange={(e) => onRepsChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-transparent focus:outline-none focus:ring-2"
            style={
              {
                '--tw-ring-color': accentColor,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}

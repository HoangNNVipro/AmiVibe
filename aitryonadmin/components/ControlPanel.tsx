
import React from 'react';
import { AspectRatio, StylePreset } from '../types';

interface ControlPanelProps {
  style: StylePreset;
  customStyle: string;
  aspectRatio: AspectRatio;
  onStyleChange: (style: StylePreset) => void;
  onCustomStyleChange: (val: string) => void;
  onRatioChange: (ratio: AspectRatio) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  style,
  customStyle,
  aspectRatio,
  onStyleChange,
  onCustomStyleChange,
  onRatioChange
}) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <i className="fa-solid fa-wand-magic-sparkles mr-2 text-indigo-500"></i>
          Style Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Fix: Explicitly cast enum values to string[] to resolve 'unknown' type errors during mapping */}
          {(Object.values(StylePreset) as string[]).map((p) => (
            <button
              key={p}
              onClick={() => onStyleChange(p as StylePreset)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                style === p 
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {style === StylePreset.CUSTOM && (
          <input
            type="text"
            placeholder="Describe your style (e.g. Cyberpunk Neon)"
            value={customStyle}
            onChange={(e) => onCustomStyleChange(e.target.value)}
            className="mt-3 w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <i className="fa-solid fa-expand mr-2 text-indigo-500"></i>
          Aspect Ratio
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.values(AspectRatio).map((r) => (
            <button
              key={r}
              onClick={() => onRatioChange(r)}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                aspectRatio === r 
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

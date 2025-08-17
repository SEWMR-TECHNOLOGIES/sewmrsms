
// components/ui/toggle-switch.tsx
import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, className }) => {
  return (
    <label className={`flex items-center cursor-pointer select-none ${className || ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        {/* Track */}
        <div
          className="w-11 h-6 rounded-full shadow-inner transition-colors duration-200
                     bg-gray-300 peer-checked:bg-[hsl(var(--primary))] peer-hover:bg-[hsl(var(--primary-hover))]"
        ></div>
        {/* Thumb */}
        <div
          className="absolute left-0 top-0.5 w-5 h-5 rounded-full shadow bg-white
                     transform transition-transform duration-200
                     peer-checked:translate-x-5 peer-checked:bg-[hsl(var(--primary-foreground))]"
        ></div>
      </div>
      {label && <span className="ml-3 text-sm font-medium">{label}</span>}
    </label>
  );
};

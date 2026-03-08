import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ checked, onChange, label, className }, ref) => (
    <label className={cn("flex items-center cursor-pointer select-none", className)}>
      <div className="relative">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        {/* Track */}
        <div
          className={cn(
            "w-11 h-6 rounded-full transition-colors duration-200 bg-gray-300",
            "peer-checked:bg-primary peer-hover:bg-primary/80"
          )}
        ></div>
        {/* Thumb */}
        <div
          className={cn(
            "absolute left-0 top-0.5 w-5 h-5 rounded-full bg-background shadow-lg transition-transform duration-200",
            "peer-checked:translate-x-5 peer-checked:bg-primary-foreground"
          )}
        ></div>
      </div>
      {label && <span className="ml-3 text-sm font-medium">{label}</span>}
    </label>
  )
)

ToggleSwitch.displayName = "ToggleSwitch"

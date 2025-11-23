interface PercentageSelectorProps {
  onPercentageChange?: (percentage: number) => void
  percentages?: number[]
}

export function PercentageSelector({
  onPercentageChange,
  percentages = [25, 50, 75, 100],
}: PercentageSelectorProps) {
  return (
    <div className="flex gap-1">
      {percentages.map((item) => {
        return (
          <div
            onClick={() => onPercentageChange?.(item)}
            className="bg-gray-100 dark:bg-slate-800 rounded-[4px] px-1.5 cursor-pointer group hover:bg-accent transition-color duration-300"
            key={item}
          >
            <p className="text-accent group-hover:text-white text-xs leading-4 transition-color">
              {item}%
            </p>
          </div>
        )
      })}
    </div>
  )
}




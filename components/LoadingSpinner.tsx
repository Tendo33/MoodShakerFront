"use client"

interface LoadingSpinnerProps {
  text?: string
  colorClass?: string
}

export default function LoadingSpinner({ text, colorClass = "border-amber-500" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full absolute border-4 border-solid border-gray-200"></div>
        <div
          className={`w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-transparent ${colorClass} border-t-current`}
        ></div>
      </div>
      {text && <div className="ml-4 text-lg">{text}</div>}
    </div>
  )
}

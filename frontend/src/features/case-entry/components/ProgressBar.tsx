interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="wizard-progress">
      <div className="wizard-progress-bar">
        <div
          className="wizard-progress-fill"
          style={{ width: `${((currentStep) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
      <div className="wizard-steps">
        {stepLabels.map((label, index) => (
          <div
            key={label}
            className={`wizard-step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
          >
            <div className="wizard-step-dot">
              {index < currentStep ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="wizard-step-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

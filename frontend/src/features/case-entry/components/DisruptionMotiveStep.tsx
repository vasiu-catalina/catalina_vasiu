import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { CaseEntryFormValues } from '../schema'

interface DisruptionMotiveStepProps {
  register: UseFormRegister<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
  watch: UseFormWatch<CaseEntryFormValues>
}

export function DisruptionMotiveStep({ register, errors, watch }: DisruptionMotiveStepProps) {
  const disruptionType = watch('disruption.disruptionType')
  const airlineMentionedMotive = watch('disruption.airlineMentionedMotive')

  const showMotiveQuestion = disruptionType === 'cancellation' || disruptionType === 'delay'

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Disruption motive</h2>
      <p className="wizard-step-description">What was the reason for the disruption?</p>

      <div className="wizard-fields">
        {showMotiveQuestion && (
          <>
            <fieldset className="field full-width">
              <legend>Did the airline mention a disruption motive?</legend>
              <div className="radio-group">
                <label className="choice-card">
                  <input type="radio" value="yes" {...register('disruption.airlineMentionedMotive')} />
                  Yes
                </label>
                <label className="choice-card">
                  <input type="radio" value="no" {...register('disruption.airlineMentionedMotive')} />
                  No
                </label>
                <label className="choice-card">
                  <input type="radio" value="dont_know" {...register('disruption.airlineMentionedMotive')} />
                  I don't know
                </label>
              </div>
            </fieldset>

            {airlineMentionedMotive === 'yes' && (
              <fieldset className="field full-width">
                <legend>What was the motive communicated by the airline?</legend>
                <div className="radio-group">
                  <label className="choice-card">
                    <input type="radio" value="technical" {...register('disruption.airlineMotive')} />
                    Technical problem
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="meteorological" {...register('disruption.airlineMotive')} />
                    Meteorological conditions
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="strike" {...register('disruption.airlineMotive')} />
                    Strike
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="airport_problems" {...register('disruption.airlineMotive')} />
                    Problems with airport
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="crew_problems" {...register('disruption.airlineMotive')} />
                    Crew problems
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="other" {...register('disruption.airlineMotive')} />
                    Other motives
                  </label>
                </div>
              </fieldset>
            )}
          </>
        )}

        {!showMotiveQuestion && disruptionType === 'denied_boarding' && (
          <p className="wizard-step-description">
            No additional motive information needed for denied boarding cases. You can proceed to the next step.
          </p>
        )}

        <div className="field full-width">
          <label htmlFor="incident-description">Please describe in short what happened</label>
          <textarea
            id="incident-description"
            {...register('disruption.incidentDescription')}
            rows={6}
            maxLength={2000}
            placeholder="Describe the incident in your own words..."
          />
          {errors.disruption?.incidentDescription && (
            <p className="field-error">{errors.disruption.incidentDescription.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

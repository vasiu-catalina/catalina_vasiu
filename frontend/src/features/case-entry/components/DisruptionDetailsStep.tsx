import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { CaseEntryFormValues } from '../schema'

interface DisruptionDetailsStepProps {
  register: UseFormRegister<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
  watch: UseFormWatch<CaseEntryFormValues>
}

export function DisruptionDetailsStep({ register, errors, watch }: DisruptionDetailsStepProps) {
  const disruptionType = watch('disruption.disruptionType')
  const voluntaryGiveUp = watch('disruption.voluntaryGiveUp')

  const showCancellationFields = disruptionType === 'cancellation'
  const showDelayFields = disruptionType === 'delay'
  const showDeniedBoardingFields = disruptionType === 'denied_boarding'

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Disruption details</h2>
      <p className="wizard-step-description">What type of disruption did you experience?</p>

      <div className="wizard-fields">
        <div className="field full-width">
          <label htmlFor="disruption-type">Type of disruption *</label>
          <select
            id="disruption-type"
            {...register('disruption.disruptionType')}
            className={errors.disruption?.disruptionType ? 'input-error' : ''}
          >
            <option value="">— Select disruption type —</option>
            <option value="cancellation">Cancellation</option>
            <option value="delay">Delay</option>
            <option value="denied_boarding">Denied Boarding</option>
          </select>
          {errors.disruption?.disruptionType && (
            <p className="field-error">{errors.disruption.disruptionType.message}</p>
          )}
        </div>

        {showCancellationFields && (
          <fieldset className="field full-width">
            <legend>How many days before cancellation has the airline informed?</legend>
            <div className="radio-group">
              <label className="choice-card">
                <input type="radio" value="more_than_14_days" {...register('disruption.cancellationNotice')} />
                More than 14 days
              </label>
              <label className="choice-card">
                <input type="radio" value="less_than_14_days" {...register('disruption.cancellationNotice')} />
                Less than 14 days
              </label>
              <label className="choice-card">
                <input type="radio" value="on_flight_day" {...register('disruption.cancellationNotice')} />
                On flight day
              </label>
            </div>
          </fieldset>
        )}

        {showDelayFields && (
          <fieldset className="field full-width">
            <legend>How late did you arrive at your final destination?</legend>
            <div className="radio-group">
              <label className="choice-card">
                <input type="radio" value="less_than_3h" {...register('disruption.delayArrival')} />
                Less than 3 hours
              </label>
              <label className="choice-card">
                <input type="radio" value="more_than_3h" {...register('disruption.delayArrival')} />
                More than 3 hours
              </label>
              <label className="choice-card">
                <input type="radio" value="connection_lost" {...register('disruption.delayArrival')} />
                Connection flight lost
              </label>
            </div>
          </fieldset>
        )}

        {showDeniedBoardingFields && (
          <>
            <fieldset className="field full-width">
              <legend>Did you give up your seat voluntarily?</legend>
              <div className="radio-group">
                <label className="choice-card">
                  <input type="radio" value="yes" {...register('disruption.voluntaryGiveUp')} />
                  Yes
                </label>
                <label className="choice-card">
                  <input type="radio" value="no" {...register('disruption.voluntaryGiveUp')} />
                  No
                </label>
              </div>
            </fieldset>

            {voluntaryGiveUp === 'no' && (
              <fieldset className="field full-width">
                <legend>Reason behind denial of boarding</legend>
                <div className="radio-group">
                  <label className="choice-card">
                    <input type="radio" value="overbooked" {...register('disruption.denialReason')} />
                    Flight overbooked
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="aggressive_behavior" {...register('disruption.denialReason')} />
                    Aggressive behavior with staff
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="intoxication" {...register('disruption.denialReason')} />
                    Intoxication
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="unspecified" {...register('disruption.denialReason')} />
                    Unspecified reason
                  </label>
                </div>
              </fieldset>
            )}
          </>
        )}
      </div>
    </div>
  )
}

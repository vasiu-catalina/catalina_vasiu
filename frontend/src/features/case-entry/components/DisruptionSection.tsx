import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { CaseEntryFormValues } from '../schema'

interface DisruptionSectionProps {
  register: UseFormRegister<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
  watch: UseFormWatch<CaseEntryFormValues>
}

export function DisruptionSection({ register, errors, watch }: DisruptionSectionProps) {
  const disruptionType = watch('disruption.disruptionType')
  const voluntaryGiveUp = watch('disruption.voluntaryGiveUp')
  const airlineMentionedMotive = watch('disruption.airlineMentionedMotive')

  const showCancellationFields = disruptionType === 'cancellation'
  const showDelayFields = disruptionType === 'delay'
  const showDeniedBoardingFields = disruptionType === 'denied_boarding'
  const showMotiveQuestion = disruptionType === 'cancellation' || disruptionType === 'delay'
  const showIncidentDescription = !!disruptionType

  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="section-index">Part 2</p>
          <h2>Disruption Information</h2>
        </div>
        <p className="section-description">
          Provide information about the type of disruption you experienced.
        </p>
      </div>

      <div className="field-grid">
        {/* Disruption Type Dropdown */}
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

        {/* Cancellation Fields */}
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

        {/* Delay Fields */}
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

        {/* Denied Boarding Fields */}
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

        {/* Airline Motive Question (for cancellation and delay) */}
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

        {/* Incident Description (for all disruption types) */}
        {showIncidentDescription && (
          <div className="field full-width">
            <label htmlFor="incident-description">Please describe in short what happened</label>
            <textarea
              id="incident-description"
              {...register('disruption.incidentDescription')}
              rows={6}
              maxLength={2000}
              placeholder="Describe the incident in your own words..."
            />
          </div>
        )}
      </div>
    </section>
  )
}

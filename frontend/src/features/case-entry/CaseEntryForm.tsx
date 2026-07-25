import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

import { createCase, getApiErrorMessage } from './api'
import { AirportAutocomplete } from './components/AirportAutocomplete'
import { DisruptionDetailsStep } from './components/DisruptionDetailsStep'
import { DisruptionMotiveStep } from './components/DisruptionMotiveStep'
import { ProgressBar } from './components/ProgressBar'
import { CaseEntryFormSchema, emptyDisruption, emptyFlight, type CaseEntryFormValues } from './schema'
import type { CreatedCaseResponse } from './types'

const STEP_LABELS = [
  'Flight itinerary',
  'Disruption details',
  'Disruption motive',
  'Email & compliance',
  'Flight details',
  'Passenger details',
  'Generate case',
]

const defaultValues: CaseEntryFormValues = {
  reservationNumber: '',
  flights: [emptyFlight],
  problemFlightIndex: 0,
  disruption: emptyDisruption,
  gdprConsent: false,
  updatesDecision: 'disagree',
  passenger: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
  },
  boardingPass: null,
  identityDocument: null,
}

export function CaseEntryForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasConnecting, setHasConnecting] = useState(false)

  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
    trigger,
  } = useForm<CaseEntryFormValues>({
    defaultValues,
    resolver: zodResolver(CaseEntryFormSchema),
    mode: 'onTouched',
  })
  const { append, fields, remove } = useFieldArray({ control, name: 'flights' })

  const [createdCase, setCreatedCase] = useState<CreatedCaseResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const problemFlightIndex = watch('problemFlightIndex')

  function handleAddConnection() {
    if (fields.length < 5) {
      append(emptyFlight)
    }
  }

  function handleRemoveConnection(index: number) {
    const currentProblemFlightIndex = Number(getValues('problemFlightIndex'))
    remove(index)

    if (currentProblemFlightIndex === index) {
      setValue('problemFlightIndex', Math.max(0, index - 1))
      return
    }

    if (currentProblemFlightIndex > index) {
      setValue('problemFlightIndex', currentProblemFlightIndex - 1)
    }
  }

  async function handleNext() {
    // Per-step lightweight validation
    let canProceed = true

    switch (currentStep) {
      case 0: {
        // Flight itinerary: require at least departing + destination airports for first flight
        const flights = getValues('flights')
        if (!flights[0]?.departingAirportCode || !flights[0]?.destinationAirportCode) {
          canProceed = false
        }
        break
      }
      case 1: {
        // Disruption details: require disruption type selected
        const disruptionType = getValues('disruption.disruptionType')
        if (!disruptionType) {
          await trigger('disruption.disruptionType')
          canProceed = false
        }
        break
      }
      case 3: {
        // Email & compliance: validate email and gdpr
        const emailValid = await trigger('passenger.email')
        const gdprValid = await trigger('gdprConsent')
        canProceed = emailValid && gdprValid
        break
      }
      case 4: {
        // Flight details: validate flight date, number, airline, times
        canProceed = await trigger('flights')
        break
      }
      case 5: {
        // Passenger details
        canProceed = await trigger('passenger')
        break
      }
    }

    if (canProceed) {
      setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(values: CaseEntryFormValues) {
    const boardingPass = values.boardingPass?.item(0)
    const identityDocument = values.identityDocument?.item(0)
    if (!boardingPass || !identityDocument) {
      setError('boardingPass', { message: 'Boarding pass is required.' })
      setError('identityDocument', { message: 'Identity document is required.' })
      return
    }

    setSubmitError(null)
    const payload = {
      reservation_number: values.reservationNumber,
      gdpr_consent: values.gdprConsent,
      updates_consent: values.updatesDecision === 'agree',
      disruption: {
        disruption_type: values.disruption.disruptionType,
        cancellation_notice: values.disruption.cancellationNotice || null,
        delay_arrival: values.disruption.delayArrival || null,
        voluntary_give_up: values.disruption.voluntaryGiveUp || null,
        denial_reason: values.disruption.denialReason || null,
        airline_mentioned_motive: values.disruption.airlineMentionedMotive || null,
        airline_motive: values.disruption.airlineMotive || null,
        incident_description: values.disruption.incidentDescription || '',
      },
      passenger: {
        first_name: values.passenger.firstName,
        last_name: values.passenger.lastName,
        date_of_birth: values.passenger.dateOfBirth,
        email: values.passenger.email,
        phone: values.passenger.phone,
        address: values.passenger.address,
        postal_code: values.passenger.postalCode,
      },
      flight_segments: values.flights.map((flight, index) => ({
        sequence: index + 1,
        flight_date: flight.flightDate,
        flight_number: flight.flightNumber,
        airline: flight.airline,
        departing_airport_code: flight.departingAirportCode,
        destination_airport_code: flight.destinationAirportCode,
        planned_departure_time: new Date(flight.plannedDepartureTime).toISOString(),
        planned_arrival_time: new Date(flight.plannedArrivalTime).toISOString(),
        is_connection: index > 0,
        is_problem_flight: values.problemFlightIndex === index,
      })),
    }

    const formData = new FormData()
    formData.append('payload', JSON.stringify(payload))
    formData.append('boarding_pass', boardingPass)
    formData.append('identity_document', identityDocument)

    try {
      const response = await createCase(formData)
      setCreatedCase(response)
      reset(defaultValues)
      setCurrentStep(0)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <div className="wizard-step-content">
            <h2 className="wizard-step-title">Flight itinerary</h2>
            <p className="wizard-step-description">Enter your starting and final airport, and any connecting flights.</p>

            <div className="wizard-fields">
              <div className="field-grid">
                <Controller
                  control={control}
                  name="flights.0.departingAirportCode"
                  render={({ field }) => (
                    <AirportAutocomplete
                      label="Starting airport *"
                      value={field.value}
                      onInputChange={(value) => {
                        field.onChange(value)
                        setValue('flights.0.departingAirportVerified', false, { shouldDirty: true })
                      }}
                      onOptionSelect={(value) => {
                        field.onChange(value)
                        setValue('flights.0.departingAirportVerified', true, { shouldDirty: true })
                      }}
                      hint="e.g. Name"
                      error={errors.flights?.[0]?.departingAirportCode?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="flights.0.destinationAirportCode"
                  render={({ field }) => (
                    <AirportAutocomplete
                      label="Destination airport *"
                      value={field.value}
                      onInputChange={(value) => {
                        field.onChange(value)
                        setValue('flights.0.destinationAirportVerified', false, { shouldDirty: true })
                      }}
                      onOptionSelect={(value) => {
                        field.onChange(value)
                        setValue('flights.0.destinationAirportVerified', true, { shouldDirty: true })
                      }}
                      hint="e.g. Name"
                      error={errors.flights?.[0]?.destinationAirportCode?.message}
                    />
                  )}
                />
              </div>

              <div className="field" style={{ marginTop: '16px' }}>
                <label className="choice-card connecting-checkbox">
                  <input
                    type="checkbox"
                    checked={hasConnecting}
                    onChange={(e) => {
                      setHasConnecting(e.target.checked)
                      if (!e.target.checked) {
                        // Remove all connecting flights at once (avoid loop since fields doesn't update synchronously)
                        const indicesToRemove = fields.slice(1).map((_, i) => i + 1)
                        if (indicesToRemove.length > 0) {
                          remove(indicesToRemove)
                        }
                      } else if (fields.length === 1) {
                        append(emptyFlight)
                      }
                    }}
                  />
                  Did you have connecting flight?
                </label>
              </div>

              {hasConnecting && (
                <div className="connecting-flights-section">
                  {fields.slice(1).map((field, idx) => {
                    const index = idx + 1
                    const segmentErrors = errors.flights?.[index]
                    return (
                      <div key={field.id} className="connecting-flight-card">
                        <div className="connecting-flight-header">
                          <span className="connecting-label">Enter airport of connecting flight</span>
                          {index > 1 && (
                            <button type="button" className="button-ghost" onClick={() => handleRemoveConnection(index)}>
                              Remove
                            </button>
                          )}
                        </div>
                        <Controller
                          control={control}
                          name={`flights.${index}.destinationAirportCode`}
                          render={({ field: controllerField }) => (
                            <AirportAutocomplete
                              label=""
                              value={controllerField.value}
                              onInputChange={(value) => {
                                controllerField.onChange(value)
                                setValue(`flights.${index}.destinationAirportVerified`, false, { shouldDirty: true })
                              }}
                              onOptionSelect={(value) => {
                                controllerField.onChange(value)
                                setValue(`flights.${index}.destinationAirportVerified`, true, { shouldDirty: true })
                              }}
                              hint="e.g. Name"
                              error={segmentErrors?.destinationAirportCode?.message}
                            />
                          )}
                        />
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    className="button-add-connection"
                    onClick={handleAddConnection}
                    disabled={fields.length >= 5}
                  >
                    + add another connection
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 1:
        return <DisruptionDetailsStep register={register} errors={errors} watch={watch} />

      case 2:
        return <DisruptionMotiveStep register={register} errors={errors} watch={watch} />

      case 3:
        return (
          <div className="wizard-step-content">
            <h2 className="wizard-step-title">Request email & compliance</h2>
            <p className="wizard-step-description">Provide your email address and accept the required policies.</p>

            <div className="wizard-fields">
              <div className="field">
                <label htmlFor="passenger-email">Email address *</label>
                <input id="passenger-email" type="email" placeholder="your@email.com" {...register('passenger.email')} />
                {errors.passenger?.email ? <p className="field-error">{errors.passenger.email.message}</p> : null}
              </div>

              <div className="field" style={{ marginTop: '16px' }}>
                <label className="choice-card" htmlFor="gdpr-consent">
                  <input id="gdpr-consent" type="checkbox" {...register('gdprConsent')} />
                  I agree to the GDPR policy *
                </label>
                {errors.gdprConsent ? <p className="field-error">{errors.gdprConsent.message}</p> : null}
              </div>

              <fieldset className="field" style={{ marginTop: '12px' }}>
                <legend>Receive case updates by email</legend>
                <div className="choice-row">
                  <label className="choice-card">
                    <input type="radio" value="agree" {...register('updatesDecision')} />
                    Agree
                  </label>
                  <label className="choice-card">
                    <input type="radio" value="disagree" {...register('updatesDecision')} />
                    Disagree
                  </label>
                </div>
                {errors.updatesDecision ? <p className="field-error">{errors.updatesDecision.message}</p> : null}
              </fieldset>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="wizard-step-content">
            <h2 className="wizard-step-title">Flight details</h2>
            <p className="wizard-step-description">Provide the flight number, date, and times for each segment. Mark the problem flight.</p>

            <div className="wizard-fields">
              {fields.map((field, index) => {
                const segmentErrors = errors.flights?.[index]
                const sectionTitle = index === 0 ? 'Primary flight' : `Connecting flight ${index}`

                return (
                  <article className="flight-card" key={field.id}>
                    <div className="flight-card-header">
                      <span className="segment-badge">{sectionTitle}</span>
                      <label className="choice-card compact">
                        <input type="radio" value={index} {...register('problemFlightIndex', { valueAsNumber: true })} />
                        Problem flight
                      </label>
                    </div>

                    <div className="field-grid">
                      <div className="field">
                        <label htmlFor={`flights.${index}.flightDate`}>Flight date *</label>
                        <input id={`flights.${index}.flightDate`} type="date" {...register(`flights.${index}.flightDate`)} />
                        {segmentErrors?.flightDate ? <p className="field-error">{segmentErrors.flightDate.message}</p> : null}
                      </div>
                      <div className="field">
                        <label htmlFor={`flights.${index}.flightNumber`}>Flight number *</label>
                        <input id={`flights.${index}.flightNumber`} placeholder="e.g. LH1234" {...register(`flights.${index}.flightNumber`)} />
                        {segmentErrors?.flightNumber ? <p className="field-error">{segmentErrors.flightNumber.message}</p> : null}
                      </div>
                      <div className="field">
                        <label htmlFor={`flights.${index}.airline`}>Airline *</label>
                        <input id={`flights.${index}.airline`} placeholder="e.g. Lufthansa" {...register(`flights.${index}.airline`)} />
                        {segmentErrors?.airline ? <p className="field-error">{segmentErrors.airline.message}</p> : null}
                      </div>
                      <div className="field">
                        <label htmlFor={`flights.${index}.plannedDepartureTime`}>Planned departure *</label>
                        <input
                          id={`flights.${index}.plannedDepartureTime`}
                          type="datetime-local"
                          {...register(`flights.${index}.plannedDepartureTime`)}
                        />
                        {segmentErrors?.plannedDepartureTime ? <p className="field-error">{segmentErrors.plannedDepartureTime.message}</p> : null}
                      </div>
                      <div className="field">
                        <label htmlFor={`flights.${index}.plannedArrivalTime`}>Planned arrival *</label>
                        <input
                          id={`flights.${index}.plannedArrivalTime`}
                          type="datetime-local"
                          {...register(`flights.${index}.plannedArrivalTime`)}
                        />
                        {segmentErrors?.plannedArrivalTime ? <p className="field-error">{segmentErrors.plannedArrivalTime.message}</p> : null}
                      </div>
                    </div>
                    {index === problemFlightIndex && (
                      <p className="field-hint" style={{ marginTop: '8px' }}>✓ Selected as the problem flight</p>
                    )}
                  </article>
                )
              })}
              {errors.problemFlightIndex ? <p className="field-error">{errors.problemFlightIndex.message}</p> : null}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="wizard-step-content">
            <h2 className="wizard-step-title">Passenger details</h2>
            <p className="wizard-step-description">Provide your personal and contact information.</p>

            <div className="wizard-fields">
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="passenger-first-name">First name *</label>
                  <input id="passenger-first-name" {...register('passenger.firstName')} />
                  {errors.passenger?.firstName ? <p className="field-error">{errors.passenger.firstName.message}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="passenger-last-name">Last name *</label>
                  <input id="passenger-last-name" {...register('passenger.lastName')} />
                  {errors.passenger?.lastName ? <p className="field-error">{errors.passenger.lastName.message}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="passenger-date-of-birth">Date of birth *</label>
                  <input id="passenger-date-of-birth" type="date" {...register('passenger.dateOfBirth')} />
                  {errors.passenger?.dateOfBirth ? <p className="field-error">{errors.passenger.dateOfBirth.message}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="passenger-phone">Phone *</label>
                  <input id="passenger-phone" placeholder="+49 123 456789" {...register('passenger.phone')} />
                  {errors.passenger?.phone ? <p className="field-error">{errors.passenger.phone.message}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="passenger-address">Address *</label>
                  <input id="passenger-address" {...register('passenger.address')} />
                  {errors.passenger?.address ? <p className="field-error">{errors.passenger.address.message}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="passenger-postal-code">Postal code *</label>
                  <input id="passenger-postal-code" {...register('passenger.postalCode')} />
                  {errors.passenger?.postalCode ? <p className="field-error">{errors.passenger.postalCode.message}</p> : null}
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="wizard-step-content">
            <h2 className="wizard-step-title">Generate case</h2>
            <p className="wizard-step-description">Upload your documents and submit the case to generate a PDF and receive confirmation by email.</p>

            <div className="wizard-fields">
              <div className="field">
                <label htmlFor="reservation-number">Reservation number *</label>
                <input id="reservation-number" placeholder="e.g. ABC123" {...register('reservationNumber')} />
                {errors.reservationNumber ? <p className="field-error">{errors.reservationNumber.message}</p> : null}
              </div>

              <div className="field-grid" style={{ marginTop: '16px' }}>
                <div className="field">
                  <label htmlFor="boarding-pass">Boarding pass *</label>
                  <input id="boarding-pass" type="file" accept=".pdf,.png,.jpg,.jpeg" {...register('boardingPass')} />
                  {errors.boardingPass ? <p className="field-error">{errors.boardingPass.message as string}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="identity-document">ID or passport *</label>
                  <input id="identity-document" type="file" accept=".pdf,.png,.jpg,.jpeg" {...register('identityDocument')} />
                  {errors.identityDocument ? <p className="field-error">{errors.identityDocument.message as string}</p> : null}
                </div>
              </div>

              {submitError ? (
                <div className="alert" role="alert" style={{ marginTop: '16px' }}>
                  {submitError}
                </div>
              ) : null}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (createdCase) {
    return (
      <div className="wizard-container">
        <div className="wizard-card">
          <div className="success-banner" role="status">
            <h2 className="wizard-step-title">Case created successfully!</h2>
            <p>Case #{createdCase.id} was created with status <span className="status-pill">{createdCase.status}</span></p>
            <p><strong>Assigned colleague:</strong> {createdCase.colleague ?? 'Not yet assigned'}</p>
            {createdCase.distance_km != null && createdCase.compensation_amount != null ? (
              <div className="compensation-result">
                <p><strong>Flight distance:</strong> {Math.round(createdCase.distance_km)} km</p>
                <p><strong>Compensation amount:</strong> €{createdCase.compensation_amount}</p>
              </div>
            ) : null}
            <button
              type="button"
              className="button wizard-btn-next"
              style={{ marginTop: '20px' }}
              onClick={() => {
                setCreatedCase(null)
                setCurrentStep(0)
              }}
            >
              Start a new case
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wizard-container">
      <div className="wizard-card">
        <div className="wizard-header">
          <h1 className="wizard-title">New Case</h1>
        </div>

        <ProgressBar currentStep={currentStep} totalSteps={STEP_LABELS.length} stepLabels={STEP_LABELS} />

        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStep()}

          <div className="wizard-navigation">
            {currentStep > 0 && (
              <button type="button" className="button-secondary wizard-btn-back" onClick={handleBack}>
                Previous step
              </button>
            )}
            <div className="wizard-nav-spacer" />
            {currentStep < STEP_LABELS.length - 1 ? (
              <button type="button" className="button wizard-btn-next" onClick={handleNext}>
                Next step
              </button>
            ) : (
              <button type="submit" className="button wizard-btn-next" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit case'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
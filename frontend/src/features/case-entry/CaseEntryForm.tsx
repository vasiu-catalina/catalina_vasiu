import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'

import { createCase, getApiErrorMessage } from './api'
import { DocumentUploadSection } from './components/DocumentUploadSection'
import { FlightItinerarySection } from './components/FlightItinerarySection'
import { GdprConsentSection } from './components/GdprConsentSection'
import { PassengerDetailsSection } from './components/PassengerDetailsSection'
import { CaseEntryFormSchema, emptyFlight, type CaseEntryFormValues } from './schema'
import type { CreatedCaseResponse } from './types'

const defaultValues: CaseEntryFormValues = {
  reservationNumber: '',
  flights: [emptyFlight],
  problemFlightIndex: 0,
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
  } = useForm<CaseEntryFormValues>({
    defaultValues,
    resolver: zodResolver(CaseEntryFormSchema),
  })
  const { append, fields, remove } = useFieldArray({ control, name: 'flights' })

  const [createdCase, setCreatedCase] = useState<CreatedCaseResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const problemFlightIndex = watch('problemFlightIndex')
  const gdprConsent = watch('gdprConsent')

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
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <section className="page-hero">
        <span className="hero-eyebrow">Air-Assist · EC261/2004 case intake</span>
        <h1 className="hero-title">Start a passenger compensation case without waiting for manual intake.</h1>
        <p className="hero-copy">
          Case_01 covers itinerary capture, passenger details, airport lookup, document upload, GDPR consent, and creation of a case with status NEW.
        </p>
        <div className="hero-grid">
          <div className="hero-card">
            <strong>Public entry flow</strong>
            <p>No account is required before creating the initial compensation case.</p>
          </div>
          <div className="hero-card">
            <strong>Airport integration</strong>
            <p>Airport codes are loaded through the backend proxy, not directly from the browser.</p>
          </div>
          <div className="hero-card">
            <strong>Status workflow</strong>
            <p>Every successful submission starts at <span className="status-pill">NEW</span>.</p>
          </div>
        </div>
      </section>

      <div className="form-layout">
        {createdCase ? (
          <div className="success-banner" role="status">
            <p>Case #{createdCase.id} was created successfully with status {createdCase.status}.</p>
            {createdCase.distance_km != null && createdCase.compensation_amount != null ? (
              <div className="compensation-result">
                <p><strong>Flight distance:</strong> {Math.round(createdCase.distance_km)} km</p>
                <p><strong>Compensation amount:</strong> €{createdCase.compensation_amount}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        {submitError ? (
          <div className="alert" role="alert">
            {submitError}
          </div>
        ) : null}

        <FlightItinerarySection
          control={control}
          errors={errors}
          flightCount={fields.length}
          onAddConnection={handleAddConnection}
          onRemoveConnection={handleRemoveConnection}
          register={register}
          setValue={setValue}
        />

        <section className="section-card is-muted">
          <div className="section-heading">
            <div>
              <p className="section-index">Part 2</p>
              <h2>Disruption details</h2>
            </div>
            <p className="section-description">Deferred to Case_03. This release intentionally excludes incident-type and disruption-detail inputs.</p>
          </div>
        </section>

        <section className="section-card is-muted">
          <div className="section-heading">
            <div>
              <p className="section-index">Part 3</p>
              <h2>Disruption motives</h2>
            </div>
            <p className="section-description">Deferred to Case_03. Airline-declared motives will be collected in the later eligibility slice.</p>
          </div>
        </section>

        <GdprConsentSection register={register} errors={errors} />

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-index">Part 5</p>
              <h2>Flight details</h2>
            </div>
            <p className="section-description">
              Mark exactly one problem flight. This is mandatory before the case can be submitted.
            </p>
          </div>

          <div className="summary-grid">
            {fields.map((field, index) => {
              const flight = watch(`flights.${index}`)
              return (
                <div key={field.id} className="summary-card">
                  <div className="field" style={{ gap: '10px' }}>
                    <label className="choice-card">
                      <input type="radio" value={index} {...register('problemFlightIndex', { valueAsNumber: true })} />
                      Mark segment {index + 1} as the problem flight
                    </label>
                    <p>
                      <strong>{flight.flightNumber || `Segment ${index + 1}`}</strong> · {flight.departingAirportCode || '---'} to {flight.destinationAirportCode || '---'}
                    </p>
                    <p className="field-hint">{index === problemFlightIndex ? 'Currently selected as the problem flight.' : 'Not selected.'}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {errors.problemFlightIndex ? <p className="field-error" style={{ marginTop: '12px' }}>{errors.problemFlightIndex.message}</p> : null}
        </section>

        <PassengerDetailsSection register={register} errors={errors} />
        <DocumentUploadSection register={register} errors={errors} />

        <div className="button-row">
          <button type="submit" className="button" disabled={isSubmitting || !gdprConsent}>
            {isSubmitting ? 'Submitting case…' : 'Create compensation case'}
          </button>
        </div>
      </div>
    </form>
  )
}
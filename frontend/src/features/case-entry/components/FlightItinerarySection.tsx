import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'

import { AirportAutocomplete } from './AirportAutocomplete'
import type { CaseEntryFormValues } from '../types'

interface FlightItinerarySectionProps {
  control: Control<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
  flightCount: number
  onAddConnection: () => void
  onRemoveConnection: (index: number) => void
  register: UseFormRegister<CaseEntryFormValues>
  setValue: UseFormSetValue<CaseEntryFormValues>
}

export function FlightItinerarySection({
  control,
  errors,
  flightCount,
  onAddConnection,
  onRemoveConnection,
  register,
  setValue,
}: FlightItinerarySectionProps) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="section-index">Part 1</p>
          <h2>Flight itinerary</h2>
        </div>
        <p className="section-description">
          Capture the full route, including up to four connecting flights. Airport codes are looked up through the backend airport proxy.
        </p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="reservation-number">Reservation number</label>
          <input id="reservation-number" {...register('reservationNumber')} />
          {errors.reservationNumber ? <p className="field-error">{errors.reservationNumber.message}</p> : null}
        </div>
        <div className="summary-card">
          <strong>{flightCount} flight segment{flightCount > 1 ? 's' : ''}</strong>
          <p className="field-hint">The first segment is the main itinerary leg. You may add up to four connecting flights.</p>
        </div>
      </div>

      <div className="button-row" style={{ marginTop: '18px' }}>
        <button type="button" className="button-secondary" onClick={onAddConnection} disabled={flightCount >= 5}>
          Add connecting flight
        </button>
        <span className="info-pill">Maximum 4 connecting flights</span>
      </div>

      {Array.from({ length: flightCount }).map((_, index) => {
        const segmentErrors = errors.flights?.[index]
        const sectionTitle = index === 0 ? 'Primary flight' : `Connecting flight ${index}`

        return (
          <article className="flight-card" key={`segment-${index}`}>
            <div className="flight-card-header">
              <div>
                <span className="segment-badge">{sectionTitle}</span>
                <h3 style={{ marginTop: '8px' }}>Segment {index + 1}</h3>
              </div>
              {index > 0 ? (
                <button type="button" className="button-ghost" onClick={() => onRemoveConnection(index)}>
                  Remove segment
                </button>
              ) : null}
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor={`flights.${index}.flightDate`}>Flight date</label>
                <input id={`flights.${index}.flightDate`} type="date" {...register(`flights.${index}.flightDate`)} />
                {segmentErrors?.flightDate ? <p className="field-error">{segmentErrors.flightDate.message}</p> : null}
              </div>
              <div className="field">
                <label htmlFor={`flights.${index}.flightNumber`}>Flight number</label>
                <input id={`flights.${index}.flightNumber`} {...register(`flights.${index}.flightNumber`)} />
                {segmentErrors?.flightNumber ? <p className="field-error">{segmentErrors.flightNumber.message}</p> : null}
              </div>
              <div className="field">
                <label htmlFor={`flights.${index}.airline`}>Airline</label>
                <input id={`flights.${index}.airline`} {...register(`flights.${index}.airline`)} />
                {segmentErrors?.airline ? <p className="field-error">{segmentErrors.airline.message}</p> : null}
              </div>
              <Controller
                control={control}
                name={`flights.${index}.departingAirportCode`}
                render={({ field }) => (
                  <AirportAutocomplete
                    label="Departing airport code"
                    value={field.value}
                    onInputChange={(value) => {
                      field.onChange(value)
                      setValue(`flights.${index}.departingAirportVerified`, false, { shouldDirty: true, shouldValidate: true })
                    }}
                    onOptionSelect={(value) => {
                      field.onChange(value)
                      setValue(`flights.${index}.departingAirportVerified`, true, { shouldDirty: true, shouldValidate: true })
                    }}
                    hint="Enter at least 2 letters to fetch code suggestions."
                    error={segmentErrors?.departingAirportCode?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name={`flights.${index}.destinationAirportCode`}
                render={({ field }) => (
                  <AirportAutocomplete
                    label="Destination airport code"
                    value={field.value}
                    onInputChange={(value) => {
                      field.onChange(value)
                      setValue(`flights.${index}.destinationAirportVerified`, false, { shouldDirty: true, shouldValidate: true })
                    }}
                    onOptionSelect={(value) => {
                      field.onChange(value)
                      setValue(`flights.${index}.destinationAirportVerified`, true, { shouldDirty: true, shouldValidate: true })
                    }}
                    error={segmentErrors?.destinationAirportCode?.message}
                  />
                )}
              />
              <div className="field">
                <label htmlFor={`flights.${index}.plannedDepartureTime`}>Planned departure time</label>
                <input
                  id={`flights.${index}.plannedDepartureTime`}
                  type="datetime-local"
                  {...register(`flights.${index}.plannedDepartureTime`)}
                />
                {segmentErrors?.plannedDepartureTime ? <p className="field-error">{segmentErrors.plannedDepartureTime.message}</p> : null}
              </div>
              <div className="field">
                <label htmlFor={`flights.${index}.plannedArrivalTime`}>Planned arrival time</label>
                <input
                  id={`flights.${index}.plannedArrivalTime`}
                  type="datetime-local"
                  {...register(`flights.${index}.plannedArrivalTime`)}
                />
                {segmentErrors?.plannedArrivalTime ? <p className="field-error">{segmentErrors.plannedArrivalTime.message}</p> : null}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { CaseEntryFormValues } from '../types'

interface PassengerDetailsSectionProps {
  register: UseFormRegister<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
}

export function PassengerDetailsSection({ register, errors }: PassengerDetailsSectionProps) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="section-index">Part 6</p>
          <h2>Passenger details</h2>
        </div>
        <p className="section-description">
          Every passenger detail in Case_01 is mandatory, including phone number, postal address, and date of birth.
        </p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="passenger-first-name">First name</label>
          <input id="passenger-first-name" {...register('passenger.firstName')} />
          {errors.passenger?.firstName ? <p className="field-error">{errors.passenger.firstName.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="passenger-last-name">Last name</label>
          <input id="passenger-last-name" {...register('passenger.lastName')} />
          {errors.passenger?.lastName ? <p className="field-error">{errors.passenger.lastName.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="passenger-date-of-birth">Date of birth</label>
          <input id="passenger-date-of-birth" type="date" {...register('passenger.dateOfBirth')} />
          {errors.passenger?.dateOfBirth ? <p className="field-error">{errors.passenger.dateOfBirth.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="passenger-phone">Phone</label>
          <input id="passenger-phone" {...register('passenger.phone')} />
          {errors.passenger?.phone ? <p className="field-error">{errors.passenger.phone.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="passenger-address">Address</label>
          <input id="passenger-address" {...register('passenger.address')} />
          {errors.passenger?.address ? <p className="field-error">{errors.passenger.address.message}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="passenger-postal-code">Postal code</label>
          <input id="passenger-postal-code" {...register('passenger.postalCode')} />
          {errors.passenger?.postalCode ? <p className="field-error">{errors.passenger.postalCode.message}</p> : null}
        </div>
      </div>
    </section>
  )
}
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { CaseEntryFormValues } from '../types'

interface GdprConsentSectionProps {
  register: UseFormRegister<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
}

export function GdprConsentSection({ register, errors }: GdprConsentSectionProps) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="section-index">Part 4</p>
          <h2>Email & compliance request</h2>
        </div>
        <p className="section-description">
          The case cannot be submitted until the passenger email is valid and the GDPR decision is set to Agree.
        </p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="passenger-email">Email</label>
          <input id="passenger-email" type="email" {...register('passenger.email')} />
          {errors.passenger?.email ? <p className="field-error">{errors.passenger.email.message}</p> : null}
        </div>
        <div className="summary-card">
          <strong>Case status on creation</strong>
          <p className="field-hint">New cases are created with the status <span className="status-pill">NEW</span>.</p>
        </div>
      </div>

      <div className="choice-grid" style={{ marginTop: '18px' }}>
        <div className="field">
          <label className="choice-card" htmlFor="gdpr-consent">
            <input id="gdpr-consent" type="checkbox" {...register('gdprConsent')} />
            I agree to the GDPR policy.
          </label>
          {errors.gdprConsent ? <p className="field-error">{errors.gdprConsent.message}</p> : null}
        </div>

        <fieldset className="field">
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
    </section>
  )
}
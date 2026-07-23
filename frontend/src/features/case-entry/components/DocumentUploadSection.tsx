import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { CaseEntryFormValues } from '../types'

interface DocumentUploadSectionProps {
  register: UseFormRegister<CaseEntryFormValues>
  errors: FieldErrors<CaseEntryFormValues>
}

export function DocumentUploadSection({ register, errors }: DocumentUploadSectionProps) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="section-index">Supporting documents</p>
          <h2>Document upload</h2>
        </div>
        <p className="section-description">
          Upload the boarding pass and an ID or passport. Only PDF, JPG, and JPEG files up to 5 MB are accepted.
        </p>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="boarding-pass">Boarding pass</label>
          <input id="boarding-pass" type="file" accept=".pdf,.jpg,.jpeg" {...register('boardingPass')} />
          {errors.boardingPass ? <p className="field-error">{errors.boardingPass.message as string}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="identity-document">ID or passport</label>
          <input id="identity-document" type="file" accept=".pdf,.jpg,.jpeg" {...register('identityDocument')} />
          {errors.identityDocument ? <p className="field-error">{errors.identityDocument.message as string}</p> : null}
        </div>
      </div>
    </section>
  )
}
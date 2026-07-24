import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useForm, FormProvider } from 'react-hook-form'

import { DisruptionSection } from './DisruptionSection'
import type { CaseEntryFormValues } from '../schema'
import { emptyDisruption } from '../schema'

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<CaseEntryFormValues>({
    defaultValues: {
      disruption: emptyDisruption,
    } as CaseEntryFormValues,
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

function renderDisruptionSection() {
  function TestForm() {
    const { register, formState: { errors }, watch } = useForm<CaseEntryFormValues>({
      defaultValues: {
        disruption: emptyDisruption,
      } as CaseEntryFormValues,
    })
    return (
      <form>
        <DisruptionSection register={register} errors={errors} watch={watch} />
      </form>
    )
  }
  return render(<TestForm />)
}

describe('DisruptionSection', () => {
  it('renders the disruption type dropdown', () => {
    renderDisruptionSection()
    expect(screen.getByLabelText('Type of disruption *')).toBeInTheDocument()
  })

  it('shows cancellation fields when cancellation is selected', async () => {
    const user = userEvent.setup()
    renderDisruptionSection()

    await user.selectOptions(screen.getByLabelText('Type of disruption *'), 'cancellation')

    expect(screen.getByText('How many days before cancellation has the airline informed?')).toBeInTheDocument()
    expect(screen.getByText('Did the airline mention a disruption motive?')).toBeInTheDocument()
    expect(screen.getByLabelText('Please describe in short what happened')).toBeInTheDocument()
  })

  it('shows delay fields when delay is selected', async () => {
    const user = userEvent.setup()
    renderDisruptionSection()

    await user.selectOptions(screen.getByLabelText('Type of disruption *'), 'delay')

    expect(screen.getByText('How late did you arrive at your final destination?')).toBeInTheDocument()
    expect(screen.getByText('Did the airline mention a disruption motive?')).toBeInTheDocument()
    expect(screen.getByLabelText('Please describe in short what happened')).toBeInTheDocument()
  })

  it('shows denied boarding fields when denied boarding is selected', async () => {
    const user = userEvent.setup()
    renderDisruptionSection()

    await user.selectOptions(screen.getByLabelText('Type of disruption *'), 'denied_boarding')

    expect(screen.getByText('Did you give up your seat voluntarily?')).toBeInTheDocument()
    expect(screen.getByLabelText('Please describe in short what happened')).toBeInTheDocument()
    // Should NOT show airline motive for denied boarding
    expect(screen.queryByText('Did the airline mention a disruption motive?')).not.toBeInTheDocument()
  })

  it('shows denial reason when voluntary give up is No', async () => {
    const user = userEvent.setup()
    renderDisruptionSection()

    await user.selectOptions(screen.getByLabelText('Type of disruption *'), 'denied_boarding')
    await user.click(screen.getByLabelText('No'))

    expect(screen.getByText('Reason behind denial of boarding')).toBeInTheDocument()
  })

  it('shows airline motive options when airline mentioned motive is Yes', async () => {
    const user = userEvent.setup()
    renderDisruptionSection()

    await user.selectOptions(screen.getByLabelText('Type of disruption *'), 'cancellation')
    await user.click(screen.getByLabelText('Yes'))

    expect(screen.getByText('What was the motive communicated by the airline?')).toBeInTheDocument()
    expect(screen.getByLabelText('Technical problem')).toBeInTheDocument()
    expect(screen.getByLabelText('Meteorological conditions')).toBeInTheDocument()
    expect(screen.getByLabelText('Strike')).toBeInTheDocument()
  })

  it('does not show conditional fields when no type selected', () => {
    renderDisruptionSection()

    expect(screen.queryByText('How many days before cancellation')).not.toBeInTheDocument()
    expect(screen.queryByText('How late did you arrive')).not.toBeInTheDocument()
    expect(screen.queryByText('Did you give up your seat')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Please describe in short what happened')).not.toBeInTheDocument()
  })
})

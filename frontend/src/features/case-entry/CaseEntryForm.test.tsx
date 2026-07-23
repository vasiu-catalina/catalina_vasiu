import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CaseEntryForm } from './CaseEntryForm'
import * as api from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')

  const airportResults = {
    OT: [
      {
        code: 'OTP',
        name: 'Henri Coanda International Airport',
        city: 'Bucharest',
        country: 'Romania',
        label: 'OTP - Henri Coanda International Airport / Bucharest / Romania',
      },
    ],
    FR: [
      {
        code: 'FRA',
        name: 'Frankfurt Airport',
        city: 'Frankfurt',
        country: 'Germany',
        label: 'FRA - Frankfurt Airport / Frankfurt / Germany',
      },
    ],
  } as const

  return {
    ...actual,
    createCase: vi.fn(),
    searchAirports: vi.fn().mockImplementation(async (query: string) => airportResults[query as keyof typeof airportResults] ?? []),
  }
})

function createFile(name: string, type: string, content = 'file-content') {
  return new File([content], name, { type })
}

async function completeValidForm() {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Reservation number'), 'PNR123')
  await user.type(screen.getByLabelText('Flight number'), 'RO101')
  await user.type(screen.getByLabelText('Airline'), 'Tarom')
  await user.type(screen.getByLabelText('Departing airport code'), 'OT')
  await user.click(await screen.findByRole('button', { name: 'OTP - Henri Coanda International Airport / Bucharest / Romania' }))
  await user.type(screen.getByLabelText('Destination airport code'), 'FR')
  await user.click(await screen.findByRole('button', { name: 'FRA - Frankfurt Airport / Frankfurt / Germany' }))
  await user.type(screen.getByLabelText('Flight date'), '2026-08-20')
  await user.type(screen.getByLabelText('Planned departure time'), '2026-08-20T08:30')
  await user.type(screen.getByLabelText('Planned arrival time'), '2026-08-20T11:15')
  await user.type(screen.getByLabelText('Email'), 'ana@example.com')
  await user.click(screen.getByLabelText('I agree to the GDPR policy.'))
  await user.click(within(screen.getByRole('group', { name: 'Receive case updates by email' })).getByLabelText('Agree', { exact: true }))
  await user.type(screen.getByLabelText('First name'), 'Ana')
  await user.type(screen.getByLabelText('Last name'), 'Ionescu')
  await user.type(screen.getByLabelText('Date of birth'), '1990-05-12')
  await user.type(screen.getByLabelText('Phone'), '+40123456789')
  await user.type(screen.getByLabelText('Address'), '123 Main Street')
  await user.type(screen.getByLabelText('Postal code'), '400001')
  await user.upload(screen.getByLabelText('Boarding pass'), createFile('boarding-pass.pdf', 'application/pdf'))
  await user.upload(screen.getByLabelText('ID or passport'), createFile('passport.png', 'image/png'))

  return user
}

describe('CaseEntryForm', () => {
  it('renders the case entry structure', () => {
    render(<CaseEntryForm />)

    expect(screen.getByText('Flight itinerary')).toBeInTheDocument()
    expect(screen.getByText('Disruption details')).toBeInTheDocument()
    expect(screen.getByText('Disruption motives')).toBeInTheDocument()
    expect(screen.getByText('Email & compliance request')).toBeInTheDocument()
    expect(screen.getByText('Flight details')).toBeInTheDocument()
    expect(screen.getByText('Passenger details')).toBeInTheDocument()
  })

  it('shows validation errors when required inputs are missing', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    expect(screen.getByRole('button', { name: 'Create compensation case' })).toBeDisabled()
    await user.click(screen.getByLabelText('I agree to the GDPR policy.'))
    await user.click(screen.getByRole('button', { name: 'Create compensation case' }))

    expect(await screen.findByText('Reservation number is required.')).toBeInTheDocument()
    expect(screen.getByText('Boarding pass is required.')).toBeInTheDocument()
    expect(screen.getByText('Identity document is required.')).toBeInTheDocument()
  })

  it('keeps submission disabled until GDPR consent is checked', () => {
    render(<CaseEntryForm />)

    expect(screen.getByRole('button', { name: 'Create compensation case' })).toBeDisabled()
  })

  it('submits a valid case and shows the created case banner', async () => {
    vi.mocked(api.createCase).mockResolvedValue({ id: 42, status: 'NEW', reservation_number: 'PNR123' })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Create compensation case' }))

    await waitFor(() => expect(api.createCase).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Case #42 was created successfully with status NEW.')).toBeInTheDocument()
  })

  it('shows a backend error when submission fails', async () => {
    vi.mocked(api.createCase).mockRejectedValue({ response: { data: { detail: 'Backend rejected the request.' } }, isAxiosError: true })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Create compensation case' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend rejected the request.')
  })
})
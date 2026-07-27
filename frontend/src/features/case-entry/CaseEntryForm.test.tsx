import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

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

export async function navigateToStep(user: ReturnType<typeof userEvent.setup>, stepNumber: number) {
  for (let i = 0; i < stepNumber; i++) {
    await user.click(screen.getByRole('button', { name: 'Next step' }))
  }
}

async function completeValidForm() {
  const user = userEvent.setup()

  // Step 0: Flight itinerary (airports)
  await user.type(screen.getByLabelText('Starting airport *'), 'OT')
  await user.click(await screen.findByRole('button', { name: 'OTP - Henri Coanda International Airport / Bucharest / Romania' }))
  await user.type(screen.getByLabelText('Destination airport *'), 'FR')
  await user.click(await screen.findByRole('button', { name: 'FRA - Frankfurt Airport / Frankfurt / Germany' }))
  await user.click(screen.getByRole('button', { name: 'Next step' }))

  // Step 1: Disruption details
  await user.selectOptions(screen.getByLabelText('Type of disruption *'), 'cancellation')
  await user.click(screen.getByRole('button', { name: 'Next step' }))

  // Step 2: Disruption motive
  await user.type(screen.getByLabelText('Please describe in short what happened'), 'Flight was cancelled.')
  await user.click(screen.getByRole('button', { name: 'Next step' }))

  // Step 3: Email & compliance
  await user.type(screen.getByLabelText('Email address *'), 'ana@example.com')
  await user.click(screen.getByLabelText(/I agree to the GDPR policy/))
  await user.click(screen.getByLabelText('Agree'))
  await user.click(screen.getByRole('button', { name: 'Next step' }))

  // Step 4: Flight details
  await user.type(screen.getByLabelText('Flight date *'), '2026-08-20')
  await user.type(screen.getByLabelText('Flight number *'), 'RO101')
  await user.type(screen.getByLabelText('Airline *'), 'Tarom')
  await user.type(screen.getByLabelText('Planned departure *'), '2026-08-20T08:30')
  await user.type(screen.getByLabelText('Planned arrival *'), '2026-08-20T11:15')
  await user.click(screen.getByRole('button', { name: 'Next step' }))

  // Step 5: Passenger details
  await user.type(screen.getByLabelText('First name *'), 'Ana')
  await user.type(screen.getByLabelText('Last name *'), 'Ionescu')
  await user.type(screen.getByLabelText('Date of birth *'), '1990-05-12')
  await user.type(screen.getByLabelText('Phone *'), '+40123456789')
  await user.type(screen.getByLabelText('Address *'), '123 Main Street')
  await user.type(screen.getByLabelText('Postal code *'), '400001')
  await user.click(screen.getByRole('button', { name: 'Next step' }))

  // Step 6: Generate case
  await user.type(screen.getByLabelText('Reservation number *'), 'PNR123')
  await user.upload(screen.getByLabelText('Boarding pass *'), createFile('boarding-pass.pdf', 'application/pdf'))
  await user.upload(screen.getByLabelText('ID or passport *'), createFile('passport.png', 'image/png'))

  return user
}

describe('CaseEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the wizard with progress bar and first step', () => {
    render(<CaseEntryForm />)

    expect(screen.getByText('New Case')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Flight itinerary' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next step' })).toBeInTheDocument()
  })

  it('shows all step labels in the progress bar', () => {
    render(<CaseEntryForm />)

    // Step labels appear in the progress bar (and first step title matches too)
    expect(screen.getAllByText('Flight itinerary').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Disruption details').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Disruption motive').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Email & compliance').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Flight details').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Passenger details').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Generate case').length).toBeGreaterThanOrEqual(1)
  })

  it('submits a valid case and shows success', async () => {
    vi.mocked(api.createCase).mockResolvedValue({ id: 42, status: 'NEW', reservation_number: 'PNR123', colleague: null, distance_km: null, compensation_amount: null })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Submit case' }))

    await waitFor(() => expect(api.createCase).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Case created successfully!')).toBeInTheDocument()
  })

  it('displays compensation result when distance and amount are calculated', async () => {
    vi.mocked(api.createCase).mockResolvedValue({
      id: 55,
      status: 'NEW',
      reservation_number: 'PNR456',
      colleague: null,
      distance_km: 6189.44,
      compensation_amount: 600,
    })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Submit case' }))

    await waitFor(() => expect(api.createCase).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Case created successfully!')).toBeInTheDocument()
    expect(screen.getByText('6189 km', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('€600', { exact: false })).toBeInTheDocument()
  })

  it('does not display compensation section when distance is null', async () => {
    vi.mocked(api.createCase).mockResolvedValue({
      id: 56,
      status: 'NEW',
      reservation_number: 'PNR789',
      colleague: null,
      distance_km: null,
      compensation_amount: null,
    })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Submit case' }))

    await waitFor(() => expect(api.createCase).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Case created successfully!')).toBeInTheDocument()
    expect(screen.queryByText('Flight distance:')).not.toBeInTheDocument()
    expect(screen.queryByText('Compensation amount:')).not.toBeInTheDocument()
  })

  it('shows a backend error when submission fails', async () => {
    vi.mocked(api.createCase).mockRejectedValue({ response: { data: { detail: 'Backend rejected the request.' } }, isAxiosError: true })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Submit case' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend rejected the request.')
  })

  it('shows colleague as not yet assigned when case is created', async () => {
    vi.mocked(api.createCase).mockResolvedValue({ id: 99, status: 'NEW', reservation_number: 'PNR999', colleague: null, distance_km: null, compensation_amount: null })
    render(<CaseEntryForm />)

    const user = await completeValidForm()
    await user.click(screen.getByRole('button', { name: 'Submit case' }))

    await waitFor(() => expect(api.createCase).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Not yet assigned')).toBeInTheDocument()
  })

  it('navigates back with the Previous step button', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    // Go forward
    await user.type(screen.getByLabelText('Starting airport *'), 'OT')
    await user.click(await screen.findByRole('button', { name: 'OTP - Henri Coanda International Airport / Bucharest / Romania' }))
    await user.type(screen.getByLabelText('Destination airport *'), 'FR')
    await user.click(await screen.findByRole('button', { name: 'FRA - Frankfurt Airport / Frankfurt / Germany' }))
    await user.click(screen.getByRole('button', { name: 'Next step' }))

    // Should be on step 2 (disruption details step title visible)
    expect(screen.getByRole('heading', { name: 'Disruption details' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeInTheDocument()

    // Go back
    await user.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(screen.getByLabelText('Starting airport *')).toBeInTheDocument()
  })
})
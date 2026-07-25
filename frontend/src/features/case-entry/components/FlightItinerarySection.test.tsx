import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CaseEntryForm } from '../CaseEntryForm'
import * as api from '../api'

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')

  return {
    ...actual,
    createCase: vi.fn(),
    searchAirports: vi.fn().mockResolvedValue([
      {
        code: 'OTP',
        name: 'Henri Coanda International Airport',
        city: 'Bucharest',
        country: 'Romania',
        label: 'OTP - Henri Coanda International Airport / Bucharest / Romania',
      },
    ]),
  }
})

describe('Flight itinerary behavior', () => {
  it('shows connecting flight fields when checkbox is checked', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    // Check the connecting flight checkbox
    await user.click(screen.getByLabelText('Did you have connecting flight?'))

    // Should show the add another connection button
    expect(screen.getByRole('button', { name: '+ add another connection' })).toBeInTheDocument()
  })

  it('adds connecting flights up to the allowed limit', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    await user.click(screen.getByLabelText('Did you have connecting flight?'))

    const addButton = screen.getByRole('button', { name: '+ add another connection' })
    // Already has 1 connecting flight from checking the box; add 3 more to reach limit of 5 total
    await user.click(addButton)
    await user.click(addButton)
    await user.click(addButton)

    expect(addButton).toBeDisabled()
  })

  it('loads airport suggestions through the API abstraction', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    await user.type(screen.getByLabelText('Starting airport *'), 'OT')

    await waitFor(() => expect(api.searchAirports).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'OTP - Henri Coanda International Airport / Bucharest / Romania' })).toBeInTheDocument()
  })
})
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
  it('adds and removes connecting flights up to the allowed limit', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    const addButton = screen.getByRole('button', { name: 'Add connecting flight' })
    await user.click(addButton)
    await user.click(addButton)
    await user.click(addButton)
    await user.click(addButton)

    expect(screen.getAllByText(/Segment /)).toHaveLength(10)
    expect(addButton).toBeDisabled()

    await user.click(screen.getAllByRole('button', { name: 'Remove segment' })[0])
    expect(addButton).not.toBeDisabled()
  })

  it('loads airport suggestions through the API abstraction', async () => {
    const user = userEvent.setup()
    render(<CaseEntryForm />)

    await user.type(screen.getByLabelText('Departing airport code'), 'OT')

    await waitFor(() => expect(api.searchAirports).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'OTP - Henri Coanda International Airport / Bucharest / Romania' })).toBeInTheDocument()
  })
})
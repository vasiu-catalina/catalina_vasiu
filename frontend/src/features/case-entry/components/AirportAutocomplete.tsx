import { useEffect, useState } from 'react'

import { searchAirports } from '../api'
import type { AirportOption } from '../types'

interface AirportAutocompleteProps {
  label: string
  value: string
  onInputChange: (value: string) => void
  onOptionSelect: (value: string) => void
  error?: string
  hint?: string
}

export function AirportAutocomplete({ label, value, onInputChange, onOptionSelect, error, hint }: AirportAutocompleteProps) {
  const [results, setResults] = useState<AirportOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    if (value.trim().length < 2) {
      setResults([])
      return () => {
        isMounted = false
      }
    }

    setLoading(true)
    searchAirports(value)
      .then((response) => {
        if (isMounted) {
          setResults(response)
        }
      })
      .catch(() => {
        if (isMounted) {
          setResults([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [value])

  return (
    <div className="field">
      <label>{label}</label>
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onInputChange(event.target.value.toUpperCase())}
        placeholder="Type an IATA code"
      />
      {hint ? <p className="field-hint">{hint}</p> : null}
      {loading ? <p className="field-hint">Searching airport codes…</p> : null}
      {results.length > 0 ? (
        <div className="suggestions">
          {results.map((option) => (
            <button
              key={`${option.code}-${option.label}`}
              type="button"
              className="suggestion-button"
              onClick={() => {
                onOptionSelect(option.code)
                setResults([])
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}
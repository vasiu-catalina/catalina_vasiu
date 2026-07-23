from typing import Any

import requests
from django.conf import settings


class AirportLookupError(Exception):
    pass


def search_airports(query: str) -> list[dict[str, str]]:
    normalized_query = query.strip().upper()
    if len(normalized_query) < 2:
        return []

    if len(normalized_query) <= 4 and normalized_query.isalpha():
        payload = _get_json(f"{settings.AIRPORTGAP_API_BASE_URL}/airports/{normalized_query}")
        airport = payload.get('data')
        return [_normalize_airport(airport)] if airport else []

    payload = _get_json(f"{settings.AIRPORTGAP_API_BASE_URL}/airports")
    results = []
    for airport in payload.get('data', []):
        normalized = _normalize_airport(airport)
        haystack = f"{normalized['code']} {normalized['name']} {normalized['city']} {normalized['country']}".upper()
        if normalized_query in haystack:
            results.append(normalized)
    return results[:10]


def _get_json(url: str) -> dict[str, Any]:
    headers: dict[str, str] = {}
    if settings.AIRPORTGAP_API_TOKEN:
        headers['Authorization'] = f"Bearer token={settings.AIRPORTGAP_API_TOKEN}"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise AirportLookupError('Airport lookup is temporarily unavailable.') from exc


def _normalize_airport(airport: dict[str, Any]) -> dict[str, str]:
    attributes = airport.get('attributes', {})
    code = attributes.get('iata') or airport.get('id', '')
    city = attributes.get('city', '')
    country = attributes.get('country', '')
    name = attributes.get('name', '')
    parts = [part for part in [name, city, country] if part]
    return {
        'code': code,
        'name': name,
        'city': city,
        'country': country,
        'label': f"{code} - {' / '.join(parts)}" if parts else code,
    }
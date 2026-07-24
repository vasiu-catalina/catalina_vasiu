def calculate_compensation(distance_km: float) -> int:
    """Determine EC261/2004 compensation based on flight distance.

    Thresholds:
        < 1500 km  → €250
        1500-3500 km → €400
        > 3500 km  → €600
    """
    if distance_km < 1500:
        return 250
    elif distance_km <= 3500:
        return 400
    else:
        return 600

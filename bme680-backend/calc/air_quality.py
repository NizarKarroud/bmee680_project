from schemas.sensor import AirQuality

MIN_SAMPLES_FOR_READY = 20

GOOD_RATIO     = 0.75
MODERATE_RATIO = 0.40



def update_baseline_online(baseline_orm, new_gas: float):
    """
    Met à jour moyenne, variance et max en O(1),
    sans relire l'historique.
    Utilise l'algorithme de Welford pour la variance.
    """
    n = baseline_orm.sample_count + 1

    delta  = new_gas - baseline_orm.running_mean
    new_mean = baseline_orm.running_mean + delta / n
    delta2 = new_gas - new_mean
    new_m2 = baseline_orm.running_m2 + delta * delta2

    new_max = max(baseline_orm.running_max, new_gas)

    new_baseline = 0.8 * new_max + 0.2 * new_mean

    baseline_orm.sample_count  = n
    baseline_orm.running_mean  = new_mean
    baseline_orm.running_m2    = new_m2
    baseline_orm.running_max   = new_max
    baseline_orm.baseline_value = new_baseline

    return new_baseline


def classify_air_quality(gas_resistance: float, baseline: float, sample_count: int) -> AirQuality:
    """
    Classify air quality relative to the baseline.
    Falls back to absolute thresholds during calibration (< MIN_SAMPLES_FOR_READY).
    """
    if sample_count < MIN_SAMPLES_FOR_READY or baseline <= 0:

        if gas_resistance >= 100_000:
            return AirQuality.GOOD
        elif gas_resistance >= 50_000:
            return AirQuality.MODERATE
        else:
            return AirQuality.POOR

    ratio = gas_resistance / baseline
    if ratio >= GOOD_RATIO:
        return AirQuality.GOOD
    elif ratio >= MODERATE_RATIO:
        return AirQuality.MODERATE
    else:
        return AirQuality.POOR
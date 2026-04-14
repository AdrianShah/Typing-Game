export function calculateGrossWPM(timeInSeconds, typedEntriesCount) {
    if (timeInSeconds === 0) return 0;
    return (typedEntriesCount / 5) / (timeInSeconds / 60);
}

export function calculateNetWPM(grossWPM, errors, timeInSeconds) {
    if (timeInSeconds === 0) return 0;
    const errorRate = errors / (timeInSeconds / 60);
    return Math.max(0, grossWPM - errorRate);
}

export function calculateAccuracy(typedEntriesCount, errors) {
    if (typedEntriesCount === 0) return 100;
    return Math.max(0, ((typedEntriesCount - errors) / typedEntriesCount) * 100);
}

// Penalty Match Scoring Configuration
export const PENALTY_MODE_CONSTANTS = {
    // 80% accuracy weight, 20% WPM weight for penalty scoring
    ACCURACY_WEIGHT: 0.8,
    WPM_WEIGHT: 0.2,
    // Baseline WPM for normalizing WPM scores (e.g., 150 WPM represents excellent performance)
    WPM_NORMALIZATION_BASELINE: 150 
};

/**
 * Calculates the ranking score for Penalty mode
 * Higher score is better.
 */
export function calculatePenaltyScore(netWPM, accuracy) {
    // Cap normalized WPM to 1.0 (baseline) so it doesn't overpower accuracy too much
    const normalizedWPM = Math.min(netWPM / PENALTY_MODE_CONSTANTS.WPM_NORMALIZATION_BASELINE, 1.0);
    
    // Convert accuracy to 0.0 - 1.0 scale
    const normalizedAccuracy = accuracy / 100;
    
    // Composite weighted score multiplied by 10,000 for integer-like readability if needed
    const compositeScore = (normalizedWPM * PENALTY_MODE_CONSTANTS.WPM_WEIGHT) + 
                           (normalizedAccuracy * PENALTY_MODE_CONSTANTS.ACCURACY_WEIGHT);
                           
    return compositeScore * 10000;
}

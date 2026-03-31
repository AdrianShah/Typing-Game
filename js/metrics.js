// Metrics functions

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
    return ((typedEntriesCount - errors) / typedEntriesCount) * 100;
}

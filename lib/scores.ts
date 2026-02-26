export function scoreColor(score: number): string {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
}

export function scoreBg(score: number): string {
    if (score >= 8) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 6) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (score >= 4) return "bg-orange-100 dark:bg-orange-900/30";
    return "bg-red-100 dark:bg-red-900/30";
}

export function getEffectiveScore(score: {
    manualOverrideScore: number | null;
    aiOverallScore: number | null;
}): number | null {
    return score.manualOverrideScore ?? score.aiOverallScore;
}

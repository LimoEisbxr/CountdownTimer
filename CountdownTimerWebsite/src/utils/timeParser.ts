/**
 * Utility functions for parsing flexible time format inputs
 */

export interface ParsedTime {
    seconds: number;
    isValid: boolean;
    error?: string;
}

/**
 * Parse time strings in various formats:
 * - "10m", "1h", "1d10h12m10s"
 * - "10:10" (minutes:seconds)
 * - "10:10:10" (hours:minutes:seconds)
 * - Time strings like "14:30" (until that time today)
 */
export function parseTimeInput(input: string): ParsedTime {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
        return { seconds: 0, isValid: false, error: 'Input cannot be empty' };
    }

    // Try parsing as duration format first (e.g., "1h30m", "10m", "1d2h30m15s")
    const durationResult = parseDurationFormat(trimmedInput);
    if (durationResult.isValid) {
        return durationResult;
    }

    // Try parsing as time string format (e.g., "10:10", "14:30:45")
    const timeStringResult = parseTimeString(trimmedInput);
    if (timeStringResult.isValid) {
        return timeStringResult;
    }

    // Try parsing as plain number (seconds)
    const numberResult = parseNumber(trimmedInput);
    if (numberResult.isValid) {
        return numberResult;
    }

    return {
        seconds: 0,
        isValid: false,
        error: 'Invalid time format. Use formats like "10m", "1h30m", "10:10", or plain seconds.',
    };
}

/**
 * Parse duration format like "1d2h30m15s", "10m", "1h30m"
 */
function parseDurationFormat(input: string): ParsedTime {
    const durationRegex = /^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i;
    const match = input.match(durationRegex);

    if (!match) {
        return { seconds: 0, isValid: false };
    }

    const [, days, hours, minutes, seconds] = match;

    // At least one unit should be specified
    if (!days && !hours && !minutes && !seconds) {
        return { seconds: 0, isValid: false };
    }

    let totalSeconds = 0;
    totalSeconds += (parseInt(days) || 0) * 24 * 60 * 60;
    totalSeconds += (parseInt(hours) || 0) * 60 * 60;
    totalSeconds += (parseInt(minutes) || 0) * 60;
    totalSeconds += parseInt(seconds) || 0;

    if (totalSeconds <= 0) {
        return {
            seconds: 0,
            isValid: false,
            error: 'Duration must be greater than 0',
        };
    }

    return { seconds: totalSeconds, isValid: true };
}

/**
 * Parse time string format like "10:10" (MM:SS) or "10:10:10" (HH:MM:SS)
 * Can also parse target times like "14:30" (until 2:30 PM today)
 */
function parseTimeString(input: string): ParsedTime {
    const timeRegex = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
    const match = input.match(timeRegex);

    if (!match) {
        return { seconds: 0, isValid: false };
    }

    const [, first, second, third] = match;

    if (third !== undefined) {
        // HH:MM:SS format - treat as duration
        const hours = parseInt(first);
        const minutes = parseInt(second);
        const seconds = parseInt(third);

        if (minutes >= 60 || seconds >= 60) {
            return {
                seconds: 0,
                isValid: false,
                error: 'Invalid time format: minutes and seconds must be less than 60',
            };
        }

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        return { seconds: totalSeconds, isValid: true };
    } else {
        // MM:SS or HH:MM format - could be duration or target time
        const firstValue = parseInt(first);
        const secondValue = parseInt(second);

        if (secondValue >= 60) {
            return {
                seconds: 0,
                isValid: false,
                error: 'Invalid time format: seconds must be less than 60',
            };
        }

        // If first value is reasonable for hours (0-23), treat as target time
        if (firstValue <= 23) {
            const targetSeconds = calculateSecondsUntilTime(
                firstValue,
                secondValue
            );
            if (targetSeconds > 0) {
                return { seconds: targetSeconds, isValid: true };
            }
        }

        // Otherwise treat as MM:SS duration
        const totalSeconds = firstValue * 60 + secondValue;
        return { seconds: totalSeconds, isValid: true };
    }
}

/**
 * Calculate seconds until a specific time today (HH:MM format)
 */
function calculateSecondsUntilTime(
    targetHour: number,
    targetMinute: number
): number {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, targetMinute, 0, 0);

    // If target time has passed today, set it for tomorrow
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }

    return Math.floor((target.getTime() - now.getTime()) / 1000);
}

/**
 * Parse plain number input
 */
function parseNumber(input: string): ParsedTime {
    const num = parseFloat(input);

    if (isNaN(num) || num <= 0) {
        return { seconds: 0, isValid: false };
    }

    return { seconds: Math.floor(num), isValid: true };
}

/**
 * Format seconds back to human-readable duration
 */
export function formatDuration(seconds: number): string {
    if (seconds <= 0) return '0s';

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
}

/**
 * Validate time input without parsing - for real-time validation feedback
 */
export function validateTimeInput(input: string): {
    isValid: boolean;
    error?: string;
} {
    if (!input.trim()) {
        return { isValid: false, error: 'Duration is required' };
    }

    const result = parseTimeInput(input);
    return { isValid: result.isValid, error: result.error };
}

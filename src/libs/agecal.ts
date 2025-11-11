import {
    addMonths,
    addYears,
    differenceInDays,
    differenceInMonths,
    differenceInYears,
    isAfter,
    parseISO
} from "date-fns";
import type {AgeBreakdown} from "./types";

/**
 * Calculate exact age (years, months, days) from a given DOB string (yyyy-MM-dd)
 */
export const calculateAgeFromDOB = (dobString: string): AgeBreakdown => {
    const now = new Date();
    const dob = parseISO(dobString);

    // If DOB is invalid or in the future
    if (isAfter(dob, now)) {
        return {
            years: 0,
            months: 0,
            days: 0,
            text: "Invalid (future date)",
            isFuture: true,
        };
    }

    // Calculate years
    const years = differenceInYears(now, dob);

    // Add those years to dob to calculate remaining months
    const afterYears = addYears(dob, years);
    const months = differenceInMonths(now, afterYears);

    // Add those months to dob to calculate remaining days
    const afterMonths = addMonths(afterYears, months);
    const days = differenceInDays(now, afterMonths);

    // Build a readable string
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days > 0 || parts.length === 0)
        parts.push(`${days} day${days > 1 ? "s" : ""}`);

    const text = parts.join(" ");

    return {
        years,
        months,
        days,
        text,
        isFuture: false,
    };
};
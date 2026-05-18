/**
 * Cron utilities for Supabase Edge Functions.
 *
 * A trimmed, timezone-aware port of `src/lib/cron_utils.ts`. Includes only
 * what the scheduler needs: validating 5-field cron expressions, parsing
 * them into named parts, and computing the next firing time.
 *
 * Date fields are interpreted in `America/Los_Angeles` regardless of the
 * runtime's host timezone. Supabase Edge Functions run in UTC, so we cannot
 * rely on `Date.prototype`'s local-time accessors here.
 *
 * The next-occurrence walk advances the underlying UTC timestamp directly
 * (rather than via `setMinutes`) so behavior is identical in dev (Pacific)
 * and production (UTC).
 */

export type CronParts = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

type CronFieldName = keyof CronParts;
type FieldConfig = { min: number; max: number; names?: readonly string[] };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const FIELD_CONFIG: Record<CronFieldName, FieldConfig> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12, names: MONTH_NAMES },
  dayOfWeek: { min: 0, max: 7, names: DAY_NAMES },
};

const PACIFIC_TZ = "America/Los_Angeles";

// Cached at module scope; constructing a DateTimeFormat is non-trivial.
const PACIFIC_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type PacificFields = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
};

/**
 * Returns the wall-clock fields of `date` as they appear in Pacific time.
 * Handles DST automatically via the IANA database.
 */
function getPacificFields(date: Date): PacificFields {
  const parts = PACIFIC_PARTS_FORMATTER.formatToParts(date);
  const get = (type: string): string => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Missing Intl part: ${type}`);
    return part.value;
  };
  return {
    minute: parseInt(get("minute"), 10),
    hour: parseInt(get("hour"), 10),
    dayOfMonth: parseInt(get("day"), 10),
    month: parseInt(get("month"), 10),
    dayOfWeek: WEEKDAY_INDEX[get("weekday")],
  };
}

function normalizeCronExpression(expression: string): string {
  return expression.trim().replace(/\s+/g, " ");
}

function isInteger(value: string): boolean {
  return /^\d+$/.test(value);
}

function normalizeNamedValue(value: string): string {
  return value.slice(0, 3).toLowerCase();
}

function isNamedValue(value: string, names: readonly string[]): boolean {
  return names.some((name) => normalizeNamedValue(name) === normalizeNamedValue(value));
}

function isValidCronValue(value: string, min: number, max: number, names?: readonly string[]): boolean {
  if (isInteger(value)) {
    const numericValue = Number(value);
    return numericValue >= min && numericValue <= max;
  }
  return !!names && isNamedValue(value, names);
}

function isValidCronToken(token: string, min: number, max: number, names?: readonly string[]): boolean {
  if (token === "*") return true;
  if (token.includes("/")) {
    const [base, step] = token.split("/");
    return !!base && !!step && isInteger(step) && isValidCronToken(base, min, max, names);
  }
  if (token.includes(",")) return token.split(",").every((part) => isValidCronToken(part, min, max, names));
  if (token.includes("-")) {
    const [start, end] = token.split("-");
    return isValidCronValue(start, min, max, names) && isValidCronValue(end, min, max, names);
  }
  return isValidCronValue(token, min, max, names);
}

function parseCronValue(value: string, names?: readonly string[]): number | null {
  if (isInteger(value)) return Number(value);
  if (!names) return null;
  const index = names.findIndex((name) => normalizeNamedValue(name) === normalizeNamedValue(value));
  if (index < 0) return null;
  return names === DAY_NAMES ? index : index + 1;
}

function normalizeDayValue(value: number | null): number | null {
  return value === 7 ? 0 : value;
}

function parseStepToken(token: string): { base: string; step: number } | null {
  if (!token.includes("/")) return null;
  const [base, rawStep] = token.split("/");
  return base && rawStep && isInteger(rawStep) ? { base, step: Number(rawStep) } : null;
}

function expandCronToken(field: CronFieldName, token: string): number[] | null {
  const { min, max, names } = FIELD_CONFIG[field];

  if (token === "*") {
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }

  if (token.includes(",")) {
    return [...new Set(token.split(",").flatMap((part) => expandCronToken(field, part) ?? []))].sort((a, b) => a - b);
  }

  const stepToken = parseStepToken(token);
  if (stepToken) {
    const baseValues = expandCronToken(field, stepToken.base);
    if (!baseValues?.length) return null;
    const start = token.startsWith("*/") ? min : Math.min(...baseValues);
    return baseValues.filter((value) => value >= start && (value - start) % stepToken.step === 0);
  }

  if (token.includes("-")) {
    const [rawStart, rawEnd] = token.split("-");
    const start = parseCronValue(rawStart, names);
    const end = parseCronValue(rawEnd, names);

    if (start === null || end === null) return null;
    if (field === "dayOfWeek") {
      const normalizedStart = normalizeDayValue(start);
      const normalizedEnd = normalizeDayValue(end);
      if (normalizedStart === null || normalizedEnd === null) return null;
      if (normalizedStart <= normalizedEnd) {
        return Array.from({ length: normalizedEnd - normalizedStart + 1 }, (_, index) => normalizedStart + index);
      }
      return [
        ...Array.from({ length: 7 - normalizedStart }, (_, index) => normalizedStart + index),
        ...Array.from({ length: normalizedEnd + 1 }, (_, index) => index),
      ];
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  const parsedValue = parseCronValue(token, names);
  if (parsedValue === null) return null;
  const normalizedValue = field === "dayOfWeek" ? normalizeDayValue(parsedValue) : parsedValue;
  return normalizedValue === null ? null : [normalizedValue];
}

function matchesCronField(field: CronFieldName, token: string, value: number): boolean {
  const allowedValues = expandCronToken(field, token);
  return !!allowedValues?.includes(value);
}

function matchesCronDate(parts: CronParts, date: Date): boolean {
  const fields = getPacificFields(date);

  if (!matchesCronField("minute", parts.minute, fields.minute)) return false;
  if (!matchesCronField("hour", parts.hour, fields.hour)) return false;
  if (!matchesCronField("month", parts.month, fields.month)) return false;

  const dayOfMonthMatches = matchesCronField("dayOfMonth", parts.dayOfMonth, fields.dayOfMonth);
  const dayOfWeekMatches = matchesCronField("dayOfWeek", parts.dayOfWeek, fields.dayOfWeek);
  const restrictsDayOfMonth = parts.dayOfMonth !== "*";
  const restrictsDayOfWeek = parts.dayOfWeek !== "*";

  // Cron convention: if both day-of-month and day-of-week are restricted,
  // a date matches if EITHER is satisfied (logical OR).
  if (restrictsDayOfMonth && restrictsDayOfWeek) {
    return dayOfMonthMatches || dayOfWeekMatches;
  }

  return dayOfMonthMatches && dayOfWeekMatches;
}

/** Validates whether a string is a supported 5-field cron expression. */
export function isValidFiveFieldCronExpression(expression: string): boolean {
  const values = normalizeCronExpression(expression).split(" ");
  if (values.length !== 5) return false;
  return (Object.keys(FIELD_CONFIG) as CronFieldName[]).every((field, index) => {
    const { min, max, names } = FIELD_CONFIG[field];
    return isValidCronToken(values[index], min, max, names);
  });
}

/** Parses a validated 5-field cron expression into its named fields. */
export function parseCronExpression(expression: string): CronParts {
  if (!isValidFiveFieldCronExpression(expression)) {
    throw new Error(`Invalid 5-field cron expression: "${expression}"`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = normalizeCronExpression(expression).split(" ");
  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

/**
 * Returns the next UTC Date strictly after `fromDate` whose Pacific
 * wall-clock fields match the given 5-field cron expression.
 *
 * DST behavior in America/Los_Angeles:
 * - Spring forward (1:59am PST → 3:00am PDT): wall-clock times in
 *   2:00am–2:59am do not exist that day. A cron matching that range
 *   skips the affected day and fires on the next valid occurrence.
 * - Fall back (1:59am PDT → 1:00am PST): wall-clock times in 1:00am–1:59am
 *   occur twice. A cron matching that range will fire at BOTH occurrences,
 *   one hour apart in absolute time. For human-facing reminders this means
 *   a once-yearly duplicate notification on the fall-back Sunday.
 */
export function getNextCronOccurrence(expression: string, fromDate: Date = new Date()): Date {
  const parts = parseCronExpression(expression);

  // Floor to the start of the current UTC minute, then advance by one minute.
  // Pure timestamp arithmetic only — we deliberately avoid Date methods like
  // setSeconds/setMinutes here. Those operate on LOCAL fields, which causes
  // ambiguous-time bugs during the fall-back hour in Pacific runtime, and
  // wrong-timezone interpretation in UTC runtime.
  let timestampMs = Math.floor(fromDate.getTime() / 60_000) * 60_000 + 60_000;
  const next = new Date(timestampMs);

  const MAX_MINUTE_LOOKAHEAD = 60 * 24 * 366 * 5;

  for (let i = 0; i < MAX_MINUTE_LOOKAHEAD; i += 1) {
    if (matchesCronDate(parts, next)) return new Date(next);
    timestampMs += 60_000;
    next.setTime(timestampMs);
  }

  throw new Error(`Could not find next occurrence for cron expression within 5 years: "${expression}"`);
}

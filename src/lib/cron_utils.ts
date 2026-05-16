export type CronParts = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export type CronTimeInput = {
  hour: number;
  minute: number;
};

export type CronRepeatPreset = "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | "custom";

export type CronFormValues = {
  repeat: CronRepeatPreset;
  hour: number;
  minute: number;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  customExpression: string;
};

export type CronBuilderInput =
  | { repeat: "daily"; time: CronTimeInput }
  | { repeat: "weekdays"; time: CronTimeInput }
  | { repeat: "weekly"; time: CronTimeInput; dayOfWeek: number }
  | { repeat: "monthly"; time: CronTimeInput; dayOfMonth: number }
  | { repeat: "yearly"; time: CronTimeInput; dayOfMonth: number; month: number }
  | { repeat: "custom"; expression: string };

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
const DEFAULT_TIME: CronTimeInput = { hour: 8, minute: 0 };

/**
 * All cron evaluation is anchored to Pacific time so that schedules behave
 * identically regardless of where this code runs (browser in any timezone,
 * Vercel server in UTC, Supabase Edge Function in UTC, local dev in PST/PDT).
 */
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
 * Handles DST automatically via the IANA database. Use this instead of
 * `Date.prototype.getHours()` etc., which return values based on the
 * runtime's local timezone.
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

type ParsedDayToken =
  | { type: "single"; value: number }
  | { type: "list"; values: number[] }
  | { type: "range"; start: number; end: number }
  | { type: "wildcard" };

type CronFieldName = keyof CronParts;
type CronNames = readonly string[] | undefined;
type FieldConfig = { min: number; max: number; names?: readonly string[] };

const FIELD_CONFIG: Record<CronFieldName, FieldConfig> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12, names: MONTH_NAMES },
  dayOfWeek: { min: 0, max: 7, names: DAY_NAMES },
};

const SIMPLE_PRESETS = [
  {
    label: "Every minute",
    matches: (parts: CronParts) => allWildcards(parts),
  },
  {
    label: "Hourly",
    matches: ({ minute, hour, dayOfMonth, month, dayOfWeek }: CronParts) =>
      isSimpleValue("minute", minute) && [hour, dayOfMonth, month, dayOfWeek].every(isWildcard),
  },
  {
    label: "Daily",
    matches: ({ minute, hour, dayOfMonth, month, dayOfWeek }: CronParts) =>
      isSimpleTime({ minute, hour }) && [dayOfMonth, month, dayOfWeek].every(isWildcard),
  },
  {
    label: "Weekly",
    matches: ({ minute, hour, dayOfMonth, month, dayOfWeek }: CronParts) =>
      isSimpleTime({ minute, hour }) && [dayOfMonth, month].every(isWildcard) && !isWildcard(dayOfWeek),
  },
  {
    label: "Monthly",
    matches: ({ minute, hour, dayOfMonth, month, dayOfWeek }: CronParts) =>
      isSimpleTime({ minute, hour }) && !isWildcard(dayOfMonth) && isWildcard(month) && isWildcard(dayOfWeek),
  },
  {
    label: "Yearly",
    matches: ({ minute, hour, dayOfMonth, month, dayOfWeek }: CronParts) =>
      isSimpleTime({ minute, hour }) && !isWildcard(dayOfMonth) && !isWildcard(month) && isWildcard(dayOfWeek),
  },
] as const;

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

function parseCronValue(value: string, names?: CronNames): number | null {
  if (isInteger(value)) return Number(value);
  if (!names) return null;
  const index = names.findIndex((name) => normalizeNamedValue(name) === normalizeNamedValue(value));
  if (index < 0) return null;
  return names === DAY_NAMES ? index : index + 1;
}

function parseCronField(field: CronFieldName, value: string): number | null {
  return isCompositeValue(value) ? null : parseCronValue(value, FIELD_CONFIG[field].names);
}

function parseDayToken(token: string): ParsedDayToken | null {
  if (token === "*") return { type: "wildcard" };
  if (token.includes("/")) return null;
  if (token.includes(",")) {
    const values = token
      .split(",")
      .map((part) => normalizeDayValue(parseCronValue(part, DAY_NAMES)))
      .filter((value): value is number => value !== null);
    return values.length ? { type: "list", values } : null;
  }
  if (token.includes("-")) {
    const [start, end] = token.split("-");
    const parsedStart = normalizeDayValue(parseCronValue(start, DAY_NAMES));
    const parsedEnd = normalizeDayValue(parseCronValue(end, DAY_NAMES));
    return parsedStart === null || parsedEnd === null ? null : { type: "range", start: parsedStart, end: parsedEnd };
  }
  const parsedValue = normalizeDayValue(parseCronValue(token, DAY_NAMES));
  return parsedValue === null ? null : { type: "single", value: parsedValue };
}

function normalizeDayValue(value: number | null): number | null {
  return value === 7 ? 0 : value;
}

function ordinal(value: number): string {
  const remainder10 = value % 10;
  const remainder100 = value % 100;
  if (remainder10 === 1 && remainder100 !== 11) return `${value}st`;
  if (remainder10 === 2 && remainder100 !== 12) return `${value}nd`;
  if (remainder10 === 3 && remainder100 !== 13) return `${value}rd`;
  return `${value}th`;
}

function joinWithAnd(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function formatPluralDayName(dayIndex: number): string {
  return `${DAY_NAMES[dayIndex]}s`;
}

function formatExactTime(hour: number, minute: number): string {
  return `${hour}:${minute.toString().padStart(2, "0")}`;
}

function assertInRange(value: number, min: number, max: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
}

function normalizeTimeInput(time: CronTimeInput): CronTimeInput {
  assertInRange(time.hour, 0, 23, "hour");
  assertInRange(time.minute, 0, 59, "minute");
  return time;
}

function isWildcard(value: string): boolean {
  return value === "*";
}

function isCompositeValue(value: string): boolean {
  return /[,*\/-]/.test(value);
}

function isSimpleValue(field: CronFieldName, value: string): boolean {
  const config = FIELD_CONFIG[field];
  const parsedValue = parseCronField(field, value);
  return parsedValue !== null && parsedValue >= config.min && parsedValue <= config.max;
}

function isSimpleTime(parts: Pick<CronParts, "minute" | "hour">): boolean {
  return isSimpleValue("minute", parts.minute) && isSimpleValue("hour", parts.hour);
}

function allWildcards(parts: CronParts): boolean {
  return Object.values(parts).every(isWildcard);
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
  // Read all wall-clock fields once in Pacific time. Using
  // getPacificFields here is what makes cron evaluation timezone-correct
  // when this runs on a non-Pacific host (Vercel/UTC, Supabase/UTC).
  const fields = getPacificFields(date);

  const minuteMatches = matchesCronField("minute", parts.minute, fields.minute);
  const hourMatches = matchesCronField("hour", parts.hour, fields.hour);
  const monthMatches = matchesCronField("month", parts.month, fields.month);

  if (!minuteMatches || !hourMatches || !monthMatches) return false;

  const dayOfMonthMatches = matchesCronField("dayOfMonth", parts.dayOfMonth, fields.dayOfMonth);
  const dayOfWeekMatches = matchesCronField("dayOfWeek", parts.dayOfWeek, fields.dayOfWeek);
  const restrictsDayOfMonth = !isWildcard(parts.dayOfMonth);
  const restrictsDayOfWeek = !isWildcard(parts.dayOfWeek);

  if (restrictsDayOfMonth && restrictsDayOfWeek) {
    return dayOfMonthMatches || dayOfWeekMatches;
  }

  return dayOfMonthMatches && dayOfWeekMatches;
}

function buildCronExpression(parts: CronParts): string {
  return [parts.minute, parts.hour, parts.dayOfMonth, parts.month, parts.dayOfWeek].join(" ");
}

function capitalizeFirstLetter(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function parseFieldList(field: CronFieldName, value: string): number[] {
  return value
    .split(",")
    .map((part) => parseCronValue(part, FIELD_CONFIG[field].names))
    .filter((part): part is number => part !== null);
}

function describeField(
  field: CronFieldName,
  value: string,
  labels: readonly string[],
  recurringLabel: string,
  wildcardLabel: string,
): string {
  if (isWildcard(value)) return wildcardLabel;
  if (value.includes("/")) return recurringLabel;
  if (value.includes(",")) {
    const mapped = parseFieldList(field, value).map((index) => labels[index - 1]);
    return joinWithAnd(mapped);
  }
  if (value.includes("-")) {
    const [start, end] = value.split("-").map((part) => parseCronValue(part, FIELD_CONFIG[field].names));
    return start === null || end === null ? recurringLabel : `${labels[start - 1]} through ${labels[end - 1]}`;
  }
  const parsed = parseCronValue(value, FIELD_CONFIG[field].names);
  return parsed === null ? recurringLabel : labels[parsed - 1];
}

function describeOrdinalField(value: string): string {
  if (isWildcard(value)) return "Every day";
  if (value.includes("/")) return "Recurring days";
  if (value.includes(",")) return joinWithAnd(value.split(",").map((part) => ordinal(Number(part))));
  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);
    return `${ordinal(start)} through ${ordinal(end)}`;
  }
  return ordinal(Number(value));
}

function buildScheduledExpression(
  time: CronTimeInput,
  overrides: Partial<Omit<CronParts, "minute" | "hour">> = {},
): string {
  const { hour, minute } = normalizeTimeInput(time);
  return buildCronExpression({
    minute: String(minute),
    hour: String(hour),
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
    ...overrides,
  });
}

function getPresetLabel(parts: CronParts): string {
  return SIMPLE_PRESETS.find(({ matches }) => matches(parts))?.label ?? "Custom";
}

function customTimeSuffix(prefix: string, timeOfDay: string): string {
  return timeOfDay === "Various times" ? prefix : `${prefix} at ${timeOfDay}`;
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

/** Parses a validated 5-field cron expression into named fields. */
export function parseCronExpression(expression: string): CronParts {
  if (!isValidFiveFieldCronExpression(expression)) {
    throw new Error(`Invalid 5-field cron expression: "${expression}"`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = normalizeCronExpression(expression).split(" ");
  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

/**
 * Returns the next Date strictly after `fromDate` whose Pacific wall-clock
 * fields match the given 5-field cron expression.
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
  // setSeconds/setMinutes here. Those operate on LOCAL fields, which has two
  // problems: (a) on a UTC host, "local" means UTC and cron fields would not
  // be interpreted in Pacific; (b) on a Pacific host, ambiguous local times
  // during the fall-back hour cause setSeconds to silently shift the
  // underlying timestamp by an hour.
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

/** Builds a daily cron expression for a specific time. */
export function createDailyCronExpression(time: CronTimeInput): string {
  return buildScheduledExpression(time);
}

/** Builds a Monday-through-Friday cron expression for a specific time. */
export function createWeekdayCronExpression(time: CronTimeInput): string {
  return buildScheduledExpression(time, { dayOfWeek: "1-5" });
}

/** Builds a weekly cron expression for a specific weekday and time. */
export function createWeeklyCronExpression(time: CronTimeInput, dayOfWeek: number): string {
  assertInRange(dayOfWeek, 0, 6, "dayOfWeek");
  return buildScheduledExpression(time, { dayOfWeek: String(dayOfWeek) });
}

/** Builds a monthly cron expression for a specific day-of-month and time. */
export function createMonthlyCronExpression(time: CronTimeInput, dayOfMonth: number): string {
  assertInRange(dayOfMonth, 1, 31, "dayOfMonth");
  return buildScheduledExpression(time, { dayOfMonth: String(dayOfMonth) });
}

/** Builds a yearly cron expression for a specific month, day, and time. */
export function createYearlyCronExpression(time: CronTimeInput, month: number, dayOfMonth: number): string {
  assertInRange(month, 1, 12, "month");
  assertInRange(dayOfMonth, 1, 31, "dayOfMonth");
  return buildScheduledExpression(time, { month: String(month), dayOfMonth: String(dayOfMonth) });
}

/** Converts calendar-style builder input into a cron expression. */
export function createCronExpression(input: CronBuilderInput): string {
  switch (input.repeat) {
    case "daily":
      return createDailyCronExpression(input.time);
    case "weekdays":
      return createWeekdayCronExpression(input.time);
    case "weekly":
      return createWeeklyCronExpression(input.time, input.dayOfWeek);
    case "monthly":
      return createMonthlyCronExpression(input.time, input.dayOfMonth);
    case "yearly":
      return createYearlyCronExpression(input.time, input.month, input.dayOfMonth);
    case "custom":
      if (!isValidFiveFieldCronExpression(input.expression)) {
        throw new Error(`Invalid 5-field cron expression: "${input.expression}"`);
      }
      return normalizeCronExpression(input.expression);
  }
}

/** Maps an existing cron expression back to the closest repeat-picker preset. */
export function getCronPreset(expression: string): CronRepeatPreset {
  const parts = parseCronExpression(expression);
  if (isSimpleTime(parts) && isWildcard(parts.dayOfMonth) && isWildcard(parts.month) && parts.dayOfWeek === "1-5") {
    return "weekdays";
  }

  switch (getPresetLabel(parts)) {
    case "Daily":
      return "daily";
    case "Weekly":
      return "weekly";
    case "Monthly":
      return "monthly";
    case "Yearly":
      return "yearly";
    default:
      return "custom";
  }
}

/** Creates the default state for a repeat-picker form. */
export function getDefaultCronFormValues(): CronFormValues {
  return {
    repeat: "daily",
    hour: DEFAULT_TIME.hour,
    minute: DEFAULT_TIME.minute,
    dayOfWeek: 1,
    dayOfMonth: 1,
    month: 1,
    customExpression: createDailyCronExpression(DEFAULT_TIME),
  };
}

/** Converts UI form values into the structured builder input shape. */
export function cronFormValuesToInput(values: CronFormValues): CronBuilderInput {
  const time = normalizeTimeInput({ hour: values.hour, minute: values.minute });

  switch (values.repeat) {
    case "daily":
      return { repeat: "daily", time };
    case "weekdays":
      return { repeat: "weekdays", time };
    case "weekly":
      assertInRange(values.dayOfWeek, 0, 6, "dayOfWeek");
      return { repeat: "weekly", time, dayOfWeek: values.dayOfWeek };
    case "monthly":
      assertInRange(values.dayOfMonth, 1, 31, "dayOfMonth");
      return { repeat: "monthly", time, dayOfMonth: values.dayOfMonth };
    case "yearly":
      assertInRange(values.month, 1, 12, "month");
      assertInRange(values.dayOfMonth, 1, 31, "dayOfMonth");
      return { repeat: "yearly", time, month: values.month, dayOfMonth: values.dayOfMonth };
    case "custom":
      return { repeat: "custom", expression: normalizeCronExpression(values.customExpression) };
  }
}

/** Converts repeat-picker form values directly into a cron expression string. */
export function cronFormValuesToExpression(values: CronFormValues): string {
  return createCronExpression(cronFormValuesToInput(values));
}

/** Hydrates repeat-picker form values from an existing cron expression. */
export function cronExpressionToFormValues(expression: string): CronFormValues {
  const parsed = parseCronExpression(expression);
  return {
    repeat: getCronPreset(expression),
    hour: parseCronField("hour", parsed.hour) ?? DEFAULT_TIME.hour,
    minute: parseCronField("minute", parsed.minute) ?? DEFAULT_TIME.minute,
    dayOfWeek: parseCronField("dayOfWeek", parsed.dayOfWeek) ?? 1,
    dayOfMonth: parseCronField("dayOfMonth", parsed.dayOfMonth) ?? 1,
    month: parseCronField("month", parsed.month) ?? 1,
    customExpression: normalizeCronExpression(expression),
  };
}

/** Generates the human-readable preview text for the current repeat-picker state. */
export function getCronFormPreview(values: CronFormValues): string {
  return formatCronSummary(cronFormValuesToExpression(values));
}

/** Returns a human-readable time like "8:00" when hour and minute are simple values. */
export function getCronTimeOfDay(expression: string): string {
  const { minute, hour } = parseCronExpression(expression);
  const parsedMinute = parseCronField("minute", minute);
  const parsedHour = parseCronField("hour", hour);
  return parsedMinute === null || parsedHour === null ? "Various times" : formatExactTime(parsedHour, parsedMinute);
}

/** Returns a human-readable weekday label such as "Mondays" or "Mondays and Wednesdays". */
export function getCronDayOfWeek(expression: string): string {
  const parsedToken = parseDayToken(parseCronExpression(expression).dayOfWeek);
  if (!parsedToken || parsedToken.type === "wildcard") return "Every day";
  if (parsedToken.type === "single") return formatPluralDayName(parsedToken.value);
  if (parsedToken.type === "range") {
    return `${formatPluralDayName(parsedToken.start)} through ${formatPluralDayName(parsedToken.end)}`;
  }
  return joinWithAnd(parsedToken.values.map(formatPluralDayName));
}

/** Returns a human-readable day-of-month label like "1st" or "1st and 15th". */
export function getCronDayOfMonth(expression: string): string {
  return describeOrdinalField(parseCronExpression(expression).dayOfMonth);
}

/** Returns a human-readable month label like "January" or "January and June". */
export function getCronMonth(expression: string): string {
  return describeField("month", parseCronExpression(expression).month, MONTH_NAMES, "Recurring months", "Every month");
}

/** Formats more complex cron expressions into readable detail text for custom summaries. */
function getCustomCronDetails(expression: string): string {
  const parts = parseCronExpression(expression);
  const timeOfDay = getCronTimeOfDay(expression);
  const minuteStep = parseStepToken(parts.minute);
  const hourStep = parseStepToken(parts.hour);

  if (
    minuteStep &&
    minuteStep.base === "*" &&
    [parts.hour, parts.dayOfMonth, parts.month, parts.dayOfWeek].every(isWildcard)
  ) {
    return `every ${minuteStep.step} minutes`;
  }

  if (
    hourStep &&
    hourStep.base === "*" &&
    isSimpleValue("minute", parts.minute) &&
    [parts.dayOfMonth, parts.month, parts.dayOfWeek].every(isWildcard)
  ) {
    return `every ${hourStep.step} hours at minute ${parts.minute.padStart(2, "0")}`;
  }

  if (!isWildcard(parts.dayOfWeek) && isWildcard(parts.dayOfMonth) && isWildcard(parts.month)) {
    return customTimeSuffix(getCronDayOfWeek(expression), timeOfDay);
  }

  if (!isWildcard(parts.dayOfMonth) && isWildcard(parts.month) && isWildcard(parts.dayOfWeek)) {
    return customTimeSuffix(`on the ${getCronDayOfMonth(expression)}`, timeOfDay);
  }

  if (!isWildcard(parts.dayOfMonth) && !isWildcard(parts.month) && isWildcard(parts.dayOfWeek)) {
    return customTimeSuffix(`on ${getCronMonth(expression)} ${getCronDayOfMonth(expression)}`, timeOfDay);
  }

  return `minute ${parts.minute}, hour ${parts.hour}, day ${parts.dayOfMonth}, month ${parts.month}, weekday ${parts.dayOfWeek}`;
}

/** Classifies a cron expression into a simple repeat bucket for display and form hydration. */
export function getCronRepeatLabel(expression: string): string {
  return getPresetLabel(parseCronExpression(expression));
}

/** Builds the descriptive detail text that follows the high-level repeat label. */
export function getCronDetails(expression: string): string {
  const repeatLabel = getCronRepeatLabel(expression);
  const timeOfDay = getCronTimeOfDay(expression);

  switch (repeatLabel) {
    case "Every minute":
      return "Every minute";
    case "Hourly":
      return `at minute ${parseCronExpression(expression).minute.padStart(2, "0")}`;
    case "Daily":
      return timeOfDay === "Various times" ? "Every day" : `at ${timeOfDay}`;
    case "Weekly":
      return customTimeSuffix(getCronDayOfWeek(expression), timeOfDay);
    case "Monthly":
      return customTimeSuffix(`on the ${getCronDayOfMonth(expression)}`, timeOfDay);
    case "Yearly":
      return customTimeSuffix(`on ${getCronMonth(expression)} ${getCronDayOfMonth(expression)}`, timeOfDay);
    default:
      return getCustomCronDetails(expression);
  }
}

/** Builds the final UI summary, such as "Weekly - Mondays at 8:00". */
export function formatCronSummary(expression: string): string {
  const repeatLabel = getCronRepeatLabel(expression);
  const details = capitalizeFirstLetter(getCronDetails(expression));
  return repeatLabel === details ? repeatLabel : `${repeatLabel} - ${details}`;
}

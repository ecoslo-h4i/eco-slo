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
  | {
      repeat: "daily";
      time: CronTimeInput;
    }
  | {
      repeat: "weekdays";
      time: CronTimeInput;
    }
  | {
      repeat: "weekly";
      time: CronTimeInput;
      dayOfWeek: number;
    }
  | {
      repeat: "monthly";
      time: CronTimeInput;
      dayOfMonth: number;
    }
  | {
      repeat: "yearly";
      time: CronTimeInput;
      dayOfMonth: number;
      month: number;
    }
  | {
      repeat: "custom";
      expression: string;
    };

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

type ParsedDayToken =
  | { type: "single"; value: number }
  | { type: "list"; values: number[] }
  | { type: "range"; start: number; end: number }
  | { type: "wildcard" };

/** Normalizes cron whitespace so field splitting is predictable. */
function normalizeCronExpression(expression: string): string {
  return expression.trim().replace(/\s+/g, " ");
}

/** Returns true when a token is made of digits only. */
function isInteger(value: string): boolean {
  return /^\d+$/.test(value);
}

/** Checks whether a token matches one of the supported named month/day abbreviations. */
function isNamedValue(value: string, names: readonly string[]): boolean {
  return names.some((name) => name.slice(0, 3).toLowerCase() === value.toLowerCase());
}

/** Validates a single cron field, including lists, ranges, steps, wildcards, and named values. */
function isValidCronToken(token: string, min: number, max: number, names?: readonly string[]): boolean {
  if (token === "*") {
    return true;
  }

  if (token.includes("/")) {
    const [base, step] = token.split("/");
    return Boolean(base) && Boolean(step) && isValidCronToken(base, min, max, names) && isInteger(step);
  }

  if (token.includes(",")) {
    return token.split(",").every((part) => isValidCronToken(part, min, max, names));
  }

  if (token.includes("-")) {
    const [start, end] = token.split("-");
    return isValidCronValue(start, min, max, names) && isValidCronValue(end, min, max, names);
  }

  return isValidCronValue(token, min, max, names);
}

/** Validates one atomic cron value against numeric bounds or a list of allowed names. */
function isValidCronValue(value: string, min: number, max: number, names?: readonly string[]): boolean {
  if (isInteger(value)) {
    const numericValue = Number(value);
    return numericValue >= min && numericValue <= max;
  }

  return names ? isNamedValue(value, names) : false;
}

/** Converts a single numeric or named cron value into its numeric representation. */
function parseCronValue(value: string, names?: readonly string[]): number | null {
  if (isInteger(value)) {
    return Number(value);
  }

  const safeNames = names;
  if (!safeNames) {
    return null;
  }

  const matchedIndex = safeNames.findIndex((name) => name.slice(0, 3).toLowerCase() === value.toLowerCase());

  if (matchedIndex === -1) {
    return null;
  }

  if (safeNames === DAY_NAMES) {
    return matchedIndex;
  }

  return matchedIndex + 1;
}

/** Parses the day-of-week field into a richer structure for display formatting. */
function parseDayToken(token: string): ParsedDayToken | null {
  if (token === "*") {
    return { type: "wildcard" };
  }

  if (token.includes("/")) {
    return null;
  }

  if (token.includes(",")) {
    const values = token
      .split(",")
      .map((part) => parseCronValue(part, DAY_NAMES))
      .filter((value): value is number => value !== null)
      .map((value) => (value === 7 ? 0 : value));

    return values.length > 0 ? { type: "list", values } : null;
  }

  if (token.includes("-")) {
    const [start, end] = token.split("-");
    const parsedStart = parseCronValue(start, DAY_NAMES);
    const parsedEnd = parseCronValue(end, DAY_NAMES);

    if (parsedStart === null || parsedEnd === null) {
      return null;
    }

    return {
      type: "range",
      start: parsedStart === 7 ? 0 : parsedStart,
      end: parsedEnd === 7 ? 0 : parsedEnd,
    };
  }

  const parsedValue = parseCronValue(token, DAY_NAMES);
  if (parsedValue === null) {
    return null;
  }

  return { type: "single", value: parsedValue === 7 ? 0 : parsedValue };
}

/** Formats a number like 1, 2, 3 into 1st, 2nd, 3rd, etc. */
function ordinal(value: number): string {
  const remainder10 = value % 10;
  const remainder100 = value % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${value}st`;
  }
  if (remainder10 === 2 && remainder100 !== 12) {
    return `${value}nd`;
  }
  if (remainder10 === 3 && remainder100 !== 13) {
    return `${value}rd`;
  }
  return `${value}th`;
}

/** Joins human-readable lists with natural-language punctuation. */
function joinWithAnd(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

/** Converts a day index into a plural weekday label like "Mondays". */
function formatPluralDayName(dayIndex: number): string {
  const base = DAY_NAMES[dayIndex];
  return `${base}s`;
}

/** Formats a specific hour/minute pair as H:MM. */
function formatExactTime(hour: number, minute: number): string {
  return `${hour}:${minute.toString().padStart(2, "0")}`;
}

/** Throws when a numeric builder input is outside the allowed range. */
function assertInRange(value: number, min: number, max: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
}

/** Returns true when the cron field is the wildcard token. */
function isWildcard(value: string): boolean {
  return value === "*";
}

/** Returns true only for simple single-value fields that can be classified cleanly. */
function isSingleNumericValue(value: string, min: number, max: number, names?: readonly string[]): boolean {
  const parsedValue = parseCronValue(value, names);
  return parsedValue !== null && parsedValue >= min && parsedValue <= max;
}

/** Parses a field only when it is a single atomic value instead of a range, list, or step. */
function getSingleNumericValue(value: string, names?: readonly string[]): number | null {
  return value === "*" || value.includes(",") || value.includes("-") || value.includes("/")
    ? null
    : parseCronValue(value, names);
}

/** Parses a simple cron step token into its base and interval. */
function parseStepToken(token: string): { base: string; step: number } | null {
  if (!token.includes("/")) {
    return null;
  }

  const [base, rawStep] = token.split("/");
  if (!base || !rawStep || !isInteger(rawStep)) {
    return null;
  }

  return { base, step: Number(rawStep) };
}

/** Reassembles parsed cron fields back into a 5-field expression. */
function buildCronExpression(parts: CronParts): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
}

/** Uppercases the first character of a summary/detail string. */
function capitalizeFirstLetter(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

/** Validates and returns a normalized time input for cron builders. */
function normalizeTimeInput(time: CronTimeInput): CronTimeInput {
  assertInRange(time.hour, 0, 23, "hour");
  assertInRange(time.minute, 0, 59, "minute");
  return time;
}

/** Provides the default time used for new repeat-picker form state. */
function getDefaultTime(): CronTimeInput {
  return { hour: 8, minute: 0 };
}

/** Validates whether a string is a supported 5-field cron expression. */
export function isValidFiveFieldCronExpression(expression: string): boolean {
  const parts = normalizeCronExpression(expression).split(" ");
  if (parts.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  return (
    isValidCronToken(minute, 0, 59) &&
    isValidCronToken(hour, 0, 23) &&
    isValidCronToken(dayOfMonth, 1, 31) &&
    isValidCronToken(month, 1, 12, MONTH_NAMES) &&
    isValidCronToken(dayOfWeek, 0, 7, DAY_NAMES)
  );
}

/** Parses a validated 5-field cron expression into named fields. */
export function parseCronExpression(expression: string): CronParts {
  if (!isValidFiveFieldCronExpression(expression)) {
    throw new Error(`Invalid 5-field cron expression: "${expression}"`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = normalizeCronExpression(expression).split(" ");

  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  };
}

/** Builds a daily cron expression for a specific time. */
export function createDailyCronExpression(time: CronTimeInput): string {
  const normalizedTime = normalizeTimeInput(time);

  return buildCronExpression({
    minute: String(normalizedTime.minute),
    hour: String(normalizedTime.hour),
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
  });
}

/** Builds a Monday-through-Friday cron expression for a specific time. */
export function createWeekdayCronExpression(time: CronTimeInput): string {
  const normalizedTime = normalizeTimeInput(time);

  return buildCronExpression({
    minute: String(normalizedTime.minute),
    hour: String(normalizedTime.hour),
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "1-5",
  });
}

/** Builds a weekly cron expression for a specific weekday and time. */
export function createWeeklyCronExpression(time: CronTimeInput, dayOfWeek: number): string {
  const normalizedTime = normalizeTimeInput(time);
  assertInRange(dayOfWeek, 0, 6, "dayOfWeek");

  return buildCronExpression({
    minute: String(normalizedTime.minute),
    hour: String(normalizedTime.hour),
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: String(dayOfWeek),
  });
}

/** Builds a monthly cron expression for a specific day-of-month and time. */
export function createMonthlyCronExpression(time: CronTimeInput, dayOfMonth: number): string {
  const normalizedTime = normalizeTimeInput(time);
  assertInRange(dayOfMonth, 1, 31, "dayOfMonth");

  return buildCronExpression({
    minute: String(normalizedTime.minute),
    hour: String(normalizedTime.hour),
    dayOfMonth: String(dayOfMonth),
    month: "*",
    dayOfWeek: "*",
  });
}

/** Builds a yearly cron expression for a specific month, day, and time. */
export function createYearlyCronExpression(time: CronTimeInput, month: number, dayOfMonth: number): string {
  const normalizedTime = normalizeTimeInput(time);
  assertInRange(month, 1, 12, "month");
  assertInRange(dayOfMonth, 1, 31, "dayOfMonth");

  return buildCronExpression({
    minute: String(normalizedTime.minute),
    hour: String(normalizedTime.hour),
    dayOfMonth: String(dayOfMonth),
    month: String(month),
    dayOfWeek: "*",
  });
}

/** Converts calendar-style builder input into a cron expression. */
export function createCronExpression(input: CronBuilderInput): string {
  if (input.repeat === "daily") {
    return createDailyCronExpression(input.time);
  }

  if (input.repeat === "weekdays") {
    return createWeekdayCronExpression(input.time);
  }

  if (input.repeat === "weekly") {
    return createWeeklyCronExpression(input.time, input.dayOfWeek);
  }

  if (input.repeat === "monthly") {
    return createMonthlyCronExpression(input.time, input.dayOfMonth);
  }

  if (input.repeat === "yearly") {
    return createYearlyCronExpression(input.time, input.month, input.dayOfMonth);
  }

  if (!isValidFiveFieldCronExpression(input.expression)) {
    throw new Error(`Invalid 5-field cron expression: "${input.expression}"`);
  }

  return normalizeCronExpression(input.expression);
}

/** Maps an existing cron expression back to the closest repeat-picker preset. */
export function getCronPreset(expression: string): CronRepeatPreset {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parseCronExpression(expression);

  if (
    isSingleNumericValue(minute, 0, 59) &&
    isSingleNumericValue(hour, 0, 23) &&
    isWildcard(dayOfMonth) &&
    isWildcard(month) &&
    dayOfWeek === "1-5"
  ) {
    return "weekdays";
  }

  const repeatLabel = getCronRepeatLabel(expression);

  if (repeatLabel === "Daily") {
    return "daily";
  }

  if (repeatLabel === "Weekly") {
    return "weekly";
  }

  if (repeatLabel === "Monthly") {
    return "monthly";
  }

  if (repeatLabel === "Yearly") {
    return "yearly";
  }

  return "custom";
}

/** Creates the default state for a repeat-picker form. */
export function getDefaultCronFormValues(): CronFormValues {
  const defaultTime = getDefaultTime();

  return {
    repeat: "daily",
    hour: defaultTime.hour,
    minute: defaultTime.minute,
    dayOfWeek: 1,
    dayOfMonth: 1,
    month: 1,
    customExpression: createDailyCronExpression(defaultTime),
  };
}

/** Converts UI form values into the structured builder input shape. */
export function cronFormValuesToInput(values: CronFormValues): CronBuilderInput {
  const time = normalizeTimeInput({ hour: values.hour, minute: values.minute });

  if (values.repeat === "daily") {
    return { repeat: "daily", time };
  }

  if (values.repeat === "weekdays") {
    return { repeat: "weekdays", time };
  }

  if (values.repeat === "weekly") {
    assertInRange(values.dayOfWeek, 0, 6, "dayOfWeek");
    return { repeat: "weekly", time, dayOfWeek: values.dayOfWeek };
  }

  if (values.repeat === "monthly") {
    assertInRange(values.dayOfMonth, 1, 31, "dayOfMonth");
    return { repeat: "monthly", time, dayOfMonth: values.dayOfMonth };
  }

  if (values.repeat === "yearly") {
    assertInRange(values.month, 1, 12, "month");
    assertInRange(values.dayOfMonth, 1, 31, "dayOfMonth");
    return {
      repeat: "yearly",
      time,
      month: values.month,
      dayOfMonth: values.dayOfMonth,
    };
  }

  return {
    repeat: "custom",
    expression: normalizeCronExpression(values.customExpression),
  };
}

/** Converts repeat-picker form values directly into a cron expression string. */
export function cronFormValuesToExpression(values: CronFormValues): string {
  return createCronExpression(cronFormValuesToInput(values));
}

/** Hydrates repeat-picker form values from an existing cron expression. */
export function cronExpressionToFormValues(expression: string): CronFormValues {
  const preset = getCronPreset(expression);
  const parsed = parseCronExpression(expression);
  const hour = getSingleNumericValue(parsed.hour) ?? getDefaultTime().hour;
  const minute = getSingleNumericValue(parsed.minute) ?? getDefaultTime().minute;
  const dayOfWeek = getSingleNumericValue(parsed.dayOfWeek, DAY_NAMES) ?? 1;
  const dayOfMonth = getSingleNumericValue(parsed.dayOfMonth) ?? 1;
  const month = getSingleNumericValue(parsed.month, MONTH_NAMES) ?? 1;

  return {
    repeat: preset,
    hour,
    minute,
    dayOfWeek,
    dayOfMonth,
    month,
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
  const parsedMinute = getSingleNumericValue(minute);
  const parsedHour = getSingleNumericValue(hour);

  if (parsedMinute === null || parsedHour === null) {
    return "Various times";
  }

  return formatExactTime(parsedHour, parsedMinute);
}

/** Returns a human-readable weekday label such as "Mondays" or "Mondays and Wednesdays". */
export function getCronDayOfWeek(expression: string): string {
  const { dayOfWeek } = parseCronExpression(expression);
  const parsedToken = parseDayToken(dayOfWeek);

  if (!parsedToken || parsedToken.type === "wildcard") {
    return "Every day";
  }

  if (parsedToken.type === "single") {
    return formatPluralDayName(parsedToken.value);
  }

  if (parsedToken.type === "range") {
    return `${formatPluralDayName(parsedToken.start)} through ${formatPluralDayName(parsedToken.end)}`;
  }

  return joinWithAnd(parsedToken.values.map((value) => formatPluralDayName(value)));
}

/** Returns a human-readable day-of-month label like "1st" or "1st and 15th". */
export function getCronDayOfMonth(expression: string): string {
  const { dayOfMonth } = parseCronExpression(expression);

  if (isWildcard(dayOfMonth)) {
    return "Every day";
  }

  if (dayOfMonth.includes("/")) {
    return "Recurring days";
  }

  if (dayOfMonth.includes(",")) {
    const values = dayOfMonth
      .split(",")
      .map((value) => Number(value))
      .map((value) => ordinal(value));

    return joinWithAnd(values);
  }

  if (dayOfMonth.includes("-")) {
    const [start, end] = dayOfMonth.split("-").map((value) => Number(value));
    return `${ordinal(start)} through ${ordinal(end)}`;
  }

  return ordinal(Number(dayOfMonth));
}

/** Returns a human-readable month label like "January" or "January and June". */
export function getCronMonth(expression: string): string {
  const { month } = parseCronExpression(expression);

  if (isWildcard(month)) {
    return "Every month";
  }

  if (month.includes("/")) {
    return "Recurring months";
  }

  if (month.includes(",")) {
    const values = month
      .split(",")
      .map((value) => parseCronValue(value, MONTH_NAMES))
      .filter((value): value is number => value !== null)
      .map((value) => MONTH_NAMES[value - 1]);

    return joinWithAnd(values);
  }

  if (month.includes("-")) {
    const [start, end] = month.split("-");
    const parsedStart = parseCronValue(start, MONTH_NAMES);
    const parsedEnd = parseCronValue(end, MONTH_NAMES);

    if (parsedStart === null || parsedEnd === null) {
      return "Recurring months";
    }

    return `${MONTH_NAMES[parsedStart - 1]} through ${MONTH_NAMES[parsedEnd - 1]}`;
  }

  const parsedMonth = parseCronValue(month, MONTH_NAMES);
  return parsedMonth === null ? "Recurring months" : MONTH_NAMES[parsedMonth - 1];
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
    isWildcard(parts.hour) &&
    isWildcard(parts.dayOfMonth) &&
    isWildcard(parts.month) &&
    isWildcard(parts.dayOfWeek)
  ) {
    return `every ${minuteStep.step} minutes`;
  }

  if (
    hourStep &&
    hourStep.base === "*" &&
    isSingleNumericValue(parts.minute, 0, 59) &&
    isWildcard(parts.dayOfMonth) &&
    isWildcard(parts.month) &&
    isWildcard(parts.dayOfWeek)
  ) {
    return `every ${hourStep.step} hours at minute ${parts.minute.padStart(2, "0")}`;
  }

  if (!isWildcard(parts.dayOfWeek) && isWildcard(parts.dayOfMonth) && isWildcard(parts.month)) {
    const dayOfWeek = getCronDayOfWeek(expression);
    return timeOfDay === "Various times" ? dayOfWeek : `${dayOfWeek} at ${timeOfDay}`;
  }

  if (!isWildcard(parts.dayOfMonth) && isWildcard(parts.month) && isWildcard(parts.dayOfWeek)) {
    const dayOfMonth = getCronDayOfMonth(expression);
    return timeOfDay === "Various times" ? `on the ${dayOfMonth}` : `on the ${dayOfMonth} at ${timeOfDay}`;
  }

  if (!isWildcard(parts.dayOfMonth) && !isWildcard(parts.month) && isWildcard(parts.dayOfWeek)) {
    const month = getCronMonth(expression);
    const dayOfMonth = getCronDayOfMonth(expression);
    return timeOfDay === "Various times" ? `on ${month} ${dayOfMonth}` : `on ${month} ${dayOfMonth} at ${timeOfDay}`;
  }

  return `minute ${parts.minute}, hour ${parts.hour}, day ${parts.dayOfMonth}, month ${parts.month}, weekday ${parts.dayOfWeek}`;
}

/** Classifies a cron expression into a simple repeat bucket for display and form hydration. */
export function getCronRepeatLabel(expression: string): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parseCronExpression(expression);

  if (isWildcard(minute) && isWildcard(hour) && isWildcard(dayOfMonth) && isWildcard(month) && isWildcard(dayOfWeek)) {
    return "Every minute";
  }

  if (
    isSingleNumericValue(minute, 0, 59) &&
    isWildcard(hour) &&
    isWildcard(dayOfMonth) &&
    isWildcard(month) &&
    isWildcard(dayOfWeek)
  ) {
    return "Hourly";
  }

  if (
    isSingleNumericValue(minute, 0, 59) &&
    isSingleNumericValue(hour, 0, 23) &&
    isWildcard(dayOfMonth) &&
    isWildcard(month) &&
    isWildcard(dayOfWeek)
  ) {
    return "Daily";
  }

  if (
    isSingleNumericValue(minute, 0, 59) &&
    isSingleNumericValue(hour, 0, 23) &&
    isWildcard(dayOfMonth) &&
    isWildcard(month) &&
    !isWildcard(dayOfWeek)
  ) {
    return "Weekly";
  }

  if (
    isSingleNumericValue(minute, 0, 59) &&
    isSingleNumericValue(hour, 0, 23) &&
    !isWildcard(dayOfMonth) &&
    isWildcard(month) &&
    isWildcard(dayOfWeek)
  ) {
    return "Monthly";
  }

  if (
    isSingleNumericValue(minute, 0, 59) &&
    isSingleNumericValue(hour, 0, 23) &&
    !isWildcard(dayOfMonth) &&
    !isWildcard(month) &&
    isWildcard(dayOfWeek)
  ) {
    return "Yearly";
  }

  return "Custom";
}

/** Builds the descriptive detail text that follows the high-level repeat label. */
export function getCronDetails(expression: string): string {
  const repeatLabel = getCronRepeatLabel(expression);
  const timeOfDay = getCronTimeOfDay(expression);

  if (repeatLabel === "Every minute") {
    return "Every minute";
  }

  if (repeatLabel === "Hourly") {
    const { minute } = parseCronExpression(expression);
    return `at minute ${minute.padStart(2, "0")}`;
  }

  if (repeatLabel === "Daily") {
    return timeOfDay === "Various times" ? "Every day" : `at ${timeOfDay}`;
  }

  if (repeatLabel === "Weekly") {
    const dayOfWeek = getCronDayOfWeek(expression);
    return timeOfDay === "Various times" ? dayOfWeek : `${dayOfWeek} at ${timeOfDay}`;
  }

  if (repeatLabel === "Monthly") {
    const dayOfMonth = getCronDayOfMonth(expression);
    return timeOfDay === "Various times" ? `on the ${dayOfMonth}` : `on the ${dayOfMonth} at ${timeOfDay}`;
  }

  if (repeatLabel === "Yearly") {
    const month = getCronMonth(expression);
    const dayOfMonth = getCronDayOfMonth(expression);
    return timeOfDay === "Various times" ? `on ${month} ${dayOfMonth}` : `on ${month} ${dayOfMonth} at ${timeOfDay}`;
  }

  return getCustomCronDetails(expression);
}

/** Builds the final UI summary, such as "Weekly - Mondays at 8:00". */
export function formatCronSummary(expression: string): string {
  const repeatLabel = getCronRepeatLabel(expression);
  const details = capitalizeFirstLetter(getCronDetails(expression));

  return repeatLabel === details ? repeatLabel : `${repeatLabel} - ${details}`;
}

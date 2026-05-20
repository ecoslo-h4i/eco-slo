# Reminders Page Design Overhaul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Reminders page styling to match the Figma Hi-Fi wireframes without changing any functionality.

**Architecture:** CSS-only changes across the existing reminder component tree. No new components, no prop changes, no logic changes. All styling uses the existing Tailwind design tokens defined in `src/app/globals.css`.

**Tech Stack:** Next.js, React, Tailwind CSS v4 (via `@theme inline` tokens in globals.css)

---

## Figma Design Reference

**File:** `W4XrLoajadq9BtQCfgHdxL` — ECOSLO Wireframe, Hi-Fi page  
**Key frames:**

- View Weekly: `3073:13859` — canonical view-mode layout
- Create Monthly: `3126:27148` — canonical create/edit-mode layout
- Admin Dashboard: `3073:15978` — reminders widget on dashboard (out of scope)

## Design Token Reference

All colors below already exist in `src/app/globals.css`:

- Off-white panel bg: `bg-panel-bg` (#F2F0ED) = `bg-table-row-dark`
- Muted card bg (inactive cards, info boxes): `bg-table-header` (#EAE7E0)
- Border: `border-border` (#DEDBD2)
- Active pill: `bg-active-pill` (#E1E4D0) + `border-pill-border` (#C9CEAD)
- Inactive pill: `bg-danger-bg` (#EACECE) + `border-danger-border` (#DFAFAF)
- Primary green: `bg-primary` (#697751)
- Primary hover: `bg-primary-light` (#7B8963)
- Text dark: `text-text-dark` (#000000)
- Text muted: `text-text-muted` (#6A5F52)
- Text subtle (inactive card text): `text-text-subtle` (#7D7469)

## File Map

All changes are modifications to existing files (no new files):

| File                                                 | Responsibility                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/app/(admin)/reminders/page.tsx`                 | Page header — "New Reminder" button styling                                              |
| `src/components/reminders/RemindersList.tsx`         | Overview panel container                                                                 |
| `src/components/reminders/ReminderCard.tsx`          | Individual reminder card in overview list                                                |
| `src/components/reminders/ReminderView.tsx`          | Right panel — form layout, labels, toggle area arrangement, "Starts" box, variable chips |
| `src/components/reminders/ReminderDropdown.tsx`      | Dropdown field label font                                                                |
| `src/components/reminders/ReminderTextInput.tsx`     | Text input field label font                                                              |
| `src/components/reminders/ReminderTimePicker.tsx`    | Time picker label font                                                                   |
| `src/components/reminders/ReminderLongTextInput.tsx` | Message template label font + variable chips row                                         |
| `src/components/reminders/ReminderToggleArea.tsx`    | Toggle area sizing for side-by-side layout                                               |

---

### Task 1: Update Page Header — "New Reminder" Button

**Files:**

- Modify: `src/app/(admin)/reminders/page.tsx:84-90`

The Figma design shows the "New Reminder" button as a rounded rectangle (`rounded-lg`) with a `+` icon on the left, not the current pill shape with icon on right.

- [ ] **Step 1: Update the "New Reminder" button styling**

In `src/app/(admin)/reminders/page.tsx`, change the button from a pill to a rounded rectangle, move the icon to the left, and add the `+` icon prefix:

```tsx
import { Plus } from "lucide-react";

<button
  className="h-11 px-4 bg-primary rounded-lg text-white font-lato flex flex-row items-center justify-center gap-3 hover:bg-primary-light transition-colors duration-200 cursor-pointer"
  onClick={handleCreateReminder}
>
  <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
  <span>New Reminder</span>
</button>;
```

Key changes:

- `rounded-full` → `rounded-lg` (Figma shows `rounded-[8px]`)
- `w-40` removed (auto-width with padding)
- `h-10` → `h-11` (Figma shows 45px height)
- `gap-3` added, `ml-2` removed from image
- Icon moved before text (Figma shows `+` on left)
- Added `px-4` for horizontal padding

- [ ] **Step 2: Verify visually**

Run the dev server and navigate to `/reminders`. Confirm the button is a rounded rectangle with the `+` icon on the left.

- [ ] **Step 3: Commit**

```bash
git add src/app/(admin)/reminders/page.tsx
git commit -m "style: update New Reminder button to match Figma design"
```

---

### Task 2: Update ReminderCard Styling

**Files:**

- Modify: `src/components/reminders/ReminderCard.tsx:30-64`

The Figma design shows:

- Active cards: white bg, `rounded-[24px]`, `p-[24px]`, no border (except selected)
- Inactive cards: `bg-table-header` (#EAE7E0), `rounded-[24px]`, text color `text-text-subtle` (#7D7469) instead of `text-text-dark`
- Selected card: white bg with left green border (already correct)
- Name font: serif (Constantia), 20px, normal weight
- Assignees: Lato Heavy (bold), 16px, text-muted for active / text-subtle for inactive
- Schedule line: Lato Medium, 16px, same color as assignees

- [ ] **Step 1: Update the card container classes**

In `src/components/reminders/ReminderCard.tsx`, update the outer div:

```tsx
<div
  className={`flex w-full flex-col gap-4 rounded-3xl p-6 hover:cursor-pointer transition-colors duration-200 ${
    props.selected
      ? "bg-white border-l-4 border-l-primary border border-border"
      : props.is_active
        ? "bg-white hover:bg-active-pill"
        : "bg-table-header hover:bg-button-muted"
  }`}
  onClick={props.onClick}
>
```

Key changes:

- `rounded-2xl` → `rounded-3xl` (24px to match Figma)
- `gap-2` → `gap-4` (16px gap between sections in Figma)
- `px-4 py-4` → `p-6` (24px padding all around in Figma)

- [ ] **Step 2: Update the name text styling**

Change the name span to use serif font at 20px and handle inactive color:

```tsx
<span className={`font-serif font-normal text-xl ${props.is_active ? "text-text-dark" : "text-text-subtle"}`}>
  {props.name}
</span>
```

Key changes:

- `font-medium text-m` → `font-normal text-xl` (Figma: Constantia Regular 20px)
- Added inactive color `text-text-subtle` (#7D7469)

- [ ] **Step 3: Update assignees and schedule text for inactive state**

Update the assignees span:

```tsx
<span className={`text-m font-lato font-semibold ${props.is_active ? "text-text-muted" : "text-text-subtle"}`}>
  {props.assignees}
</span>
```

Update the schedule line div:

```tsx
<div
  className={`flex flex-row items-center text-m font-lato ${props.is_active ? "text-text-muted" : "text-text-subtle"}`}
>
  <Clock className="mr-1" size={16} />
  <span>{scheduleSummary[0]}</span>
  <Dot />
  <span>{scheduleSummary[1]}</span>
</div>
```

Key changes:

- Assignees: `text-sm` → `text-m`, added `font-semibold` (Figma: Lato Heavy 16px)
- Schedule: `text-sm` → `text-m` (Figma: Lato Medium 16px)
- Both get conditional `text-text-subtle` for inactive state
- Removed hardcoded `text-text-muted` from Clock and Dot (inherits from parent)

- [ ] **Step 4: Verify visually**

Check active and inactive cards match the Figma. Active cards should have white bg, inactive should be muted. Text colors should differ between active/inactive.

- [ ] **Step 5: Commit**

```bash
git add src/components/reminders/ReminderCard.tsx
git commit -m "style: update ReminderCard to match Figma Hi-Fi design"
```

---

### Task 3: Update Field Label Fonts Across Reminder Form Components

**Files:**

- Modify: `src/components/reminders/ReminderDropdown.tsx:31`
- Modify: `src/components/reminders/ReminderTextInput.tsx:12`
- Modify: `src/components/reminders/ReminderTimePicker.tsx:15`
- Modify: `src/components/reminders/ReminderLongTextInput.tsx:14`

In the Figma design, all field labels ("Type", "Assignees", "Repeats", "Time", "Day(s) of the Week", "Message Template") use the serif font (Constantia) at 20px — not Lato.

- [ ] **Step 1: Update ReminderDropdown label**

In `src/components/reminders/ReminderDropdown.tsx`, change:

```tsx
<span className="font-lato text-m font-normal">{props.label}</span>
```

to:

```tsx
<span className="font-serif text-xl font-normal">{props.label}</span>
```

- [ ] **Step 2: Update ReminderTextInput label**

In `src/components/reminders/ReminderTextInput.tsx`, change:

```tsx
<span className="font-lato text-m">{props.label}</span>
```

to:

```tsx
<span className="font-serif text-xl font-normal">{props.label}</span>
```

- [ ] **Step 3: Update ReminderTimePicker label**

In `src/components/reminders/ReminderTimePicker.tsx`, change:

```tsx
<span className="font-lato text-m font-normal">{props.label}</span>
```

to:

```tsx
<span className="font-serif text-xl font-normal">{props.label}</span>
```

- [ ] **Step 4: Update ReminderLongTextInput label**

In `src/components/reminders/ReminderLongTextInput.tsx`, change:

```tsx
<span className="font-lato text-m text-text-dark">{props.label}</span>
```

to:

```tsx
<span className="font-serif text-xl font-normal text-text-dark">{props.label}</span>
```

- [ ] **Step 5: Verify visually**

All field labels in the reminder form should now render in serif font at a larger size, matching the Figma wireframes.

- [ ] **Step 6: Commit**

```bash
git add src/components/reminders/ReminderDropdown.tsx src/components/reminders/ReminderTextInput.tsx src/components/reminders/ReminderTimePicker.tsx src/components/reminders/ReminderLongTextInput.tsx
git commit -m "style: use serif font for reminder form field labels per Figma"
```

---

### Task 4: Update ReminderView Layout — Remove "Schedule" Header, Restyle "Next Send" as "Starts" Box

**Files:**

- Modify: `src/components/reminders/ReminderView.tsx:255-322`

The Figma design does NOT have a "Schedule" section header — the Type/Assignees row flows directly into Repeats/Time. The "Next Send" box should be restyled as a "Starts" box that sits inline to the right of the day picker, not below the schedule fields.

- [ ] **Step 1: Remove the "Schedule" section header and flatten layout**

In `src/components/reminders/ReminderView.tsx`, replace the schedule section (lines 255-315) with a flat layout that removes the `<span>Schedule</span>` wrapper:

Replace:

```tsx
<div className="flex flex-col gap-4">
  <span className="font-serif text-m font-normal text-text-dark">Schedule</span>
  <div className="flex flex-row gap-4">
```

With:

```tsx
<div className="flex flex-col gap-4">
  <div className="flex flex-row gap-4">
```

This removes the "Schedule" label since the Figma design has Type/Assignees flowing directly into Repeats/Time without a section header.

- [ ] **Step 2: Move the "Starts" box inline with the day/date picker**

The Figma shows the "Starts" info box appearing to the right of the day-of-week picker (for weekly) or below the repeats row (for monthly/yearly). It should be inline in a row, not a standalone block.

Replace the current "Next Send" block and the weekly day picker section. For the weekly case, wrap the day picker and Starts box in a flex row:

Replace the entire block from the weekly conditional through the "Next Send" div (approximately lines 279-322) with:

```tsx
{
  form.repeat === "weekly" && (
    <div className="flex flex-row items-start gap-4">
      <div className="flex basis-1/2 flex-col gap-3">
        <span className="font-serif text-xl font-normal text-text-dark">Day(s) of the Week</span>
        <ReminderDropdown
          disabled={isReadOnly}
          label=""
          options={[...WEEK_DAYS]}
          placeholder="Select a day..."
          value={form.dayOfWeek}
          onOptionClick={(value) => updateForm("dayOfWeek", value)}
        />
      </div>
      <div className="flex basis-1/2 items-center gap-4 rounded-lg bg-table-header px-4 py-3 self-end">
        <div className="flex items-center rounded-lg bg-primary p-2">
          <Calendar className="text-white" size={24} />
        </div>
        <div className="flex flex-col gap-1 font-lato text-m">
          <span className="font-semibold text-text-dark">Starts</span>
          <span className="text-text-muted">{nextSendLabel}</span>
        </div>
      </div>
    </div>
  );
}

{
  form.repeat === "monthly" && (
    <div className="flex flex-col gap-1">
      <span className="font-lato text-m font-normal">Day of Month</span>
      <ReminderMonthlyDayPicker
        disabled={isReadOnly}
        value={form.dayOfMonth}
        onChange={(day) => updateForm("dayOfMonth", day)}
      />
    </div>
  );
}

{
  form.repeat === "yearly" && (
    <div className="flex flex-col gap-1">
      <span className="font-lato text-m font-normal">Date</span>
      <ReminderYearlyDatePicker
        disabled={isReadOnly}
        value={form.yearlyDate}
        onChange={(date) => updateForm("yearlyDate", date)}
      />
    </div>
  );
}

{
  form.repeat !== "weekly" && (
    <div className="flex items-center gap-4 rounded-lg bg-table-header px-4 py-3">
      <div className="flex items-center rounded-lg bg-primary p-2">
        <Calendar className="text-white" size={24} />
      </div>
      <div className="flex flex-col gap-1 font-lato text-m">
        <span className="font-semibold text-text-dark">Starts</span>
        <span className="text-text-muted">{nextSendLabel}</span>
      </div>
    </div>
  );
}
```

Also remove the old standalone "Next Send" block (lines 316-322):

```tsx
// DELETE this entire block:
<div className="flex h-25 shrink-0 flex-row items-center gap-3 rounded-3xl bg-table-header">
  <Calendar className="ml-4 text-primary" size={20} />
  <div className="flex flex-col gap-1 font-lato text-sm">
    <span className="text-text-dark">Next Send</span>
    <span className="text-text-muted">{nextSendLabel}</span>
  </div>
</div>
```

Key design differences from current:

- "Next Send" renamed to "Starts"
- Calendar icon is now inside a green square (`bg-primary rounded-lg p-2`)
- Box uses `rounded-lg` not `rounded-3xl`
- For weekly: sits to the right of the day picker
- For monthly/yearly: sits below the date picker
- Font sizes: label is `font-semibold`, value is regular — both `text-m`

- [ ] **Step 3: Verify visually**

Check all three repeat modes (weekly, monthly, yearly) to ensure the "Starts" box renders correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/reminders/ReminderView.tsx
git commit -m "style: remove Schedule header, restyle Next Send as Starts box per Figma"
```

---

### Task 5: Add Variable Chips Above Message Template Textarea

**Files:**

- Modify: `src/components/reminders/ReminderView.tsx` (near line 323, the ReminderLongTextInput usage)

The Figma design shows a row of variable chips (`{firstName}`, `{treeCount}`, `{surveyLink}`, `{treeNames}`) rendered as clickable pills above the message textarea. These are purely visual indicators of available variables — clicking them should insert the variable into the message.

- [ ] **Step 1: Add variable chips row above the message template**

In `src/components/reminders/ReminderView.tsx`, add a variable chips row before the `ReminderLongTextInput`. Replace:

```tsx
<ReminderLongTextInput
  disabled={isReadOnly}
  label="Message Template"
  sublabel="This is the message that will be sent to volunteers. You can use variables like {name} and {tree} to personalize the message."
  placeholder="Write a message..."
  value={form.message}
  onChange={(event) => updateForm("message", event.target.value)}
/>
```

With:

```tsx
<div className="flex flex-col gap-3">
  <span className="font-serif text-xl font-normal text-text-dark">Message Template</span>
  <div className="flex flex-row flex-wrap gap-2">
    {["{firstName}", "{treeCount}", "{surveyLink}", "{treeNames}"].map((variable) => (
      <span key={variable} className="rounded-full bg-table-header px-4 py-1 font-mono text-m text-text-muted">
        {variable}
      </span>
    ))}
  </div>
  <ReminderLongTextInput
    disabled={isReadOnly}
    label=""
    placeholder="Write a message..."
    value={form.message}
    onChange={(event) => updateForm("message", event.target.value)}
  />
</div>
```

Key design details:

- Variable chips: `rounded-full`, `bg-table-header` (#EAE7E0), `font-mono` (Courier Prime in Figma), `text-text-muted`
- The label is now rendered outside `ReminderLongTextInput` in serif font, so pass `label=""` to avoid duplicate
- Removed the `sublabel` since the variable chips serve as the visual guide

- [ ] **Step 2: Update ReminderLongTextInput to handle empty label gracefully**

In `src/components/reminders/ReminderLongTextInput.tsx`, wrap the label/sublabel rendering in a conditional so it doesn't render empty spans:

```tsx
export default function ReminderTextInput(props: ReminderLongTextInputProps) {
  return (
    <div className="flex flex-col w-full">
      {props.label && <span className="font-serif text-xl font-normal text-text-dark">{props.label}</span>}
      {props.sublabel && <span className="font-lato text-sm text-text-muted">{props.sublabel}</span>}
      <textarea
        className="w-full min-h-30 rounded-lg bg-white p-4 font-lato text-m font-normal focus:outline-none mt-2 disabled:bg-table-header disabled:text-text-dark disabled:opacity-100"
        defaultValue={props.value === undefined ? props.initialValue || "" : undefined}
        value={props.value}
        disabled={props.disabled}
        readOnly={props.disabled}
        placeholder={props.placeholder || ""}
        onChange={props.onChange}
        spellCheck="false"
      />
    </div>
  );
}
```

Note: also changed `rounded-3xl` → `rounded-lg` on the textarea to match Figma (`rounded-[8px]`).

- [ ] **Step 3: Verify visually**

Chips should appear as rounded pills in monospace font above the textarea.

- [ ] **Step 4: Commit**

```bash
git add src/components/reminders/ReminderView.tsx src/components/reminders/ReminderLongTextInput.tsx
git commit -m "style: add variable chips above message template per Figma"
```

---

### Task 6: Make Active Status and Survey Status Side-by-Side

**Files:**

- Modify: `src/components/reminders/ReminderView.tsx` (lines 331-346, the two ReminderToggleArea usages)
- Modify: `src/components/reminders/ReminderToggleArea.tsx`

The Figma design shows Active Status and Survey Status as two boxes sitting side by side in a row, not stacked vertically.

- [ ] **Step 1: Wrap the two toggle areas in a flex row**

In `src/components/reminders/ReminderView.tsx`, replace:

```tsx
<ReminderToggleArea
  disabled={isReadOnly}
  label="Active Status"
  checkedDescription="This reminder is currently active"
  uncheckedDescription="This reminder is currently inactive"
  checked={form.isActive}
  onChange={(value) => updateForm("isActive", value)}
/>
<ReminderToggleArea
  disabled={isReadOnly}
  label="Survey Status"
  checkedDescription="This reminder requires a survey"
  uncheckedDescription="This reminder does not require a survey"
  checked={form.needsSurvey}
  onChange={(value) => updateForm("needsSurvey", value)}
/>
```

With:

```tsx
<div className="flex flex-row gap-4">
  <div className="basis-1/2">
    <ReminderToggleArea
      disabled={isReadOnly}
      label="Active Status"
      checkedDescription="This reminder is currently active"
      uncheckedDescription="This reminder is currently inactive"
      checked={form.isActive}
      onChange={(value) => updateForm("isActive", value)}
    />
  </div>
  <div className="basis-1/2">
    <ReminderToggleArea
      disabled={isReadOnly}
      label="Survey Status"
      checkedDescription="This reminder requires a survey"
      uncheckedDescription="This reminder does not require a survey"
      checked={form.needsSurvey}
      onChange={(value) => updateForm("needsSurvey", value)}
    />
  </div>
</div>
```

- [ ] **Step 2: Update ReminderToggleArea to fill height and use rounded-lg**

In `src/components/reminders/ReminderToggleArea.tsx`, update the container:

```tsx
export default function RemiderToggleArea(props: ReminderToggleProps) {
  return (
    <div className="flex h-full min-h-20 shrink-0 flex-row items-center justify-between gap-3 rounded-lg bg-table-header px-4 py-3">
      <div className="flex flex-col gap-1 font-lato text-m">
        <span className="font-semibold text-text-dark">{props.label}</span>
        <span className="text-text-muted">{props.checked ? props.checkedDescription : props.uncheckedDescription}</span>
      </div>
      <div>
        <ToggleSwitch checked={props.checked} disabled={props.disabled} onChange={props.onChange} />
      </div>
    </div>
  );
}
```

Key changes:

- `rounded-3xl` → `rounded-lg` (Figma: `rounded-[8px]`)
- `h-20` → `h-full min-h-20` (fill the row height)
- `ml-4` / `mr-4` → `px-4 py-3` (consistent padding)
- Label: added `font-semibold` (Figma: Lato Heavy)
- `text-sm` → `text-m` (Figma: 16px)

- [ ] **Step 3: Verify visually**

Active Status and Survey Status should appear side by side, each taking half the width.

- [ ] **Step 4: Commit**

```bash
git add src/components/reminders/ReminderView.tsx src/components/reminders/ReminderToggleArea.tsx
git commit -m "style: place Active/Survey Status side by side per Figma"
```

---

### Task 7: Update ReminderView Header — Subtitle and Icon Placement

**Files:**

- Modify: `src/components/reminders/ReminderView.tsx:191-218`

The Figma design shows:

- In view mode: edit icon (pencil) on far right, delete (trash) icon to its left
- Subtitle shows "Type - Assignees" format (already matches)
- The header subtitle uses `text-text-muted` at 16px (already matches)

The current code already mostly matches but the Figma shows the trash icon only in create/edit mode (not view). Looking more carefully, the Figma "View Weekly" frame shows the edit icon (pencil) top-right, no trash icon. The "Create" and "Edit" frames show the trash icon.

This matches the current code behavior. No changes needed for icon placement.

- [ ] **Step 1: Verify the header matches Figma — no changes needed**

The header already matches the Figma design. Skip this task.

---

### Task 8: Update Input Field Border Radius

**Files:**

- Modify: `src/components/reminders/ReminderDropdown.tsx:36`
- Modify: `src/components/reminders/ReminderTextInput.tsx:14`
- Modify: `src/components/reminders/ReminderTimePicker.tsx:19`

The Figma design shows input fields with `rounded-[16px]` (rounded-2xl), not `rounded-full`. The current code uses `rounded-full` on all inputs.

- [ ] **Step 1: Update ReminderDropdown trigger border radius**

In `src/components/reminders/ReminderDropdown.tsx`, change:

```tsx
className =
  "flex flex-row items-center justify-between w-full h-10 rounded-full bg-white px-4 font-lato text-m focus:outline-none hover:cursor-pointer disabled:cursor-default disabled:bg-table-header disabled:opacity-100";
```

to:

```tsx
className =
  "flex flex-row items-center justify-between w-full h-10 rounded-2xl bg-white px-4 font-lato text-m focus:outline-none hover:cursor-pointer disabled:cursor-default disabled:bg-table-header disabled:opacity-100";
```

- [ ] **Step 2: Update ReminderTextInput border radius**

In `src/components/reminders/ReminderTextInput.tsx`, change:

```tsx
className =
  "w-full h-10 rounded-full bg-white px-4 font-lato text-m font-normal focus:outline-none disabled:bg-table-header disabled:text-text-dark disabled:opacity-100";
```

to:

```tsx
className =
  "w-full h-10 rounded-2xl bg-white px-4 font-lato text-m font-normal focus:outline-none disabled:bg-table-header disabled:text-text-dark disabled:opacity-100";
```

- [ ] **Step 3: Update ReminderTimePicker border radius**

In `src/components/reminders/ReminderTimePicker.tsx`, change:

```tsx
className =
  "w-full h-10 rounded-full bg-white px-4 pr-11 font-lato text-m font-normal text-text-dark selection:bg-primary selection:text-text-light focus:outline-none disabled:bg-table-header disabled:text-text-dark disabled:opacity-100 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";
```

to:

```tsx
className =
  "w-full h-10 rounded-2xl bg-white px-4 pr-11 font-lato text-m font-normal text-text-muted selection:bg-primary selection:text-text-light focus:outline-none disabled:bg-table-header disabled:text-text-dark disabled:opacity-100 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";
```

Note: also changed `text-text-dark` → `text-text-muted` on the time input since Figma shows the time value in muted brown (#6A5F52), not black.

- [ ] **Step 4: Verify visually**

All dropdowns, text inputs, and time pickers should now have softer rounded corners matching the Figma design.

- [ ] **Step 5: Commit**

```bash
git add src/components/reminders/ReminderDropdown.tsx src/components/reminders/ReminderTextInput.tsx src/components/reminders/ReminderTimePicker.tsx
git commit -m "style: update input field border radius to rounded-2xl per Figma"
```

---

### Task 9: Final Visual Audit

- [ ] **Step 1: Side-by-side comparison**

Run the dev server and compare each state against the Figma screenshots:

1. View mode (click an existing reminder) — compare against frame `3073:13859`
2. Create mode (click "New Reminder") — compare against frame `3126:27148`
3. Edit mode (click pencil icon on a viewed reminder)
4. Check both active and inactive reminder cards in the overview list

- [ ] **Step 2: Fix any remaining discrepancies**

Address any spacing, color, or font issues found during the audit.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "style: final visual polish for reminders page Figma alignment"
```

---
version: alpha
name: ECOSLO-design-system
description: >
  A calm, civic environmental management interface for ECOSLO tree adoption,
  volunteer coordination, reminders, tasks, and map workflows. The product uses
  a natural institutional palette, serif page titles, rounded off-white surfaces,
  and Lato-based utility typography. The interface should feel local,
  trustworthy, organic, quiet, and operational rather than flashy or tech-heavy.

fonts:
  display: "Constantia, Georgia, 'Times New Roman', serif"
  body: "Lato, Nunito Sans, system-ui, sans-serif"
  ui: "Lato, Nunito Sans, system-ui, sans-serif"

colors:
  black: "#000000"
  white: "#FFFFFF"

  off-white: "#F2F0ED"
  off-white-2: "#EAE7E0"
  off-white-3: "#DEDBD2"

  green: "#879471"
  green-2: "#7B8963"
  dark-green: "#697751"

  light-green: "#E1E4D0"
  light-green-2: "#C9CEAD"

  brown: "#7D7469"
  dark-brown: "#6A5F52"

  red: "#B45F5F"
  light-red: "#EACECE"
  light-red-2: "#DFAFAF"

  blue: "#5F7C8C"
  light-blue: "#D2DEE4"
  light-blue-2: "#B1C6D1"

semanticColors:
  page-bg: "{colors.off-white}"
  app-bg: "{colors.white}"
  panel-bg: "{colors.off-white}"
  card-bg: "{colors.white}"
  muted-card-bg: "{colors.off-white-2}"
  disabled-bg: "{colors.off-white-3}"

  primary: "{colors.dark-green}"
  primary-hover: "{colors.green-2}"
  primary-soft: "{colors.light-green}"
  primary-border: "{colors.light-green-2}"
  on-primary: "{colors.white}"

  text: "{colors.black}"
  text-muted: "{colors.dark-brown}"
  text-subtle: "{colors.brown}"
  border: "{colors.off-white-3}"
  border-strong: "{colors.brown}"

  success: "{colors.dark-green}"
  success-bg: "{colors.light-green}"
  success-border: "{colors.light-green-2}"
  danger: "{colors.red}"
  danger-bg: "{colors.light-red}"
  danger-border: "{colors.light-red-2}"
  info: "{colors.blue}"
  info-bg: "{colors.light-blue}"
  info-border: "{colors.light-blue-2}"

typography:
  page-title:
    fontFamily: "{fonts.display}"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.02em
  page-title-large:
    fontFamily: "{fonts.display}"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.025em
  section-title:
    fontFamily: "{fonts.display}"
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.01em
  card-title:
    fontFamily: "{fonts.display}"
    fontSize: 23px
    fontWeight: 400
    lineHeight: 1.25
  detail-title:
    fontFamily: "{fonts.display}"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.1
  field-label:
    fontFamily: "{fonts.display}"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.2
  body-lg:
    fontFamily: "{fonts.body}"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.45
  body-md:
    fontFamily: "{fonts.body}"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "{fonts.body}"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  body-xs:
    fontFamily: "{fonts.body}"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
  button:
    fontFamily: "{fonts.ui}"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1
  nav-label:
    fontFamily: "{fonts.ui}"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.2
  table-header:
    fontFamily: "{fonts.ui}"
    fontSize: 16px
    fontWeight: 800
    lineHeight: 1.25
  table-cell:
    fontFamily: "{fonts.ui}"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
  metadata:
    fontFamily: "{fonts.ui}"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.35

spacing:
  0: 0px
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  20: 80px
  24: 96px

radii:
  none: 0px
  xs: 6px
  sm: 10px
  md: 14px
  lg: 18px
  xl: 24px
  pill: 999px
  circle: 50%

borders:
  hairline: "1px solid {semanticColors.border}"
  strong: "1px solid {semanticColors.border-strong}"
  active: "1px solid {semanticColors.primary-border}"

shadows:
  none: "none"
  soft: "0 2px 6px rgba(0, 0, 0, 0.12)"
  panel: "0 1px 4px rgba(0, 0, 0, 0.10)"
  map-control: "0 2px 6px rgba(0, 0, 0, 0.18)"

layout:
  sidebar-width: 160px
  sidebar-icon-tile: 112px
  header-height: 140px
  topbar-height: 110px
  content-max-width: 1600px
  page-gutter: 48px
  panel-padding: 24px
  card-padding: 28px
  dense-card-padding: 18px
  form-column-gap: 24px
  form-row-gap: 28px
  map-drawer-width: 405px

components:
  primary-button:
    backgroundColor: "{semanticColors.primary}"
    color: "{semanticColors.on-primary}"
    border: "none"
    borderRadius: "{radii.pill}"
    padding: "12px 24px"
    typography: "{typography.button}"
  secondary-button:
    backgroundColor: "transparent"
    color: "{semanticColors.text-muted}"
    border: "1px solid {semanticColors.border-strong}"
    borderRadius: "{radii.pill}"
    padding: "10px 24px"
    typography: "{typography.body-md}"
  white-pill-button:
    backgroundColor: "{colors.white}"
    color: "{colors.black}"
    border: "none"
    borderRadius: "{radii.pill}"
    padding: "12px 28px"
    typography: "{typography.button}"
  panel:
    backgroundColor: "{semanticColors.panel-bg}"
    border: "{borders.hairline}"
    borderRadius: "{radii.lg}"
    padding: "{layout.panel-padding}"
    shadow: "{shadows.panel}"
  card:
    backgroundColor: "{semanticColors.card-bg}"
    border: "none"
    borderRadius: "{radii.xl}"
    padding: "{layout.card-padding}"
  muted-card:
    backgroundColor: "{semanticColors.muted-card-bg}"
    border: "none"
    borderRadius: "{radii.xl}"
    padding: "{layout.card-padding}"
  input:
    backgroundColor: "{colors.white}"
    color: "{semanticColors.text-muted}"
    border: "none"
    borderRadius: "{radii.pill}"
    padding: "10px 18px"
    typography: "{typography.body-md}"
  search-input:
    backgroundColor: "{colors.white}"
    color: "{semanticColors.text-muted}"
    border: "1px solid {semanticColors.border}"
    borderRadius: "{radii.pill}"
    padding: "12px 24px"
    typography: "{typography.body-md}"
  select:
    backgroundColor: "{colors.white}"
    color: "{semanticColors.text-muted}"
    border: "none"
    borderRadius: "{radii.pill}"
    padding: "10px 18px"
    typography: "{typography.body-md}"
  status-active:
    backgroundColor: "{semanticColors.success-bg}"
    color: "{semanticColors.success}"
    border: "1px solid {semanticColors.success-border}"
    borderRadius: "{radii.pill}"
    padding: "8px 16px"
    typography: "{typography.body-sm}"
  status-inactive:
    backgroundColor: "{semanticColors.danger-bg}"
    color: "{semanticColors.danger}"
    border: "1px solid {semanticColors.danger-border}"
    borderRadius: "{radii.pill}"
    padding: "8px 16px"
    typography: "{typography.body-sm}"
  status-private:
    backgroundColor: "{semanticColors.info-bg}"
    color: "{semanticColors.info}"
    border: "1px solid {semanticColors.info-border}"
    borderRadius: "{radii.pill}"
    padding: "8px 16px"
    typography: "{typography.body-sm}"
---

# ECOSLO Design System

## Overview

ECOSLO is an environmental civic operations app for trees, volunteers, reminders, tasks, maps, and adoption workflows. The interface should look like a refined nonprofit field-management system: calm, grounded, local, accessible, and lightly organic.

The visual identity is built around a muted sage-green sidebar, off-white canvas, rounded cards, pill controls, serif page titles, and Lato-based operational text. Avoid modern SaaS flashiness. The UI should feel like a trustworthy public-facing environmental tool with enough structure for admin workflows.

## Image Analysis Summary

### Reminders Page

The reminders page uses a fixed green left sidebar, large Constantia page title, white header area, and a two-column content layout. The left column is an overview panel containing reminder cards. Active reminders use white cards with a pale green active badge. Inactive reminders use muted off-white cards with faded brown text and pink-red badges. The right column is a large editor panel with field labels in Constantia, pill-shaped inputs and selects, a beige start-date strip, token chips, a large white message textarea, toggle cards, and pill action buttons.

### Public Map Page

The map page uses a horizontal green top bar instead of the admin sidebar. The canvas is mostly off-white with floating white controls. Tree markers use the primary sage green and a white tree icon. The selected marker has a white circular ring and drop shadow. A right-side drawer uses a white background, large Constantia tree title, small status pills, stacked off-white information cards, and full-width pill buttons at the bottom.

### Tasks Page

The tasks page uses the admin sidebar and a large Constantia page title. Filters sit in a rounded off-white panel. Search is a full-width white pill input. Segmented controls use primary green for selected states and white/off-white for inactive states. Task cards are wide rounded rectangles, mostly muted off-white, with Constantia card titles and Lato metadata. Completed cards use a darker muted background, reduced emphasis, and a pale green completed badge.

### Volunteers Page

The volunteers page uses a wider desktop layout with the same admin sidebar. The page title is extra large and bold. The top filter panel combines search with role filter pills. The volunteer list is a bordered, rounded table. Table headers use bold Lato, rows alternate between white and off-white, and badges use subdued semantic fills. Pagination is contained inside a muted footer row with rounded page controls.

### Color Palette

The palette is highly constrained and should remain so. The main brand colors are muted greens, not bright greens. Off-whites and warm grays create the product’s calm organic foundation. Red and blue are reserved for semantic states only. Black and white are used sparingly for contrast, text, cards, and controls.

## Design Principles

1. Use Constantia for page titles, panel headings, field labels, and card titles.
2. Use Lato for navigation, buttons, tables, metadata, inputs, forms, and body copy.
3. Use sage green as the primary brand color and selected state color.
4. Use off-white surfaces instead of pure gray.
5. Prefer rounded panels, cards, chips, and pill controls.
6. Use borders and surface contrast more than shadows.
7. Keep layouts spacious and calm, with strong alignment and generous gutters.
8. Avoid decorative gradients, neon colors, glassmorphism, and heavy SaaS shadows.

## Color Usage

### Core Neutrals

Use `#F2F0ED` as the default page canvas. Use `#FFFFFF` for cards, input fields, selected high-emphasis cards, drawer surfaces, and table rows. Use `#EAE7E0` and `#DEDBD2` for muted panels, disabled/completed states, table striping, dividers, and form helper areas.

### Greens

Use `#697751` for primary buttons, selected filter pills, sidebar background, map pins, active nav states, and important active controls. Use `#879471` and `#7B8963` for secondary green surfaces, marker variants, hover states, and supporting brand blocks. Use `#E1E4D0` and `#C9CEAD` for active badges, selected dropdown rows, soft chips, and positive state backgrounds.

### Browns

Use `#6A5F52` and `#7D7469` for muted text, metadata, inactive labels, dividers, and earthy low-emphasis UI elements. Brown should support the warm natural tone but should not replace black for primary readability.

### Red and Blue

Use red only for inactive, destructive, delete, or issue states. Use blue only for private/info states. Never use red or blue as decorative accent colors.

## Typography

### Font Pairing

Constantia is the brand and structure font. It gives the app its civic, editorial, environmental character. Use it for titles and important labels only.

Lato is the operational interface font. Use it for everything users scan, click, search, filter, sort, or edit.

### Hierarchy

Page titles should be large, black, and visually dominant. Admin pages generally use 56px Constantia. The volunteer page can use a larger 64px title on wide desktop screens. Avoid making page titles light or small.

Section headings, detail drawer titles, card titles, and form field labels should use Constantia. Body copy, table text, search placeholders, metadata, buttons, nav labels, badges, pagination, dropdowns, and form inputs should use Lato.

### Title Underline Accent

Some admin title states may use a thin blue underline highlight beneath part of the word, as seen on the Reminders page. Treat this as an occasional prototype artifact or optional active-title flourish. Do not use it globally unless a page mockup specifically includes it.

## Layout System

### Admin App Shell

Use a fixed left sidebar on desktop.

- Width: 160px.
- Background: `#7B8963` or `#697751`.
- Logo at the top with generous spacing.
- White pill log-out button below the logo.
- Navigation items stacked vertically with large white outline icons.
- Active nav item sits in a translucent lighter green rounded square/tile.
- Nav labels use Lato bold, centered under icons.

The main content area starts to the right of the sidebar. Use a white header band for the page title and top actions, separated from content by a subtle off-white border.

### Public Map Shell

Use a full-width green top bar instead of the left sidebar for public map views.

- Top bar height: about 110px.
- Logo aligned left.
- Login button aligned right as a white pill.
- Map canvas fills below top bar.
- Right detail drawer overlays or docks to the map.

### Page Gutters

Use generous horizontal padding: 48px on desktop admin pages and 32px on narrower screens. Panels should not touch the viewport edge except for intentional app shell elements such as sidebars, top bars, or map canvases.

### Panels and Cards

Major filter/editor/table containers use off-white panel backgrounds with subtle borders and 18px radius. Interior cards use either white for active/high-emphasis content or off-white-2/off-white-3 for inactive, completed, or lower-emphasis content.

## Components

### Sidebar

The sidebar is a primary brand element and should remain visually consistent across admin screens.

- Background: `#7B8963` or `#697751`.
- Icon color: white or off-white.
- Label color: white or off-white.
- Active item background: rgba-like lighter green, visually close to `#879471`.
- Active item radius: 14px.
- Do not add borders between nav items.
- Keep icons large, simple, and outline-based.

### Header

Admin headers are white with a large Constantia page title aligned left. Primary actions such as “New Reminder” or “Add Volunteer” sit at the top right as green pill buttons.

Use a subtle bottom divider in `#EAE7E0` or `#DEDBD2`.

### Buttons

Primary buttons are green pills with white Lato bold text. Use them for actions like Create Reminder, Add Volunteer, Report an Issue, and selected filter states.

Secondary buttons are outlined or off-white pills with muted brown or black text. Use them for Cancel, Close, inactive segmented controls, and lower-priority actions.

Icon buttons should be circular or pill-based and use simple line icons. Delete actions should use red iconography without large red fills unless the action is destructive and confirmed.

### Search Inputs

Search inputs are white pills with a left search icon and muted placeholder text.

- Height: 46-56px depending on page density.
- Radius: pill.
- Border: subtle `#DEDBD2` when on white; no visible border when inside an off-white panel.
- Placeholder: Lato, muted brown.

### Filter Pills and Segmented Controls

Selected filters use dark green background with white text. Inactive filters use white or off-white backgrounds with black text and subtle borders. Keep the radius pill-shaped.

Dropdown rows should use pale green selected states with a checkmark aligned right.

### Cards

Active cards use white backgrounds and high-contrast text. Inactive or completed cards use muted off-white backgrounds and lower-contrast brown text.

Reminder and task cards should be large, rounded, and spacious. Titles use Constantia. Metadata uses Lato with small icons.

### Badges

Badges are rounded pills with soft backgrounds and semantic text.

- Active: pale green background, dark green text.
- Inactive: light red background, red text.
- Private/info: light blue background, blue text.
- Completed: light green background, dark green text.
- Role badges: off-white or pale green, depending on role emphasis.

Badges should not be saturated or loud.

### Forms

Form panels should feel calm and editorial, not dense.

- Labels: Constantia, 22px.
- Inputs/selects: white pill fields.
- Use two-column layout on desktop.
- Use full-width stacked fields on mobile.
- Textareas are white rounded rectangles with Lato text.
- Token chips are small off-white pills with monospace-like placeholder labels only if necessary; otherwise use Lato.

### Toggles

Toggles use muted panel cards with text on the left and a green switch on the right. Active toggle tracks are dark green. Knobs are white. Keep toggle cards rounded and aligned with form grid columns.

### Tables

Tables appear inside a rounded container with a border. Headers use a muted off-white background and bold Lato. Rows alternate between white and off-white. Text should be Lato bold or medium for scanability. Use badges inside cells for roles and assigned tree numbers.

Pagination sits in a muted footer row. Pagination controls are rounded small square buttons with subtle borders.

### Map Controls

Map controls float above the map as white rounded panels with soft shadows.

- Zoom control: vertical white pill/rounded rectangle with plus and minus icons.
- Search/filter control: larger floating white rounded panel.
- Map pins: green teardrop markers with white tree icons.
- Selected pin: green marker with a white inner circular ring and stronger shadow.

### Map Detail Drawer

The map detail drawer is a white right-side panel around 405px wide on desktop.

- Title: Constantia, 30px.
- Close icon: black, top right.
- Status pills below title.
- Information blocks are off-white rounded cards.
- Each block title uses Constantia uppercase or small title styling.
- Body text uses Lato.
- Bottom action buttons are full-width pills.

## Page Patterns

### Reminders Page Pattern

Use a two-column layout inside the content area.

- Left overview panel: about one-third width.
- Right editor panel: about two-thirds width.
- Reminder list cards stack vertically with 24px gaps.
- Editor sections use dividers and form grids.
- Primary submit and cancel buttons sit side by side at the bottom.

### Tasks Page Pattern

Use a top filter panel followed by a task-list panel.

- Search spans full width.
- Status segmented control sits left.
- Assignee and survey dropdowns sit to the right.
- Task cards are full-width rounded rectangles.
- Completed tasks are visually muted and may show a completed badge aligned right.

### Volunteers Page Pattern

Use a wide desktop data-management layout.

- Header title left, Add Volunteer button right.
- Filter panel below title with search and role pills.
- Table container below with rounded corners.
- Header row and pagination footer use muted backgrounds.
- Row height should be generous, around 72px.

### Map Page Pattern

Use an immersive map canvas.

- Public top bar instead of admin sidebar.
- Floating controls top left.
- Tree detail drawer right.
- Keep map background minimal and off-white when no map tiles are shown.
- Use green tree markers consistently.

## Interaction States

### Hover

Primary buttons should slightly lighten to `#7B8963` or darken depending on contrast. Cards may subtly raise with a soft shadow only if clickable. Avoid dramatic scaling.

### Focus

Inputs, selects, and buttons should show an accessible green or brown focus ring. Use a 2px outline offset by 2px. Do not rely only on color changes.

### Disabled

Disabled or inactive items use off-white-3 backgrounds, muted brown text, and reduced opacity. Do not use pure gray.

### Selected

Selected filters, nav items, map markers, and dropdown rows should use green backgrounds or pale green fills depending on emphasis.

## Responsive Behavior

### Desktop

Use the full admin sidebar. Maintain generous page gutters and two-column layouts where shown in the mocks. Tables may use horizontal space fully.

### Tablet

Sidebar may remain if space allows, but reduce page gutters to 32px. Two-column form layouts may remain until content becomes cramped. Volunteer table may horizontally scroll inside its rounded container.

### Mobile

Collapse the sidebar into a bottom nav or hamburger drawer. Stack all form columns and page panels vertically. Use smaller page titles around 40px. Convert tables into card lists or horizontally scrollable tables. Map drawer should become a bottom sheet with rounded top corners.

## Accessibility

Maintain readable contrast between black text and off-white/white backgrounds. Use semantic colors consistently and never communicate status by color alone; pair status color with text labels like Active, Private, Completed, or Inactive.

All interactive controls should have clear focus states. Touch targets should be at least 44px tall. Icons should include accessible labels when they are buttons.

## Do's

- Use Constantia for large page titles and important headings.
- Use Lato for operational UI text.
- Use sage green for primary actions, selected states, sidebars, and map markers.
- Use off-white backgrounds instead of cool gray.
- Use rounded cards, panels, chips, and pill buttons.
- Use soft semantic badges for status.
- Keep spacing generous and layouts calm.
- Use simple line icons that match the mockups.
- Keep tables structured and lightly bordered.
- Make selected map markers visibly distinct with a white ring.

## Don'ts

- Do not introduce bright greens, neon colors, or saturated SaaS gradients.
- Do not use blue except for private/info states.
- Do not use red except for inactive/destructive/issue states.
- Do not use heavy drop shadows on standard cards.
- Do not replace Constantia page titles with sans-serif titles.
- Do not use sharp-cornered cards or rectangular buttons.
- Do not make the UI overly dense.
- Do not add borders between sidebar nav items.
- Do not use generic gray surfaces when warm off-whites are available.
- Do not use multiple competing accent colors on one screen.

## Agent Prompt Guide

When generating UI for this app, match the provided mockups closely. Use the exact color tokens from this file, Constantia for headings, and Lato for body/interface text. Build admin pages with a fixed sage-green sidebar, large serif page titles, white/off-white content surfaces, rounded panels, pill controls, soft badges, and spacious card-based layouts. Build public map pages with a horizontal sage-green top bar, floating white map controls, green tree markers, and a right-side white detail drawer.

Prefer semantic tokens such as `primary`, `panel-bg`, `card-bg`, `text-muted`, `success-bg`, and `danger-bg` over raw hex values. Preserve the restrained environmental visual language. Every new screen should feel like it belongs to the Reminders, Tasks, Volunteers, and Map mockups.

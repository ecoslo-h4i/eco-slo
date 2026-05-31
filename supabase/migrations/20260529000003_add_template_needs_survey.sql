-- =============================================================================
-- ECOSLO: templates.needs_survey
-- =============================================================================
-- Mirrors the existing `type` passthrough: a template now also carries a
-- needs_survey default that the reminder form copies onto a reminder when the
-- template is selected. Existing templates backfill to false via the default,
-- matching reminders.needs_survey.
--
-- Note: needs_survey only affects 'Other' reminders. Watering/Mulching tasks
-- are always survey-backed (one survey per tree) in fire_reminder regardless
-- of this flag, and the reminder form locks the survey toggle on for them.
-- =============================================================================

alter table "public"."templates"
  add column "needs_survey" boolean not null default false;

comment on column "public"."templates"."needs_survey" is
  'Default survey requirement copied onto reminders created from this template. Ignored for Watering/Mulching (always survey-backed).';

-- =============================================================================
-- ECOSLO: surveys — replace the jsonb body with explicit columns
-- =============================================================================
-- Decision record:
--   surveys.body was designed as a flexible jsonb payload, but the shape froze
--   immediately: every writer goes through one typed builder with exactly five
--   fields, and every reader displays those same five. The flexibility was
--   never exercised, while the costs were real — the database validated
--   nothing (any JSON object was accepted), every reader had to guard against
--   missing keys, and filtering/reporting required json operators. With the
--   Surveys dashboard adding table columns, filters, search, and CSV export
--   over these fields, explicit columns are the cheaper long-term shape:
--     * issue          "SurveyIssue" enum — DB-validated category
--     * issue_other    text               — free-text detail when issue = other
--     * image_link     text               — URL string; binary images not stored
--     * notes          text               — free-form notes from the submitter
--     * admin_contact  boolean            — "may an administrator contact you?"
--
-- Backfill notes:
--   * Recognized issue values cast to the enum; unrecognized non-null values
--     map to 'other' with the original text preserved in issue_other.
--   * Legacy conceptual key names from SPECDOC (otherIssueText, needsContact)
--     are coalesced in case any historical rows used them.
--   * Rows with no parsable issue keep issue = NULL (rendered "N/A" in UI).
--
-- This migration DROPS surveys.body after the backfill. 
-- =============================================================================

do $$
begin
  create type public."SurveyIssue" as enum
    ('watering', 'mulching', 'pest_damage', 'structural', 'signage', 'other');
exception
  when duplicate_object then null;
end $$;

alter table public.surveys
  add column if not exists issue public."SurveyIssue",
  add column if not exists issue_other text,
  add column if not exists image_link text,
  add column if not exists notes text,
  add column if not exists admin_contact boolean not null default false;

update public.surveys
set
  issue = case
    when body->>'issue' in ('watering', 'mulching', 'pest_damage', 'structural', 'signage', 'other')
      then (body->>'issue')::public."SurveyIssue"
    when body->>'issue' is not null then 'other'::public."SurveyIssue"
    else null
  end,
  issue_other = coalesce(
    nullif(trim(coalesce(body->>'issueOther', body->>'otherIssueText')), ''),
    -- Preserve unrecognized issue values instead of silently dropping them.
    case
      when body->>'issue' is not null
        and body->>'issue' not in ('watering', 'mulching', 'pest_damage', 'structural', 'signage', 'other')
        then body->>'issue'
      else null
    end
  ),
  image_link = nullif(trim(body->>'imageLink'), ''),
  notes = nullif(trim(body->>'notes'), ''),
  admin_contact = coalesce(
    lower(coalesce(body->>'adminContact', body->>'needsContact')) = 'true',
    false
  );

comment on column public.surveys.issue is
  'Survey issue category, DB-validated by the SurveyIssue enum. NULL only on legacy rows migrated without a recognizable issue.';
comment on column public.surveys.issue_other is
  'Free-text description when issue = other.';
comment on column public.surveys.image_link is
  'Optional http(s) URL supplied by the submitter; binary images are not stored.';
comment on column public.surveys.notes is
  'Free-form notes from the submitter.';
comment on column public.surveys.admin_contact is
  'Whether the submitter agreed to be contacted by an administrator.';

alter table public.surveys drop column if exists body;

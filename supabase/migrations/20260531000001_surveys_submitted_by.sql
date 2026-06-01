-- =============================================================================
-- ECOSLO: surveys.submitted_by — record who completed a survey
-- =============================================================================
-- Surveys ask "May an administrator contact you?" but stored no respondent
-- identity, so a "yes" left admins unsure who to reach. This adds a nullable
-- submitted_by FK auto-stamped with the authenticated member via the column
-- default (current_member_id() reads auth.uid()), which means:
--   * the survey insert route needs no change and the client cannot spoof it,
--   * the tree detail view can join the submitter's live contact info, and
--   * an admin completing a survey on another member's behalf is recorded as
--     the actual respondent (the case the old flag couldn't disambiguate).
--
-- Existing rows, and any insert made outside an authenticated session (e.g. the
-- service role), get NULL — shown in the UI as "contact not recorded".
-- ON DELETE SET NULL keeps the survey if the member is later removed.
-- =============================================================================

-- Add the column first so existing rows simply get NULL (no table rewrite),
-- then attach the default so only future, authenticated inserts are stamped.
alter table "public"."surveys"
  add column "submitted_by" bigint;

alter table "public"."surveys"
  alter column "submitted_by" set default public.current_member_id();

alter table "public"."surveys"
  add constraint "surveys_submitted_by_fkey"
  foreign key ("submitted_by") references "public"."members"("id")
  on update cascade on delete set null;

create index if not exists "surveys_submitted_by_idx"
  on "public"."surveys" ("submitted_by");

comment on column "public"."surveys"."submitted_by" is
  'Member who completed the survey, auto-stamped from current_member_id() on insert. NULL for surveys created outside an authenticated session or before this column existed.';

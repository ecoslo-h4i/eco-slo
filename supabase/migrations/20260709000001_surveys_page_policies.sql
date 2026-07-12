-- =============================================================================
-- ECOSLO: surveys page — own-submission visibility and survey log maintenance
-- =============================================================================
-- 1. Tree Keepers can always see surveys they submitted. The existing keeper
--    SELECT policy is scoped to the survey's linked task/tree, which loses the
--    submitter's own view once the 30-day cleanup detaches the task or the
--    tree is reassigned. The Surveys dashboard lists exactly these rows for
--    keepers, so visibility must follow submitted_by, not the links.
-- 2. trees.survey_logs was only maintained on INSERT (append trigger). The
--    dashboard adds survey delete and tree re-link, so the log also needs
--    delete/update maintenance to avoid dangling or missing survey ids.
-- =============================================================================

drop policy if exists surveys_keeper_select_own on public.surveys;
create policy surveys_keeper_select_own on public.surveys
  for select to authenticated
  using (submitted_by = public.current_member_id());

-- Remove a deleted survey's id from every tree log that carries it. Matching
-- on containment (rather than old.tree alone) also heals entries left dangling
-- from before this trigger existed.
create or replace function public.remove_survey_log_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.trees
  set survey_logs = array_remove(survey_logs, old.id)
  where survey_logs @> array[old.id];

  return old;
end;
$$;

drop trigger if exists surveys_remove_tree_log on public.surveys;
create trigger surveys_remove_tree_log
after delete on public.surveys
for each row execute function public.remove_survey_log_on_delete();

-- Keep survey_logs consistent when a survey is re-linked to a different tree
-- (or detached). Mirrors append_survey_log_to_tree for the new tree.
create or replace function public.move_survey_log_on_tree_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tree is distinct from old.tree then
    update public.trees
    set survey_logs = array_remove(survey_logs, new.id)
    where survey_logs @> array[new.id];

    if new.tree is not null then
      update public.trees
      set survey_logs = case
        when survey_logs is null then array[new.id]
        when not (new.id = any(survey_logs)) then survey_logs || new.id
        else survey_logs
      end
      where ecoslo_num = new.tree;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists surveys_move_tree_log on public.surveys;
create trigger surveys_move_tree_log
after update of tree on public.surveys
for each row execute function public.move_survey_log_on_tree_change();

-- =============================================================================
-- ECOSLO: Extend the Condition enum for the Tree Planting Log import
-- =============================================================================
-- The customer's "Tree Planting Log" workbook records tree health using values
-- beyond the original good/fair/poor set: "Okay", "Decent", and "Dead". To
-- preserve those distinctions when importing rows into public.trees.condition
-- we add them to the "Condition" enum.
-- =============================================================================

alter type "public"."Condition" add value if not exists 'okay';
alter type "public"."Condition" add value if not exists 'decent';
alter type "public"."Condition" add value if not exists 'dead';

# Tree Planting Log → Supabase Import — Team / Technical Handoff

This document records how the customer's **`Tree Planting Log.xlsx`** workbook was
imported into the `public.trees` and `public.members` tables, every decision and
default we applied, how to use the leftover "skipped" file, and the prioritized
next steps.

Audience: ECOSLO team / developers. A plain-language version for the client is in
**`TREE_PLANTING_LOG_IMPORT_CLIENT.md`**. Last updated: 2026-06-25.

> **✅ Status: COMPLETE.** Initial import, seed cleanup, keeper backfill, and the
> client-corrected final pass are all done and verified against the live database.
> **Final live state: 580 trees, 150 members, 71 keeperless trees** (see §2 step 5).

---

## 1. Summary of results

| File produced      | Rows    | Notes                                                    |
| ------------------ | ------- | -------------------------------------------------------- |
| `trees.csv`        | **461** | 349 Active + 112 Graduated                               |
| `members.csv`      | **102** | adopters / tree keepers (83 real emails, 19 placeholder) |
| `skipped_rows.csv` | **141** | tree rows that did **not** import (with a reason each)   |

Every one of the **602** source data rows is accounted for: `461 imported + 124
skipped (bad/missing data) + 17 dropped duplicates = 602`.

> _This is the **initial** import snapshot. The client later corrected the skipped
> file, and the final pass (§2 step 5) added 120 of those trees. **Current live
> total: 580 trees / 150 members.**_

Source sheets used (others — _Dead Trees, Pivot Table, ReLeaf Final List_ — were ignored):

| Sheet                  | Rows | Imported as   |
| ---------------------- | ---- | ------------- |
| `2526 Planting Season` | 158  | **Active**    |
| `Planted Log`          | 243  | **Active**    |
| `Off-Boarded Trees`    | 201  | **Graduated** |

> The Active/Graduated **status comes from which sheet a row is in** — _not_ from
> the sheet's "Status" column. That "Status" column is the tree's **health**, which
> we mapped to `condition` (see §3).

---

## 2. Database changes made (deploy record)

1. **`Condition` enum extended** (migration `20260620000000_add_condition_enum_values.sql`)
   — added `okay`, `decent`, `dead` (the workbook used health values beyond
   good/fair/poor).
2. **Seed/demo data removed** (`scripts/cleanup_seed_trees.sql`) — the table held
   40 placeholder rows (`Oak`, `Wood`, `test species`, a bulk `#1001–1030` block)
   that collided with real tree numbers. Deleting them also cascade-deleted 23
   seed surveys and scrubbed those numbers out of 12 members' and 14 tasks' array
   columns.
3. **Imported** `trees.csv` → `public.trees`, then `members.csv` → `public.members`
   (the `needs_review` helper column was excluded — see §6).
4. **Tree-keeper links backfilled** (`scripts/link_tree_keepers.sql`) — set
   `trees.tree_keeper_id` from each member's `trees_assigned`. 386 trees got a keeper.
5. **Client-corrected final pass** (`scripts/integrate_client_corrections.sql` — one
   atomic, self-verifying transaction) — after the client returned their corrected
   files: **recovered 120 previously-skipped trees** (460 → 580); applied the
   client's member name/email/phone cleanup; merged 3 duplicate members (Emily
   Francis, Aline Cullen, Rhys Cannella); set ECOSLO's 3 trees keeperless and
   reassigned #262/#263 to SLO County Parks; created **SLO Firestation** and a
   generic **City of SLO** member; assigned 23 keepers from the returned keeper
   worklist; and recomputed every member's `trees_assigned`/`trees_count` from
   `tree_keeper_id`.

---

## 3. Column mappings — `public.trees`

| Target column            | Source                                                                   | Handling                                                                          |
| ------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `ecoslo_num`             | "Tree #" (2526) / "EcoSlo#" (others)                                     | The customer's real tree ID; preserved as-is (UNIQUE; surveys reference it)       |
| `status`                 | sheet of origin                                                          | 2526 & Planted Log → `Active`; Off-Boarded → `Graduated`                          |
| `species_name`           | "Species"                                                                | trimmed                                                                           |
| `common_name`            | "Common Name"                                                            | trimmed                                                                           |
| `funder`                 | "Funder"                                                                 | copied **verbatim** (no inference)                                                |
| `date_planted`           | "Date Planted"                                                           | converted to `YYYY-MM-DD`                                                         |
| `address`                | "Address"                                                                | trimmed                                                                           |
| `latitude` / `longitude` | combined `(lat, long)` cell in 2526; separate Lat/Long columns elsewhere | parsed to numbers; out-of-range values rejected                                   |
| `is_public`              | "Public/Private"                                                         | starts with "Pub" → `true`, otherwise `false`                                     |
| `condition`              | sheet "Status" (tree health)                                             | lowercased: Good→good, Fair→fair, Okay→okay, Decent→decent, Dead→dead, blank→good |
| `notes`                  | "Notes" **+ all otherwise-unmapped columns**                             | extra columns folded in as labeled lines (see below)                              |

**Folded into `notes`:** ReLeaf #, FullCircle #, stock size, neighborhood, census
tract, low income, planting area, distance/direction to building, tagged, mulched,
immediate needs, "watered this week", "next mulching due". Blank / `N/A` values
were dropped.

**Left at database defaults (not set by the import):** `weekly_watering_status`
(Pending), `yearly_mulching_status` (Pending), `next_watering_date` /
`next_mulching_date` (null), `admin_notes` (empty), `survey_logs` (null),
`created_at` (now), `id` (auto-generated). `tree_keeper_id` was set in a separate
backfill step (§2.4).

---

## 4. Column mappings — `public.members` (adopters / tree keepers)

Adopter/keeper contact info was **not** stored on the trees; it was routed to a
separate members file and de-duplicated.

| Target column    | Source              | Handling                                                              |
| ---------------- | ------------------- | --------------------------------------------------------------------- |
| `firstname`      | adopter "Name"      | first word                                                            |
| `lastname`       | adopter "Name"      | the remainder                                                         |
| `email`          | adopter "Email"     | first valid address extracted from the cell; placeholder if none (§5) |
| `phone`          | adopter "Phone"     | first non-empty value seen                                            |
| `role`           | —                   | constant `Tree Keeper`                                                |
| `trees_assigned` | the trees they keep | aggregated set of `ecoslo_num`                                        |
| `trees_count`    | —                   | size of `trees_assigned`                                              |

Source columns: 2526 uses "Tree Keeper's Name/Phone/Email"; Planted Log &
Off-Boarded use "Adopter's Name/Phone/Email". **De-duplication:** one member per
unique email; when there's no email, keyed by normalized name.

---

## 5. Decisions & special-case handling

1. **Health values beyond good/fair/poor** → we extended the `Condition` enum with
   `okay`/`decent`/`dead` rather than forcing them into existing buckets. (Final
   data: 458 good, 2 fair, 1 okay; decent/dead were all skipped/deduped for other
   reasons.)
2. **Missing required data → skip, don't guess.** A row missing any NOT-NULL
   field with no default (`ecoslo_num`, species, common name, funder,
   `date_planted`, address, latitude, longitude) was skipped to
   `skipped_rows.csv`. `n/a`, blank, and stray date values in a text field count
   as missing.
3. **Blank funder (Off-Boarded).** 87 rows had no funder. **Decision: skip them**
   (we did _not_ infer funder from the ReLeaf #/FullCircle # columns). `funder` is
   verbatim from the workbook.
4. **Duplicate tree numbers.** `ecoslo_num` is UNIQUE, so one row per number.
   Priority **Off-Boarded > 2526 > Planted Log**, evaluated over _valid_ rows. 17
   duplicate rows were dropped (logged in `skipped_rows.csv`). Edge case: tree
   **#205** appears in both Planted Log (Active) and Off-Boarded (Graduated); the
   Off-Boarded copy had no coordinates and was skipped, so #205 imported as
   **Active** from Planted Log.
5. **Coordinates.** The 2526 sheet stores them as one `(lat, long)` cell (split
   programmatically); the other sheets use separate columns. Non-numeric or
   out-of-range values were treated as missing.
6. **Messy adopter emails.** Email cells frequently held more than an address —
   a second address (`a@x.com + b@y.com`), a parenthetical (`brenna (b@x.org)`),
   or a note on a new line. We extracted the **first valid address** and used it
   as the de-dup key.
7. **Adopters with no email.** `members.email` is NOT NULL + UNIQUE, so each
   email-less adopter got a unique **placeholder** `noemail+N@ecoslo.invalid` and
   was flagged `needs_review` (§6). These addresses are intentionally invalid (no
   mail will ever be sent to them).
8. **Name splitting.** First word → `firstname`, remainder → `lastname`. "Names"
   that are really orgs or sentences were flagged for review.
9. **Tree-keeper linkage.** `tree_keeper_id` couldn't be set during import
   (member IDs are generated at import time). It was backfilled afterward from
   `members.trees_assigned`, which is also what the app's access rules already
   use.

---

## 6. Default / placeholder values applied

| Field                     | Default applied            | When                           |
| ------------------------- | -------------------------- | ------------------------------ |
| `condition`               | `good`                     | health cell blank/unrecognized |
| `is_public`               | `false`                    | not marked "Public"            |
| `email` (members)         | `noemail+N@ecoslo.invalid` | adopter had no email           |
| watering/mulching status  | `Pending` (DB default)     | always (not in source)         |
| `admin_notes`             | empty (DB default)         | always                         |
| `needs_review` (CSV only) | `true`                     | flagged rows — see below       |

### `needs_review` — what it is

A **review flag in `members.csv` only**. It is **not** a column in
`public.members` and must not be loaded into the table (it was excluded on
import). It marks **30** members the script wasn't fully confident about:

- **19** — synthesized placeholder email (no email in source)
- **1** — has an email but no name
- **10** — a real email but a multi-word "name" (org/sentence) the first/last
  split mangled (e.g. _"Will Powers + Annie Buchser"_, _"City of SLO - Mike Johnson"_)

To work the list: filter `members.csv` to `needs_review = true`.

> **Resolved (final pass):** the client returned `members_updated.csv` with real
> names/emails; those were applied and the 3 duplicate records merged. Some keepers
> still carry an `@ecoslo.invalid` placeholder where no email was found — the client
> will replace those in-app over time.

---

## 7. `skipped_rows.csv` — what it is and how to use it

It is the worklist of **tree rows that are NOT in the system**. Columns:
`source_sheet, excel_row, reason, raw_tree_num, species, common_name, funder,
date_planted, address, raw_lat, raw_long, status_intended`.

| Reason                       | Count | Meaning / action                                                |
| ---------------------------- | ----- | --------------------------------------------------------------- |
| missing funder               | 88    | Off-Boarded rows with no funder — add a funder to recover       |
| missing/invalid lat/long     | 34    | needs coordinates                                               |
| duplicate `ecoslo_num`       | 17    | **No action** — the tree is already imported from another sheet |
| missing common name          | 4     | add the common name                                             |
| missing species              | 3     | add the species                                                 |
| missing/invalid tree number  | 3     | no usable ID in the source                                      |
| missing/invalid date planted | 1     | add a plant date                                                |
| missing address              | 1     | add an address                                                  |

**How to recover skipped trees:** fill the missing field(s) in the workbook, then
re-run the converter (§9) and import **only the newly-fixed rows**. ⚠️ Do _not_
re-import the whole file — already-imported `ecoslo_num`s will collide with the
UNIQUE constraint. The 17 "duplicate" rows need no action.

> **Resolved (final pass):** the client completed `skipped_rows_updated.csv`;
> **120 trees were recovered and imported.** Two rows that only lacked a common name
> were filled in (#416 "Water Gum", #152 "Island Oak") and imported; #205 was left
> out because it already existed. The 17 duplicates needed no action, as expected.

---

## 8. Known data-quality notes

- **Funder name variants** (preserved verbatim): `City of SLO` (77) vs
  `City Of SLO` (23) are the same funder; `ReLeaf` (35) vs `Releaf Grant` (10).
  Worth normalizing if you report by funder.
- **71 trees have no tree keeper (final)** — the client couldn't find keepers for
  most of the original keeperless set (incl. the #391–400 they dropped from the
  worklist), ECOSLO's 3 trees were set keeperless by choice, and ~17 recovered trees
  had no adopter. All assignable in-app anytime.

---

## 9. Status & remaining items

All of the original next steps are **done** — the recovered trees are imported, the
member contacts are cleaned and merged, and keepers are assigned wherever the client
had data. What remains is optional and/or client-side:

- **71 keeperless trees** — the client has no keeper data for these; assignable
  in-app anytime.
- **Placeholder emails** (`%@ecoslo.invalid`) — the client will replace these in-app
  as they confirm real addresses.
- **2 filled-in common names** — #416 "Water Gum", #152 "Island Oak" — worth a
  client confirm, not urgent.
- **(Dev team) Surface the new condition values in the app.** Add
  `okay`/`decent`/`dead` to `src/database/database.types.ts` and the UI
  (`ControlPanel` filter, `tree-detail-modal`, `table-widget-defs` color/icon maps)
  so they display and filter correctly. Only 1 tree uses `okay` today, but the value
  now exists in the database.
- **(Optional) Normalize funder name variants** (§8) if you report by funder.

---

## 10. Artifacts & how to re-run

| File                                                               | Purpose                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `scripts/import_trees.py`                                          | Converts a workbook → `trees.csv` / `members.csv` / `skipped_rows.csv`           |
| `supabase/migrations/20260620000000_add_condition_enum_values.sql` | Adds `okay`/`decent`/`dead` to the `Condition` enum                              |
| `scripts/cleanup_seed_trees.sql`                                   | One-off removal of the 40 seed/demo trees (already run)                          |
| `scripts/link_tree_keepers.sql`                                    | Backfills `tree_keeper_id` from `members.trees_assigned` (already run)           |
| `scripts/integrate_client_corrections.sql`                         | Final client-corrected pass: recovered trees + member/keeper fixes (already run) |

Re-run the converter:

```bash
python scripts/import_trees.py "Tree Planting Log.xlsx" -o OUTPUT_DIR
```

Requires Python 3 + `openpyxl` (`pip install openpyxl`). The script is idempotent
and makes no database changes — it only writes CSVs.

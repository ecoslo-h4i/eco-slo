# Tree Planting Log — Import Summary

## What we brought in

- **461 trees** and **102 tree keepers** were loaded successfully.
- Trees came from three tabs of your workbook:
  - **"25/26 Planting Season"** and **"Planted Log"** → marked **Active**
  - **"Off-Boarded Trees"** → marked **Graduated**
- **141 rows could not be brought in** because they were missing essential
  information. This is your main follow-up — details below.
- The other tabs (Dead Trees, Pivot Table, ReLeaf Final List) were left out, as agreed.

---

## The judgment calls we made

Wherever your spreadsheet didn't fit neatly into the system, here's how we handled
it — and the assumption behind each choice:

1. **Tree health ratings.** A blank health rating was treated as **Good**.

2. **We never invented missing information.** A tree can only be added if it has the
   essentials: a tree number, species, common name, funder, planting date, address,
   and map location. **If any of those were blank, we set that row aside** (on the
   "couldn't load" list) instead of guessing.

3. **Trees with no funder.** Many "Off-Boarded" trees had the Funder column left
   blank. We **set these aside** rather than assume who funded them — you can add the
   funder later and we'll bring them in.

4. **Trees listed on more than one tab.** A handful of trees appeared on two tabs. We
   kept **one record per tree**, giving preference to the "Off-Boarded" tab first,
   then "25/26 Planting Season," then "Planted Log."

5. **Tree keepers / adopters.**
   - We created **one contact per person**, even if they look after several trees
     (all their trees are linked to them).
   - **Emails:** some cells held two emails or extra notes — we used the **first
     valid email**. If a keeper had **no email at all**, the system still requires
     one, so we entered a **temporary stand-in address** (it ends in
     `@ecoslo.invalid` and can't send or receive mail) and **flagged that contact**
     for you to update.
   - **Names:** we split each entry into a first and last name as best we could.
     Where the "name" was really a note or an organization, that split is rough, so
     we **flagged those for review** too.

6. **Extra spreadsheet columns.** Your workbook has detail the system has no
   dedicated home for (ReLeaf #, stock size, neighborhood, census tract, and so on).
   **We tucked all of it into each tree's Notes** so nothing was lost. Let us know
   if you would prefer some of these details be omitted or stored under
   **Admin Notes** instead. **Notes** are visible by the public on the map page, but
   only admins can see **Admin Notes**.

---

## Your next steps (most important first)

1. **Add the 141 trees that couldn't be loaded.** This is the biggest item — these
   are real trees not yet in the system. Most are missing a **funder** (~88) or a
   **map location** (~34). Fill the gaps in the spreadsheet provided (`skipped_rows.csv`)
   and we'll load them. _(A few entries on that list are simply duplicates already
   loaded from another tab — those need nothing.)_

2. **Update the ~30 flagged tree-keeper contacts.** These are the ones we weren't
   fully confident about — mostly the **19 people with no email on file** (currently
   a stand-in address), plus about **11** where the name needs tidying. Adding real
   emails and clean names means you can actually reach these keepers and they can
   log in. Adit the `members.csv` file we provide with the correct information, and we
   will update the database.

3. **Check tree-keeper assignments.** Most trees are linked to a keeper, but **about
   74 trees have no keeper** because none was listed in the spreadsheet. Please
   confirm those are genuinely unassigned, and add keepers where you know them.

4. **Spot-check a few trees.** Open the system and compare a handful of trees against
   your spreadsheet — the address, the location on the map, and whether they're
   Active vs. Graduated — just to be sure everything looks right.

5. **(Optional) Tidy up funder names.** Your spreadsheet spells a few funders more
   than one way (for example, "City of SLO" and "City Of SLO"). They'll show up as
   separate funders unless we standardize them — let us know if you'd like that done.

---

## Questions?

We are happy to walk through any of this with you! Whenever you're ready, send the
corrected or added rows over and we'll add them back in :)

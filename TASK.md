Standardize the frontend components across all pages. There are many components that should by styled the same but have inconcsistencies due to shared team development. You job is to standardize these into shared components that have the same styling with variants. All aspects should be standardized between shared components, like font size, font weight, padding, border, colors, default/hover states, etc. Below are the elements that need to be standardized, grouped by shared-ness.

Pills:

- Tree page control panel toggles
- Members page control panel toggles
- Tasks page control panel toggles
- Map page control panel toggles

Searchbar:

- Tree page control panel searchbar
- Members page control panel searchbar
- Tasks page control panel searchbar
- Map page control panel toggles

Dropdown select input:

- Trees page control panel condition, visibility, and columns select dropdowns
- Reminders page reminder view Type, Assignees, Repeats, Day of Week dropdowns
- Tasks page control panel Assigness and Surveys dropdowns
- Survey Task, Tree, and Issue dropdowns

Dropdown menu:

- All menus associated with the select inputs

Full-round buttons:

- Reminders page reminder view Create Reminder and Cancel buttons
- Surveys page Submit button
- Maps page poppet Report an Issue and Close button
- Login page buttons
- Navbar login/logout button

Small-round buttons:

- Trees page Export CSV and Add Tree buttons
- Members page Add Members button
- Reminders page Add Reminder button

Text input:

- Login page inputs
- Survey page inputs

Make sure to stay faithful to DESIGN.md and the tokens specified in globals.css. When standardizing these elements, do NOT modify or change any logic or funcionality of the app, this must be preserved. Only the styling should change. These elements should draw upon a shared component that has variants if needed. The pills, searchbar, dropdown selects, and text input should be straightforward. For the dropdown select menus, make sure to keep them all consistent with eachother. some menus are more complex than others, so make sure to build on top of the basic on as it gets more complex. they should still all share the same consistent styling in terms of thinks like text style, accent colors, padding and spacing, etc. For the buttons, they should all have consistent styling and draw from the same component with variants. it should allow for an icons too, either icon + text or just an icon. the icon should always be to the left of the text. make sure the spacing looks neat. the full-round vs small-round only refers to the roundness of the radius. single icon buttons should always use small-round.

All your changes should make it very easy for me to go in and tweak afterwards if needed.

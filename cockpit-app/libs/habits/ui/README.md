# habits-ui

Presentational Habits components (DayStrip, HeatmapCalendar, IconPicker, sortable habit rows, charts) plus the icon/colour sets and local-date helpers they use.

Tags: `scope:habits`, `type:ui`. Pure: imports only `type:ui` and `type:util` libs, never data-access ([ADR 0005](../../../../docs/adr/0005-ui-libs-are-pure-in-every-scope.md)). Components define their own prop shapes instead of importing API types.

## Running unit tests

Run `nx test habits-ui`.

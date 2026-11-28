# UI libs are pure in every scope

Every `type:ui` lib, shared or App-specific, may import only `type:ui` and `type:util` libs, never `type:data-access`. Data-connected containers live in a separate `type:feature` lib (`<app>-feature`); presentational components live in `<app>-ui`. ESLint enforces this through `@nx/enforce-module-boundaries`.

## Considered options

- **ui may import data-access (previous rule)**: fewer libs, containers and presentation in one place. Rejected because components that fetch their own data cannot move to shared without dragging an App's API calls with them.
- **Pure ui only in shared, free-form in App libs**: cheaper per App. Rejected because every App ui component is a future shared candidate, so a purity rule that applies only after promotion makes each promotion a refactor.

## Consequences

- Moving a component from `<app>-ui` to `shared-react-ui` is a file move plus import rewrite, because it already has no data-access dependency.
- Storybook stories and component tests need no API or QueryClient mocks.
- Cost: one more lib per App (`<app>-feature`), created only when the App needs data-connected containers.
- Each `scope:<app>` may depend on `scope:shared` and its own scope only; Apps cannot import each other's libs.

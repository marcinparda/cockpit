## Test Writing

### Test Behavior
Focus on what code does, not how it does it, to allow safe refactoring.

### Clear Names
Use descriptive names explaining what's tested and expected (`shouldReturnErrorWhenUserNotFound`).

### Mock External Dependencies
Isolate tests by mocking databases, APIs, and external services.

### Mock Data via Factories
Build entity mock data with `createXMock(overrides)` factory functions, not hand-rolled literals or shared module-level objects.

- One factory per entity, e.g. `mocks/habit.ts` exporting `createHabitMock`.
- Each call returns a fresh object (no shared references) built from defaults, with `overrides` spread last so they win.
- Use a random default id (`crypto.randomUUID()` in TS, `uuid4()` in Python) where an id field exists; everything else gets a sensible fixed default. Everything is overridable.
- Call inline at point of use: `createHabitMock({ type: 'boolean' })`.
- Python equivalent: a `make_x(**overrides)` function in `tests/factories.py`, same rules — fresh object per call, overrides win.
- Existing factories: `cockpit-api/src/tests/factories.py`; `cockpit-app/apps/{cv,store}/src/mocks/`; Habits exports `createHabitMock` / `createCategoryMock` from `@cockpit-app/habits-data-access`. A ui lib spec can't import data-access, so it builds its own fixtures for the narrow prop shape the component takes.
- For a one-off single-field override with no reuse, a plain object literal is fine — don't force a factory for it.

### Fast Execution
Keep unit tests fast (milliseconds) so developers run them frequently.

### Risk-Based Testing
Prioritize testing based on business criticality and likelihood of bugs.

### Balance Coverage and Velocity
Adjust test coverage based on project needs and team workflow.

### Critical Path Focus
Ensure core user workflows and critical business logic are well-tested.

### Appropriate Depth
Match edge case testing to the risk profile of the code.

## Project Test Setup

### Vitest with jsdom for React/Vite Apps
React and Vite-based apps use Vitest with `environment: 'jsdom'`. Source: `nx.json`, `vite.config.mts`.

### Coverage via V8 Provider
`@vitest/coverage-v8`. Source: `vite.config.mts`, `package.json`.

### `.spec.ts(x)` Suffix Dominant
Frontend test files use `.spec.tsx` or `.spec.ts` suffix (8 of 10 sampled). One `.test.tsx` found in cockpit app. Prefer `.spec.*`.

### `describe/it/expect` with Testing Library
Frontend component tests use Vitest `describe`/`it`/`expect` + `@testing-library/react` (`render`, `screen`, `getByText`). Co-locate test file with source as sibling.

```tsx
import { describe, it, expect } from 'vitest';
describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Pytest Asyncio Auto Mode
Python tests use `asyncio_mode = auto` — no explicit `@pytest.mark.asyncio` markers needed. Source: `pyproject.toml [tool.pytest.ini_options]`.

```python
async def test_something():  # works without @pytest.mark.asyncio
    result = await some_async_fn()
    assert result is not None
```

### Playwright for E2E
End-to-end tests use Playwright (`@playwright/test ^1.36.0`). Source: `nx.json` @nx/playwright/plugin.

## Coverage Thresholds

### 80% Minimum Coverage Required
Both `cockpit-app` and `cockpit-api` must maintain ≥80% coverage across lines, functions, branches, and statements. Coverage below 80% fails CI.

- **cockpit-app**: Thresholds set per-package in each `vite.config.mts` under `test.coverage.thresholds`. CI runs `nx affected --targets=test -- --coverage` which enforces thresholds via Vitest.
- **cockpit-api**: Threshold set in `pyproject.toml` under `[tool.coverage.report] fail_under = 80`. Coverage runs automatically via `addopts = "--cov=src"` in `[tool.pytest.ini_options]`.

When adding a new `cockpit-app` package, include coverage thresholds in `vite.config.mts`:

```ts
coverage: {
  provider: 'v8' as const,
  thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
  include: ['src/**/*.{ts,tsx}'],
  reporter: ['text-summary', 'lcov'],
}
```

### Mocking a lib barrel
When a component imports hooks from a lib barrel (e.g. `@cockpit-app/habits-data-access`), mock the barrel once and keep the real exports: `vi.mock('<lib>', async (importOriginal) => ({ ...(await importOriginal<object>()), useX: vi.fn() }))`, then `import * as dataAccess from '<lib>'` and `vi.mocked(dataAccess.useX)`. Don't `await import('<lib>')` in tests: Nx lint treats it as lazy-loading the lib. Lib ESLint configs enforce `import/first`, so put imports above `vi.mock` (it is hoisted anyway).

### Driving Radix components in jsdom
Shared `Select` (Radix) needs `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture` and `scrollIntoView` stubs in the project's `setupTests.ts` (see `libs/habits/feature/setupTests.ts`). Open it with `userEvent.click(trigger)` then `userEvent.click(findByRole('option', { name }))`; `fireEvent.change` does nothing. Shared `Sheet` (Radix Dialog) closes on Escape (`userEvent.keyboard('{Escape}')`); overlay clicks are covered in the shared `Sheet` spec, not per App.

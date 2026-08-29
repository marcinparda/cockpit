## Test Writing

### Test Behavior
Focus on what code does, not how it does it, to allow safe refactoring.

### Clear Names
Use descriptive names explaining what's tested and expected (`shouldReturnErrorWhenUserNotFound`).

### Mock External Dependencies
Isolate tests by mocking databases, APIs, and external services.

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

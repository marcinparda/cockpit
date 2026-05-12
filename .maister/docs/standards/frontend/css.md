## CSS

### Consistent Methodology
Stick to the project's chosen approach (Tailwind, BEM, CSS modules, etc.) across the entire codebase.

### Work With the Framework
Use framework patterns as intended rather than fighting them with excessive overrides.

### Design Tokens
Establish and document consistent values for colors, spacing, and typography.

### Minimize Custom CSS
Prefer framework utilities to reduce custom styling maintenance.

### Production Optimization
Use CSS purging or tree-shaking to remove unused styles.

## Project CSS Stack

### Vite as Bundler for React Apps
React apps use Vite 6 bundler. Source: `nx.json` generators.

### Plain CSS as Default Style Format
React components use plain CSS (not SCSS or CSS-in-JS). Source: `nx.json` style: css.

### Tailwind v4 CSS-Native Config
React apps use Tailwind CSS v4 via `@tailwindcss/vite` plugin. No `tailwind.config.js` — config is CSS-native. Design tokens as CSS custom properties in `:root`/`.dark`. Source: `cockpit-app/docs/ARCHITECTURE.md`.

## Frontend Formatting Standards

### Single Quotes for Strings
TypeScript and JavaScript files use single quotes. Source: `.prettierrc` singleQuote: true, `.editorconfig` ij_typescript_use_double_quotes = false.

```ts
const name = 'hello'; // correct
const name = "hello"; // wrong
```

### Tailwind CSS Class Sorting
Tailwind classes auto-sorted by `prettier-plugin-tailwindcss`. Never manually order classes. Source: `.prettierrc` plugins.

## Coding Style

### Naming Consistency
Follow established naming patterns for variables, functions, classes, and files throughout the project.

### Automatic Formatting
Use automated tools to enforce consistent indentation, spacing, and line breaks.

### Descriptive Names
Choose names that clearly communicate intent; avoid cryptic abbreviations or single-letter identifiers outside tight loops.

### Focused Functions
Write functions that do one thing well; smaller functions are easier to read, test, and maintain.

### Uniform Indentation
Standardize on spaces or tabs and enforce with editor/linter settings.

### No Dead Code
Remove unused imports, commented-out blocks, and orphaned functions instead of leaving them behind.

### No Backward Compatibility Unless Required
Avoid extra code paths for backward compatibility unless explicitly needed.

### DRY (Don't Repeat Yourself)
Extract repeated logic into reusable functions or modules.

## Project-Specific Formatting

### 2-Space Indentation
All files use 2-space indent with spaces (not tabs). Source: `.editorconfig`, `.prettierrc` tabWidth: 2.

### UTF-8 Encoding
All files encoded in UTF-8. Source: `.editorconfig` charset = utf-8.

### Final Newline
All files must end with a newline. Source: `.editorconfig` insert_final_newline = true.

### No Trailing Whitespace
Trim trailing whitespace from all lines except Markdown. Source: `.editorconfig` trim_trailing_whitespace = true (except [*.md]).

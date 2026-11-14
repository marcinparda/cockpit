## Commenting

### Let Code Speak
Write code that explains itself through structure and naming.

### Comment Sparingly
Add brief comments only when the logic isn't self-evident from the code.

### No Change Comments
Avoid comments about recent fixes or changes; comments should be timeless explanations, not changelogs.

### Docstring Every Function Whose Name Isn't Explicit
Give each function, method and class a short docstring (one line, what it is *for*) unless its name already says everything. Needed: helpers with a non-obvious contract (`_bump_updated`), names that hide behavior (a `delete_note` that moves to `.trash/`), and anything where the return shape or side effect isn't implied by the name. Not needed: `__init__`, plain getters/CRUD wrappers (`get_note`), data-only schema classes. Say purpose and surprises, not a line-by-line paraphrase of the body.

```python
def _atomic_write(full: Path, data: bytes) -> None:
    """Write bytes via a temp file + rename so readers never see a half-written note."""
```

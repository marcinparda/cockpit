# Brain Note Relations

In the brain vault, the **frontmatter key holding a `[[wikilink]]` is the relation type** (edge label). `brain_get_links` groups links by that key and `rel` filters on it. Links in the note body are untyped mentions, grouped under `body`.

```yaml
---
part_of: "[[Carbonara]]"
related: ["[[Pasta]]", "[[Guanciale]]"]
---
```

## Standard vocabulary

Use these keys before inventing new ones. Direction: the note holding the key is the **source** of the edge.

| Key | Meaning | Ask it with |
|---|---|---|
| `up` / `parent` | Hierarchical parent (folder-like, one or few) | outgoing `up` = "where does this live?" |
| `part_of` | This note is a component of the target | outgoing `part_of` = "what is this part of?"; incoming `part_of` = "what are its parts?" |
| `depends_on` | Target must be understood/done first | outgoing = prerequisites; incoming = dependents |
| `source` | Where this note's information came from | outgoing = provenance |
| `related` | Loose, symmetric association | either direction |

Existing domain keys (`requires`, `evidence`, ...) stay valid; they are relations too. Prefer a standard key when the meaning matches.

## Rules

- One link per value; lists for several targets. Always quote: `"[[Note]]"`.
- Use `body` links for plain mentions; don't duplicate them into frontmatter.
- Keys are snake_case. A key with no wikilink values creates no edge.
- Inline Dataview `key:: [[X]]` is not parsed.

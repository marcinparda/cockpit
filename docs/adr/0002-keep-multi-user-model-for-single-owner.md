# Keep the user, role and permission model despite a single owner

Cockpit is built for one owner, but it keeps Users, Roles, per-User Permissions and Feature-gated endpoints instead of collapsing to a single hard-coded login.

## Considered options

- **Single hard-coded owner, no permission model**: simpler today. Rejected because retrofitting multi-user later means touching every endpoint, table and token flow, and the owner is open to additional users.
- **Full multi-user product (signup, tenancy, per-user data isolation)**: not needed now and costly. Rejected; only the access model is kept, not the product around it.

## Consequences

- Every business endpoint uses `require_permission(Feature, Action)`. New features must be added to the `Features` enum and the permissions migration.
- A User can hold Permissions directly as well as through a Role.
- Docs saying "single-user" describe the intended audience, not the data model.

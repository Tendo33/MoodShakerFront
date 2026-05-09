# Task Flow

1. Read README and project docs.
2. Inspect `package.json` scripts.
3. Identify affected routes, components, data files, and helpers.
4. Prefer server components until client behavior is required.
5. Make the smallest visible change that solves the task.
6. Update docs when routes, content workflow, deployment, or verification
   behavior changes.
7. Run verification.
8. For UI changes, inspect the result in a browser.

## Clarify Before Editing

Ask before editing when:

- The requested design direction conflicts with existing brand or `DESIGN.md`.
- The request implies adding a backend, database, or auth to a frontend-only
  project.
- The current route/i18n structure supports multiple plausible implementations.

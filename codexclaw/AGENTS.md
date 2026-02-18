# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal, so keep the root clean and add structure as features are introduced.
- Put application code in `src/`.
- Put automated tests in `tests/`.
- Put static files (images, fixtures, sample data) in `assets/`.
- Group code by feature (`src/<feature>/...`) instead of by file type when possible.
- Mirror source paths in tests (example: `src/auth/token.js` -> `tests/auth/token.test.js`).

## Build, Test, and Development Commands
No build/test toolchain is committed yet. For now, use:
- `git status` to review local changes.
- `git diff` to inspect edits before committing.
- `git log --oneline -n 10` to follow recent history.

When introducing tooling, add explicit scripts/targets and document them in `README.md` (for example: `npm run dev`, `npm test`, `make test`).

## Coding Style & Naming Conventions
- Use consistent formatting and keep files focused on one responsibility.
- Use descriptive names: `snake_case` for directories, `kebab-case` for Markdown filenames, and language-idiomatic naming in code.
- Keep functions/modules small; prefer composition over large monolithic files.
- If you add a formatter or linter, commit its config in the same change and run it repository-wide.

## Testing Guidelines
- Add or update tests for every behavior change.
- Name tests by behavior (example: `token_refresh_on_expiry.test.js`).
- Keep unit tests fast and deterministic; isolate external dependencies with mocks/stubs.
- Include regression tests for bug fixes.

## Commit & Pull Request Guidelines
Git history follows a Conventional Commit style (`type(scope): summary`), e.g. `feat(claudeclaw): implement Phase 1 MVP`.
- Prefer `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.
- Keep commits scoped to one logical change.
- PRs should include: purpose, key changes, test evidence, and linked issue/task.
- Include screenshots or sample output when UI/behavior changes are visible.

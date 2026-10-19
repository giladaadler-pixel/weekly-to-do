# Rules for working on this repo
- I know how GitHub works now. Don't explain git commands and don't ask before committing or pushing.
- After every change I ask for, without me asking:
  1. Run `npm test` and `npm run build`. If either fails, fix it before continuing.
  2. Commit with a clear message describing the change.
  3. Push straight to `main` (no branches or pull requests needed). Pushing to main deploys the live site.
- If a change is big or risky (deleting features, changing how data is saved), stop and check with me first.
- The design spec for the current work is docs/superpowers/specs/2026-10-19-round-1-home-screen-app-design.md. Follow it unless I say otherwise.
- Never wipe or rename the saved data key (weekly-to-do:v1). Users' tasks live there.

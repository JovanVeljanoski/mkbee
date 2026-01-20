# Cursor Rules for aws

## Environment
- Always use the mamba environment `mkbee` for both Python and Node.js (npm, npx, etc.) work
- Prefix commands with `mamba run mkbee` instead of activating the environment
- Examples:
  - `mamba run mkbee npm run dev` (instead of `npm run dev`)
  - `mamba run mkbee npm install` (instead of `npm install`)
  - `mamba run mkbee python script.py` (instead of `python script.py`)
  - `mamba run mkbee npx vite build` (instead of `npx vite build`)

## Development Philosophy
- Be pragmatic and avoid overengineering
- Prefer simple, straightforward solutions over complex ones
- Focus on solving the problem at hand effectively

## Testing and Quality
- After making changes, always run tests and linting:
  - `mamba run mkbee npm run test` - Run the test suite
  - `mamba run mkbee npm run lint` - Check code quality and style
- When adding a meaningful new feature, consider adding unit tests (or ask the user if tests should be added)

## Git Practices
- Never use `git push --force` or `git push -f`
- Always use `git push --force-with-lease` instead when force pushing is necessary
- This prevents accidentally overwriting commits that others may have pushed

## Communication
- If instructions are conflicting, ambiguous, or unclear, ask the user for clarification before proceeding
- If there's an obvious improvement to be made, ask the user before implementing it
- When in doubt, ask follow-up or clarifying questions rather than making assumptions


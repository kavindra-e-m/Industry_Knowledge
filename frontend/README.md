# Frontend & Dashboard — Member 3

You own two clients that both talk to Member 1's backend API:

- `web-dashboard/` — React (Vite) web app for managers/safety officers:
  compliance reports, equipment tracker, knowledge graph visualisation.
- `mobile-chat/` — mobile-first chat interface for field technicians (PWA
  or React Native, team's call — PWA is faster to demo).
- `shared-ui/` — components/tokens shared between the two if useful.

Build against `docs/api-contracts.md`. You can mock the API responses
locally and start UI work before Member 1's endpoints are fully wired.

## Run locally
```bash
cd web-dashboard && npm install && npm run dev
```

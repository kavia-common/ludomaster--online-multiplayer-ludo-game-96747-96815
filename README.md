# LudoMaster Workspace

This repository contains multiple containers. The frontend React app lives under:

- FrontendWebApplication/

To build/run the frontend from the repository root:

- npm run build
- npm run start
- npm run test

These root scripts delegate into FrontendWebApplication so the correct node_modules (including react-scripts) are used. If your CI runs from the repo root, use these scripts.

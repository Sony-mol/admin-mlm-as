## Railway Frontend Deployment

1) Build & serve via Dockerfile (already configured)

2) Required environment variable on the frontend service:

```
BACKEND_URL=https://asmlmbackend-production.up.railway.app
```

This makes the bundled server proxy all `/api/*` calls to the backend, removing CORS.

3) Frontend code calls same-origin paths

- `asmlm/src/config/api.js` forces `API_BASE_URL=''`, so requests go to `/api/...`.
- No `VITE_API_BASE_URL` needed.

4) Deploy steps

- Push changes; Railway will build using the Dockerfile.
- Confirm the env variable on the service matches your backend URL if it changes.
- After deploy, hard refresh the browser.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# auxxai-apps

First-party apps for the [Auxx.ai](https://auxx.ai) platform, built with [`@auxx/sdk`](https://www.npmjs.com/package/@auxx/sdk).

## Structure

Each app lives in `apps/<app-slug>/` as a self-contained project with its own dependencies.

```
apps/
├── shopify-lookup/
├── translation/
└── ...
```

## Adding a New App

1. Create the app in the Auxx build portal
2. Scaffold it locally:

```bash
cd apps/
pnpm dlx @auxx/sdk init <app-slug>
cd <app-slug>
pnpm install
pnpm run dev
```

## Development

```bash
cd apps/<app-slug>
pnpm install
pnpm run dev
```

## CI/CD

- **PRs**: Changed apps are automatically linted and built
- **Merge to main**: Changed apps are automatically published via `auxx version create`

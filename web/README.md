# Peek for YNAB: Backend server and website

To preview the Astro static website locally, run:
```sh
pnpm dev
```

To run the Fastify server locally, set up the environment variables in `.env` and then run:

```sh
pnpm build
pnpm start
```

## Project Structure

```text
├── server/ - Fastify server with OAuth handling and API
├── src/ - Astro static website 
│   └── pages/
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

Any static assets that should be served directly can be placed in the `public/` directory.

## Astro Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

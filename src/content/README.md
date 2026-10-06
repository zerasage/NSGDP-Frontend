# NSGDP Architecture Docs

Handover documentation for the NSGDP Data Portal. It explains the architecture, backend, frontend, admin console, ingestion engine, background jobs, data model, security, and deployment.

The site is a static export. It is served at `/docs` by nginx. It needs no login and no backend.

## Run and build

```bash
npm install
npm run dev        # local preview at http://localhost:3000/docs
npm run build      # regenerates reference pages, then builds to ./out
```

## Where things are

| Path | What it is |
| --- | --- |
| `content/docs/*.mdx` | The narrative pages, in sidebar order (see `content/docs/meta.json`) |
| `content/docs/reference/` | Generated pages. Do not edit by hand. |
| `scripts/generate-reference.mjs` | Reads the backend, frontend, and admin source and writes the reference pages |
| `components/mermaid.tsx` | Renders the diagrams written in the pages |
| `archive/` | Earlier design specs, kept for history, each with a banner |
| `lib/source.ts` | Loads the pages for the sidebar and search |

## Editing a page

1. Open the `.mdx` file under `content/docs/`.
2. Start with the answer in one or two sentences. Then give the diagram and the detail.
3. Keep the **Source files** list at the end up to date with the code paths you describe.
4. Write short sentences. Define a term the first time it appears, or link it to the glossary.

### Adding a diagram

Use the `Mermaid` component. Keep one idea per diagram.

````mdx
<Mermaid
  caption="One line that says what the reader should notice."
  chart={`flowchart LR
    A --> B`}
/>
````

Check the diagram parses before you commit. Run the build. A broken diagram shows an error box in the browser rather than failing the build.

### Adding a page

1. Create the `.mdx` file with a `title` and `description` in the frontmatter.
2. Add its name to `content/docs/meta.json` in the position you want.
3. Run `npm run build` and check that the link works.

## Keeping the reference pages current

The reference pages are generated from code. After any change to env variables, queues, entities, capabilities, or routes:

```bash
npm run generate
git diff content/docs/reference/
```

Only the rows for your change should differ. A large unexpected diff means the generator missed a pattern. Fix the generator rather than the output.

## Deployment

See the **Deployment** page for the nginx block and the copy step. In short: build, copy `out/` to the server, and serve it under `/docs/`.

import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

/** Architecture handover docs, served at /docs. Source lives in src/content/docs. */
export const docs = defineDocs({
  dir: 'src/content/docs',
});

export default defineConfig();

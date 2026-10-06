import { docs } from '../../../.source';
import { loader } from 'fumadocs-core/source';

/**
 * fumadocs-mdx 11.x hands `files` over as a function, but fumadocs-core 15.x
 * reads it as an array. Resolve it here so the loader gets the array. The cast
 * widens the type because the MDX typings say array only.
 */
const mdxSource = docs.toFumadocsSource() as unknown as {
  files: (() => unknown[]) | unknown[];
};
const files = typeof mdxSource.files === 'function' ? mdxSource.files() : mdxSource.files;

/** Page tree and lookup for every MDX file under src/content/docs. */
export const source = loader({
  baseUrl: '/docs',
  // Shape is checked by the TypeScript build.
  source: { files: files as never },
});

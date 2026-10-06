import { source } from '@/lib/docs/source';
import { createFromSource } from 'fumadocs-core/search/server';

/** Search index for the /docs search box. Built from the MDX pages on each request. */
export const { GET } = createFromSource(source, { language: 'english' });

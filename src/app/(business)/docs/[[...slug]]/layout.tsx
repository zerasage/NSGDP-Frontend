import type { CSSProperties, ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider';
import { SidebarGroupHeader } from '@/components/docs/sidebar-separator';
import { source } from '@/lib/docs/source';

/**
 * Docs shell: Fumadocs sidebar, table of contents and search, styled with the
 * portal tokens (see globals.css). The site navbar above this layout is the
 * only top bar, so Fumadocs' own nav is turned off.
 */
export default function DocsRootLayout({ children }: { children: ReactNode }) {
  // The portal navbar is h-16 (4rem). Fumadocs offsets the sticky sidebar by --fd-nav-height.
  // The navbar is already in normal flow above this layout, so the top padding is removed in globals.css.
  const offset = { '--fd-nav-height': '4rem' } as CSSProperties;

  return (
    <RootProvider theme={{ enabled: false }} search={{ options: { api: '/api/docs-search' } }}>
      <div style={offset}>
        <DocsLayout
          tree={source.pageTree}
          nav={{ enabled: false }}
          sidebar={{ components: { Separator: SidebarGroupHeader } }}
        >
          {children}
        </DocsLayout>
      </div>
    </RootProvider>
  );
}

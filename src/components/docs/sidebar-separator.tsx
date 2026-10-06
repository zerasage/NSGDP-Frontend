'use client';

import type { SidebarComponents } from 'fumadocs-ui/components/layout/sidebar';

/** Bold, uppercase group header for each sidebar section. Client module so the sidebar can receive it. */
export const SidebarGroupHeader: SidebarComponents['Separator'] = ({ item }) => (
  <p className="mt-6 mb-2 px-2 text-xs font-bold uppercase tracking-wider text-fd-foreground">
    {item.name}
  </p>
);

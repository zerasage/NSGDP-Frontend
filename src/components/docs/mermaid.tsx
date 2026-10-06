'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Renders a Mermaid diagram from text in the MDX file.
 * The diagram source stays in git as plain text, so ICT can edit it directly.
 * Mermaid loads in the browser only; the static HTML holds an empty frame.
 */
export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const { resolvedTheme } = useTheme();
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
        fontFamily: 'inherit',
      });
      const { svg: rendered } = await mermaid.render(`m${reactId}${Date.now()}`, chart);
      if (!cancelled) {
        setSvg(rendered);
        setError(null);
      }
    })().catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : String(err));
    });
    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, reactId]);

  return (
    <figure className="my-6">
      {error ? (
        <pre className="overflow-x-auto rounded-lg border border-red-500 p-4 text-sm text-red-500">
          Diagram failed to render: {error}
        </pre>
      ) : (
        <div
          className="overflow-x-auto rounded-lg border bg-fd-card p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}

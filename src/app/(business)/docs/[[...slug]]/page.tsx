import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import type { MDXComponents } from 'mdx/types';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsPage, DocsTitle, type DocsPageProps } from 'fumadocs-ui/page';
import { source } from '@/lib/docs/source';
import { getMDXComponents } from '@/components/docs/mdx-components';
import { CompactFooter } from '@/components/layout/compact-footer';

type Props = { params: Promise<{ slug?: string[] }> };

/**
 * The loader in lib/source.ts does not carry fumadocs-mdx's typed page fields,
 * so the ones this page uses are declared here.
 */
type PageFields = {
  body: ComponentType<{ components?: MDXComponents }>;
  toc: DocsPageProps['toc'];
  full?: boolean;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data as typeof page.data & PageFields;
  const MDX = data.body;

  return (
    <DocsPage toc={data.toc} full={data.full}>
      <DocsTitle>{data.title}</DocsTitle>
      <DocsDescription>{data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
      <CompactFooter />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProject, nextProject, projects } from '@/content/projects';
import { CaseStudy } from '@/components/CaseStudy';
import { Footer } from '@/components/Footer';

export const dynamicParams = false;
export function generateStaticParams() { return projects.map(p => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return (
    <>
      <CaseStudy p={p} next={nextProject(slug)} index={projects.indexOf(p)} total={projects.length} />
      <Footer />
    </>
  );
}

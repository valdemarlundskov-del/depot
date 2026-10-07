// Selvstændig preview af LIQUID: samme komponenter som Next-sitet, men som én side uden server.
import { createRoot } from 'react-dom/client';
import { usePathname } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Manifesto } from '@/components/Manifesto';
import { Work } from '@/components/Work';
import { Services } from '@/components/Services';
import { Playground } from '@/components/Playground';
import { Studio } from '@/components/Studio';
import { Process } from '@/components/Process';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { CaseStudy } from '@/components/CaseStudy';
import { Nav } from '@/components/Nav';
import { Cursor } from '@/components/Cursor';
import { PageEffects } from '@/components/PageEffects';
import { TransitionProvider } from '@/components/Transition';
import { getProject, nextProject, projects } from '@/content/projects';

function Page() {
  const path = usePathname();
  const p = path.startsWith('/work/') ? getProject(path.slice(6)) : undefined;
  if (p) return <><CaseStudy key={p.slug} p={p} next={nextProject(p.slug)} index={projects.indexOf(p)} total={projects.length} /><Footer /></>;
  return <><Hero /><Manifesto /><Work /><Services /><Playground /><Studio /><Process /><Contact /><Footer /></>;
}

function App() {
  return (
    <TransitionProvider>
      <Nav />
      <main id="main"><Page /></main>
      <PageEffects />
      <Cursor />
    </TransitionProvider>
  );
}

createRoot(document.getElementById('app')!).render(<App />);

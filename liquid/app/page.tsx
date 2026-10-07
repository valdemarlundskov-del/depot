import { Hero } from '@/components/Hero';
import { Manifesto } from '@/components/Manifesto';
import { Work } from '@/components/Work';
import { Services } from '@/components/Services';
import { Playground } from '@/components/Playground';
import { Studio } from '@/components/Studio';
import { Process } from '@/components/Process';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Work />
      <Services />
      <Playground />
      <Studio />
      <Process />
      <Contact />
      <Footer />
    </>
  );
}

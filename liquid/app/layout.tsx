import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { Cursor } from '@/components/Cursor';
import { PageEffects } from '@/components/PageEffects';
import { TransitionProvider } from '@/components/Transition';
import './globals.css';

const sans = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'LIQUID® — Independent Creative Studio', template: '%s — LIQUID®' },
  description: 'LIQUID is an independent creative studio shaping ideas into visual experiences: photography, film, creative direction and experimental digital work.',
  robots: { index: false, follow: false },        // konceptversion: skal ikke indekseres ved siden af bkstudio.dk
  icons: { icon: '/media/symbol.svg' },
};

export const viewport: Viewport = { themeColor: '#050505', width: 'device-width', initialScale: 1 };

// Før første billede: .js (så skjulte starttilstande kun bruges, når JS kører), og .intro første gang i sessionen
// (ellers .intro-short). Fejler noget, fjernes intro-klasserne efter 4 sekunder, så indholdet aldrig bliver væk.
const boot = `(function(){var d=document.documentElement;d.classList.add('js');try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r){var s=sessionStorage.getItem('lq-intro');d.classList.add(s?'intro-short':'intro');sessionStorage.setItem('lq-intro','1');setTimeout(function(){d.classList.add('intro-done')},4000)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <TransitionProvider>
          <Nav />
          <main id="main">{children}</main>
          <PageEffects />
          <Cursor />
        </TransitionProvider>
      </body>
    </html>
  );
}

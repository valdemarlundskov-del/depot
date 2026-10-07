// Projekterne er BK Studios egne. Tilføj et nyt projekt ved at lægge billeder i public/media/<slug>/(lg|sm)
// (scripts/media.py gør det fra hovedsitet) og tilføje et objekt herunder. Layout vælger, hvordan det vises på forsiden.
import media from './media.json';

export type Layout = 'cinematic' | 'asymmetric' | 'sequence' | 'fullscreen';

export type Img = { src: string; sm: string; w: number; h: number; alt: string };

export type Project = {
  slug: string;
  title: string;
  client: string;
  category: string;
  year: string;
  location: string;
  summary: string;
  approach: string;
  layout: Layout;
  cover: Img;
  alt: Img;           // det andet billede, som den flydende maske afslører ved hover
  gallery: Img[];
  info: { label: string; value: string }[];
};

type MediaSet = keyof typeof media;

function img(set: MediaSet, file: string, alt: string): Img {
  const m = media[set].find(x => x.file === file.replace(/(\.webp)?$/, '.webp'));
  if (!m) throw new Error(`Mangler billede: ${set}/${file}`);
  return { src: `/media/${set}/lg/${m.file}`, sm: `/media/${set}/sm/${m.file}`, w: m.w, h: m.h, alt };
}
const all = (set: MediaSet, alt: string) => media[set].map((m, i) => img(set, m.file, `${alt} — frame ${i + 1}`));

export const projects: Project[] = [
  {
    slug: 'porsche-924',
    title: 'Porsche 924',
    client: 'Private project',
    category: 'Photography / Automotive',
    year: '2026',
    location: 'Denmark',
    summary: 'Photography of a classic Porsche 924 — a private project focused on details, lines and the car’s raw, timeless style.',
    approach: 'We let the car set the pace: close crops of badges, wheels and body lines, alternated with wider frames that place it in plain daylight. No staging beyond what the car already had.',
    layout: 'cinematic',
    cover: img('porsche924', 'DSC03358', 'White Porsche 924 rear with the 924 badge'),
    alt: img('porsche924', 'DSC03314', 'Porsche 924 rear lights and number plate'),
    gallery: all('porsche924', 'Porsche 924'),
    info: [{ label: 'Discipline', value: 'Photography' }, { label: 'Frames', value: '16' }],
  },
  {
    slug: 'vildbjerg-cup',
    title: 'Vildbjerg Cup',
    client: 'Vildbjerg Cup',
    category: 'Photography / Content',
    year: '2026',
    location: 'Vildbjerg, Denmark',
    summary: 'Photo and content from Vildbjerg Cup — the atmosphere, the matches and the people on and around the pitch during the tournament.',
    approach: 'Moving with the games rather than around them: the players, the pauses between whistles and the long light of summer evenings.',
    layout: 'asymmetric',
    cover: img('vildbjerg', 'DSC04203', 'Player in a white number 10 shirt in evening light'),
    alt: img('vildbjerg', 'DSC04164', 'Player number 18 seen from behind on the pitch'),
    gallery: all('vildbjerg', 'Vildbjerg Cup'),
    info: [{ label: 'Discipline', value: 'Photography, content' }, { label: 'Frames', value: '15' }],
  },
  {
    slug: 'thailand',
    title: 'Thailand',
    client: 'Personal work',
    category: 'Travel photography',
    year: '2026',
    location: 'Thailand',
    summary: 'Travel photography from Thailand — people, places and moments captured along the way.',
    approach: 'Shot on the move with a small kit, following colour and water from limestone cliffs to harbour fronts.',
    layout: 'sequence',
    cover: img('thailand', 'DSC03544', 'Limestone cliffs above turquoise water'),
    alt: img('thailand', 'DSC03429', 'Green limestone island rising from the sea'),
    gallery: all('thailand', 'Thailand'),
    info: [{ label: 'Discipline', value: 'Photography' }, { label: 'Frames', value: '10' }],
  },
  {
    slug: 'landscapes',
    title: 'Landscapes',
    client: 'Personal series',
    category: 'Photography',
    year: '2025—26',
    location: 'Various',
    summary: 'An ongoing personal series of coastlines, cities and quiet architecture, photographed between commissions.',
    approach: 'Patient frames with a lot of air: horizons, lighthouses and stone, often waiting for the light rather than chasing it.',
    layout: 'fullscreen',
    cover: img('landskab', 'A7S07641', 'Lighthouse on a rock in calm blue water'),
    alt: img('landskab', 'A7S07624', 'Speedboat cutting across open water'),
    gallery: all('landskab', 'Landscapes'),
    info: [{ label: 'Discipline', value: 'Photography' }, { label: 'Status', value: 'Ongoing' }],
  },
];

export const getProject = (slug: string) => projects.find(p => p.slug === slug);
export const nextProject = (slug: string) => {
  const i = projects.findIndex(p => p.slug === slug);
  return projects[(i + 1) % projects.length];
};

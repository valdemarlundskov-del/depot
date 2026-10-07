// Alt redigerbart indhold om studiet samlet ét sted. Animationerne læser herfra og skal ikke røres for at ændre tekst.

export const site = {
  name: 'LIQUID',
  descriptor: 'Independent Creative Studio',
  tagline: 'NOTHING STAYS STILL.',
  heroLine: 'An independent creative studio shaping ideas into visual experiences.',
  // Konceptet kører foreløbig under BK Studios navn, mail og profiler.
  operatedBy: 'BK Studio',
  email: 'kontakt@bkstudio.dk',
  location: 'Midtsjælland, Denmark',
  coords: '55.47° N / 11.62° E',
  availability: 'Available for select projects',
  socials: [
    { label: 'Instagram', handle: '@bkstudiodk', href: 'https://www.instagram.com/bkstudiodk/' },
    { label: 'Basharat', handle: '@photo.basharat', href: 'https://www.instagram.com/photo.basharat/' },
    { label: 'Valdemar', handle: '@kurevisuals', href: 'https://www.instagram.com/kurevisuals/' },
  ],
  nav: [
    { label: 'Work', href: '/#work' },
    { label: 'Studio', href: '/#studio' },
    { label: 'Services', href: '/#services' },
    { label: 'Contact', href: '/#contact' },
  ],
} as const;

export const manifesto = {
  lines: ['WE BELIEVE', 'NOTHING SHOULD', 'STAY STILL.'],
  body: 'Ideas evolve. Images change the way we see. Motion creates emotion. We explore the space between concept and execution to create visual work with character, clarity and purpose.',
};

export const services = [
  {
    n: '01', title: 'Photography', media: 'photo',
    text: 'Distinctive imagery for brands, campaigns, people, products, automotive projects, events and editorial applications.',
  },
  {
    n: '02', title: 'Film & Motion', media: 'film',
    text: 'Cinematic filmmaking, brand films, promotional videos, short-form content, event films and moving-image storytelling.',
  },
  {
    n: '03', title: 'Creative Direction', media: 'direction',
    text: 'Concept development, visual identity direction, campaign concepts, art direction and the development of a coherent visual language.',
  },
  {
    n: '04', title: 'Content Production', media: 'production',
    text: 'End-to-end production, from initial ideas and planning to photography, filming, editing and final delivery.',
  },
  {
    n: '05', title: 'Digital & Experimental', media: 'digital',
    text: 'Motion-led digital experiences, visual experiments, interactive concepts and creative applications of 3D.',
  },
] as const;

export const process = [
  { n: '01', title: 'Discover', text: 'Understand the brief, audience, goals and creative opportunity.' },
  { n: '02', title: 'Define', text: 'Develop the concept, direction, visual language and production plan.' },
  { n: '03', title: 'Create', text: 'Produce the photography, film, design and supporting creative assets.' },
  { n: '04', title: 'Deliver', text: 'Refine, edit and deliver the finished work in the formats required for its intended use.' },
];

// Rigtige mennesker, roller og profiler fra BK Studio (om-os på hovedsitet).
export const team = [
  {
    name: 'Valdemar Kure Lundskov',
    role: 'Founder · Creative Direction · Photo · Film',
    img: '/media/team/valdemar.webp',
    handle: '@kurevisuals', href: 'https://www.instagram.com/kurevisuals/',
  },
  {
    name: 'Basharat Ullah Dar',
    role: 'Co-founder · Photo · Film · Edit',
    img: '/media/team/basharat.webp',
    handle: '@photo.basharat', href: 'https://www.instagram.com/photo.basharat/',
  },
];

export const contactOptions = {
  types: ['Photography', 'Film & Motion', 'Creative Direction', 'Content Production', 'Digital / 3D', 'Not sure yet'],
  budgets: ['< 10k DKK', '10–25k DKK', '25–50k DKK', '50k+ DKK', 'Let’s talk'],
  timeframes: ['As soon as possible', 'Within a month', '1–3 months', 'Flexible'],
};

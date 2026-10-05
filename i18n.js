/* BK Studio — sprog (dansk / engelsk).
   Siden er skrevet på dansk. Vælges engelsk, oversættes teksten i browseren, før noget vises, og valget huskes (localStorage).
   Et link kan vælge sprog med ?lang=en eller ?lang=da. Tekster, der oprettes senere af andre scripts, oversættes også. */
(function () {
  'use strict';
  var KEY = 'bklang', lang = 'da', qm = /[?&]lang=(en|da)\b/.exec(location.search);
  // valget gemmes i browseren (localStorage). Hvis den er spærret (fx i en indlejret forhåndsvisning), bruges vinduets navn i stedet
  function getStored() { try { return localStorage.getItem(KEY); } catch (e) { var m = /(?:^|;)bklang=(en|da)/.exec(window.name || ''); return m ? m[1] : null; } }
  function setStored(v) { try { localStorage.setItem(KEY, v); } catch (e) { window.name = (window.name || '').replace(/(?:^|;)bklang=(?:en|da)/, '') + ';bklang=' + v; } }
  if (qm) setStored(qm[1]);
  lang = getStored() === 'en' ? 'en' : 'da';
  window.BK_LANG = lang;
  document.documentElement.setAttribute('lang', lang);

  // sprogknapperne (header og footer) virker i begge sprog
  function mark() {
    var bs = document.querySelectorAll('.lang button');
    for (var i = 0; i < bs.length; i++) { var on = bs[i].getAttribute('data-lang') === lang; bs[i].classList.toggle('on', on); bs[i].setAttribute('aria-pressed', on ? 'true' : 'false'); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.lang button'); if (!b) return;
    var l = b.getAttribute('data-lang'); if (!l || l === lang) return;
    setStored(l);
    try { sessionStorage.setItem('bknav', '1'); } catch (err) {}                                     // bknav: ingen indlæsningsscene ved skift
    try { var u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); history.replaceState(null, '', u.pathname + u.search + u.hash); } } catch (err2) {}
    location.reload();
  });
  mark();
  var pend = document.documentElement.classList; pend.remove('i18n-pending');
  if (lang !== 'en') return;
  pend.add('i18n-pending');

  var EN = {
 "Foto, video & content til virksomheder, events og private.": "Photo, video & content for businesses, events and private clients.",
 "Scroll ned": "Scroll down",
 "Foto": "Photo",
 "Vi har arbejdet for": "We've worked for",
 "Foto, video og content til virksomheder, events og private. Vi står selv bag kameraet og følger opgaven fra den første idé til det færdige resultat.": "Photo, video and content for businesses, events and private clients. We stand behind the camera ourselves and follow every job from the first idea to the finished result.",
 "Start et projekt": "Start a project",
 "Start et projekt her →": "Start a project here →",
 "Vi skaber billeder, der bliver hængende.": "We create images that stay with you.",
 "Fra sport og events til biler og rejser — vi fortæller historier gennem billeder.": "From sports and events to cars and travel — we tell stories through images.",
 "Se alt arbejde": "See all work",
 "Kreativt håndværk. Tilpasset opgaven.": "Creative craft. Tailored to the job.",
 "Fra den første idé til det færdige resultat tilpasser vi hver opgave, så du ender med præcis det, du har brug for.": "From the first idea to the finished result, we tailor every job so you end up with exactly what you need.",
 "Til virksomheder": "For businesses",
 "Foto og video, der matcher jeres brand.": "Photo and video that match your brand.",
 "Til hjemmeside, sociale medier og kampagner": "For websites, social media and campaigns",
 "Reels og korte videoer, I kan blive ved med at poste": "Reels and short videos you can keep posting",
 "Ét sted fra idé til færdigt indhold": "One place from idea to finished content",
 "Til events, sport & foreninger": "For events, sports & clubs",
 "Vi fanger stemningen og de afgørende øjeblikke.": "We capture the atmosphere and the decisive moments.",
 "Sportskampe, koncerter og events": "Matches, concerts and events",
 "Foto og video fra første fløjt til sidste klap": "Photo and video from the first whistle to the final applause",
 "Vi rykker ud i hele landet": "We travel all over the country",
 "Til private": "For private clients",
 "Fra portrætter til mærkedage.": "From portraits to milestone days.",
 "De private øjeblikke, der er værd at gemme": "The personal moments worth keeping",
 "Ingen færdig plan nødvendig": "No finished plan needed",
 "Vi finder løsningen sammen": "We find the solution together",
 "Din opgave?": "Your project?",
 "Har du noget andet i tankerne? Vi hører gerne om det, uanset størrelsen.": "Have something else in mind? We'd love to hear about it, whatever the size.",
 "Fortæl os om den": "Tell us about it",
 "Sådan arbejder vi": "How we work",
 "Fra første besked til færdigt materiale — enkelt og uden en masse formularer.": "From the first message to the finished material — simple, and without a lot of forms.",
 "Fortæl os om opgaven": "Tell us about the job",
 "Skriv kort, hvad du har brug for, og hvor materialet skal bruges. Du behøver ikke have en færdig plan.": "Write briefly what you need and where the material will be used. You don't need a finished plan.",
 "Du får et klart tilbud": "You get a clear quote",
 "Vi lægger en plan sammen og aftaler omfang og leveringstid, før vi går i gang.": "We make a plan together and agree on scope and delivery time before we start.",
 "Vi optager og leverer": "We shoot and deliver",
 "Vi står selv bag kameraet og redigerer, og du får det færdige materiale.": "We stand behind the camera and edit ourselves, and you receive the finished material.",
 "Vi bygger BK Studio omkring det, vi selv har lyst til at se. Nogle projekter er store, andre er små — det ændrer ikke på, hvor meget vi går op i dem.": "We build BK Studio around what we ourselves want to see. Some projects are big, others small — it doesn't change how much we care about them.",
 "Om os": "About us",
 "Mød teamet": "Meet the team",
 "Skriv til os — så tager vi den derfra.": "Write to us — and we'll take it from there.",
 "København": "Copenhagen",
 "Lad os bringe din idé til live": "Let's bring your idea to life",
 "Har du et projekt, en idé, eller vil du bare høre, hvad vi kan hjælpe med? Skriv kort, hvad du har brug for, så vender vi tilbage.": "Have a project, an idea, or just want to hear what we can help with? Write briefly what you need and we'll get back to you.",
 "Midtsjælland, Danmark": "Central Zealand, Denmark",
 "Navn": "Name",
 "Telefon": "Phone",
 "(valgfrit)": "(optional)",
 "Virksomhed": "Company",
 "Besked": "Message",
 "Lad dette felt være tomt": "Leave this field empty",
 "privatlivspolitikken": "privacy policy",
 "Send besked": "Send message",
 "Ofte stillede spørgsmål": "Frequently asked questions",
 "Hvilke opgaver kan I løse for os?": "What jobs can you do for us?",
 "Vi laver foto, video og content til virksomheder, foreninger, events og private — fra enkelte billeder til jeres hjemmeside og sociale medier til større opgaver som sportsfotografi og eventdækning. Omfanget tilpasser vi altid til den konkrete opgave.": "We make photo, video and content for businesses, clubs, events and private clients — from individual images for your website and social media to bigger jobs like sports photography and event coverage. We always tailor the scope to the job at hand.",
 "Hvad skal vi regne med at betale?": "What should we expect to pay?",
 "Prisen afhænger af opgavens varighed, hvor meget materiale der skal leveres, og hvad det hele skal bruges til. Skriv til os, så finder vi et omfang, der giver mening — og du får et klart tilbud, før vi går i gang.": "The price depends on how long the job takes, how much material is delivered and what it will all be used for. Write to us and we'll find a scope that makes sense — and you get a clear quote before we start.",
 "Er I kun tilgængelige i Midtsjælland?": "Are you only available in Central Zealand?",
 "Nej, slet ikke. Vi holder til i Midtsjælland, men kører gerne opgaver i resten af landet — location og transport finder vi ud af sammen.": "Not at all. We're based in Central Zealand, but we're happy to take jobs in the rest of the country — we'll work out location and transport together.",
 "Skal jeg have en færdig plan, før jeg skriver til jer?": "Do I need a finished plan before I write to you?",
 "Overhovedet ikke. Fortæl os, hvad du håber at opnå, og hvor materialet skal bruges, så finder vi sammen frem til, om det bliver foto, video, content — eller en blanding.": "Not at all. Tell us what you hope to achieve and where the material will be used, and together we'll work out whether it should be photo, video, content — or a mix.",
 "Hvor lang er leveringstiden?": "How long is the delivery time?",
 "Det kommer an på opgavens omfang og typen af materiale. Vi aftaler altid en leveringstid på forhånd, så du ved, hvornår du kan forvente det færdige resultat — har du en deadline, så nævn den bare i din forespørgsel.": "It depends on the scope of the job and the type of material. We always agree on a delivery time in advance, so you know when to expect the finished result — if you have a deadline, just mention it in your request.",
 "Hvordan kommer vi i gang?": "How do we get started?",
 "Foto / Video / Content": "Photo / Video / Content",
 "Billeder og video, der bliver hængende, længe efter de er taget.": "Images and video that stay with you, long after they were taken.",
 "Arbejde": "Work",
 "Arkiv": "Archive",
 "Kontakt": "Contact",
 "Sociale medier": "Social media",
 "© 2026 BK Studio. Alle rettigheder forbeholdes.": "© 2026 BK Studio. All rights reserved.",
 "Privatlivspolitik": "Privacy policy",
 "Founder, creative lead, videograf og fotograf": "Founder, creative lead, videographer and photographer",
 "Co-founder, fotograf og redigør": "Co-founder, photographer and editor",
 "Mød Valdemar Kure Lundskov": "Meet Valdemar Kure Lundskov",
 "Jeg har altid været fascineret af det visuelle — især hvordan et billede eller en video kan fortælle noget, uden at man behøver sige ret meget.": "I've always been fascinated by the visual — especially how an image or a video can tell you something without needing to say much.",
 "Jeg arbejder primært med foto, video, idéudvikling og produktion. Jeg kan godt lide hele processen fra den første idé til det færdige resultat, og jeg går meget op i, at det endelige content ikke bare ser godt ud, men faktisk passer til det brand og den historie, det skal repræsentere.": "I mainly work with photo, video, concept development and production. I like the whole process from the first idea to the finished result, and I care a lot that the final content doesn't just look good, but actually fits the brand and the story it is meant to represent.",
 "Jeg arbejder bedst, når der er plads til at tænke kreativt, prøve ting af og finde en løsning, der føles anderledes end det forventelige. For mig handler godt content om stemning, detaljer og autenticitet — og om at skabe noget, man husker.": "I work best when there's room to think creatively, try things out and find a solution that feels different from the expected. To me, good content is about atmosphere, detail and authenticity — and about creating something people remember.",
 "Jeg kan især godt lide produktioner, hvor man ikke behøver overgøre det visuelle for at få noget til at fungere. En god idé, den rigtige timing og et skarpt blik for detaljerne kan ofte gøre mere end en masse effekter. Derfor prøver jeg altid at finde det udtryk, der passer naturligt til projektet og menneskene bag.": "I especially like productions where you don't have to overdo the visuals to make something work. A good idea, the right timing and a sharp eye for detail can often do more than a lot of effects. That's why I always try to find the expression that fits naturally with the project and the people behind it.",
 "Mød Basharat Ullah Dar": "Meet Basharat Ullah Dar",
 "Jeg arbejder med foto, video, redigering og instruktion og brænder især for at skabe et stærkt visuelt udtryk fra idé til færdig produktion.": "I work with photo, video, editing and direction, and I'm especially passionate about creating a strong visual expression from idea to finished production.",
 "Jeg ser kameraet som mere end bare et værktøj. Det handler om at finde den rigtige vinkel, bevægelse, stemning og fortælling, så contentet føles levende og har en klar identitet.": "I see the camera as more than just a tool. It's about finding the right angle, movement, mood and story, so the content feels alive and has a clear identity.",
 "I BK Studio er jeg med til at udvikle idéerne, instruere og forme det visuelle udtryk. Jeg går op i detaljerne og i at få produktionen til at føles naturlig — samtidig med at der er en tydelig tanke bag.": "At BK Studio I help develop the ideas, direct and shape the visual expression. I care about the details and about making the production feel natural — while there is a clear thought behind it.",
 "Jeg tror på, at det bedste content opstår, når idé, mennesker og det visuelle udtryk arbejder sammen.": "I believe the best content happens when idea, people and visual expression work together.",
 "Jeg går meget op i, at en produktion både skal være gennemført og rar at være en del af. God kommunikation og en klar idé gør det lettere at skabe billeder og videoer, der føles ægte, samtidig med at de har et professionelt udtryk.": "I care a lot that a production should be both polished and pleasant to be part of. Good communication and a clear idea make it easier to create images and videos that feel genuine, while still having a professional look.",
 "Mød resten af holdet": "Meet the rest of the team",
 "Hvem står bag?": "Who's behind it?",
 "Om BK Studio": "About BK Studio",
 "BK Studio er et kreativt studio inden for foto, film og visuelt content, skabt af Basharat Ullah Dar og Valdemar Kure Lundskov.": "BK Studio is a creative studio for photo, film and visual content, founded by Basharat Ullah Dar and Valdemar Kure Lundskov.",
 "Vi startede BK Studio, fordi vi gerne ville skabe noget sammen. Noget, hvor vi selv kunne stå bag kameraet, være en del af idéen og følge projekterne hele vejen fra første tanke til det færdige resultat.": "We started BK Studio because we wanted to create something together. Something where we could stand behind the camera ourselves, be part of the idea and follow the projects all the way from the first thought to the finished result.",
 "Vi arbejder med foto, video og content, men det vigtigste for os er altid det samme: at skabe noget, vi selv har lyst til at se. Nogle projekter er store. Andre er små. Det ændrer ikke på, hvor meget vi går op i dem.": "We work with photo, video and content, but the most important thing for us is always the same: to create something we ourselves want to see. Some projects are big. Others are small. It doesn't change how much we care about them.",
 "Seneste projekt": "Latest project",
 "Scroll videre — projektet folder sig ud, så du kan se mere end forsiden.": "Keep scrolling — the project unfolds so you can see more than the front page.",
 "Alle projekter": "All projects",
 "Klik på et projekt for at se billeder og detaljer.": "Click a project to see images and details.",
 "Om projektet": "About the project",
 "Når billederne betyder noget, skal de tages ordentligt.": "When the images matter, they should be done properly.",
 "Næste projekt": "Next project",
 "Se projektet": "View project",
 "Luk": "Close",
 "Billedarkiv": "Image archive",
 "Træk for at flytte · Klik for at åbne": "Drag to move · Click to open",
 "Swipe for at flytte · Tryk for at åbne": "Swipe to move · Tap to open",
 "Se alle billeder ↓": "See all images ↓",
 "Alle billeder samlet ét sted. Hold musen over for at se dem i farve, og klik for at åbne dem stort.": "All images in one place. Hover to see them in colour, and click to open them large.",
 "Luk ✕": "Close ✕",
 "Filtrér billeder": "Filter images",
 "Forrige billede": "Previous image",
 "Næste billede": "Next image",
 "Billedvisning": "Image viewer",
 "Kontakt os": "Contact us",
 "Skriv til os.": "Write to us.",
 "Har du et projekt, en idé, eller vil du bare høre, hvad vi kan hjælpe med?": "Have a project, an idea, or just want to hear what we can help with?",
 "BK Studio — Foto, video & content": "BK Studio — Photo, video & content",
 "Danmark": "Denmark",
 "Lad os skabe noget, der føles rigtigt.": "Let's create something that feels right.",
 "Fortæl os lidt om projektet. På fem enkle trin får vi de vigtigste detaljer på plads — uden lange formularer.": "Tell us a little about the project. In five simple steps we get the key details in place — without long forms.",
 "Hvad skal du bruge?": "What do you need?",
 "Fotografering": "Photography",
 "Beskriv opgaven på næste side": "Describe the job on the next page",
 "Videoproduktion": "Video production",
 "Andet": "Other",
 "Fortæl gerne mere på næste side": "Tell us more on the next page",
 "Fortæl os om idéen.": "Tell us about the idea.",
 "Et par linjer er rigeligt. Hvad skal laves, og hvor skal det foregå?": "A couple of lines is plenty. What should be made, and where will it take place?",
 "Projektbeskrivelse": "Project description",
 "Hvornår, og hvad er rammen?": "When, and what are the limits?",
 "Har du en deadline, et ønsket tidspunkt eller et budget i tankerne? Skriv det gerne — ellers finder vi det sammen.": "Do you have a deadline, a preferred time or a budget in mind? Feel free to write it — otherwise we'll work it out together.",
 "Ønsket tidsramme": "Preferred timeframe",
 "Hvem skal vi kunne fange?": "How can we reach you?",
 "Vi bruger oplysningerne til at vende tilbage personligt.": "We use the details to get back to you personally.",
 "Sidste detaljer. Så tager vi den.": "Last details. Then we'll take it from there.",
 "Tilføj det, du synes vi bør vide, og gennemgå derefter din forespørgsel.": "Add whatever you think we should know, then review your request.",
 "En sidste besked": "A final message",
 "Ved at sende din forespørgsel giver du os lov til at kontakte dig om projektet.": "By sending your request you give us permission to contact you about the project.",
 "← Tilbage": "← Back",
 "Næste side →": "Next page →",
 "Send forespørgsel": "Send request",
 "Juridisk": "Legal",
 "Dataansvarlig": "Data controller",
 "Oplysninger vi behandler": "Information we process",
 "Når du kontakter BK Studio, kan du vælge at sende oplysninger som navn, e-mailadresse, virksomhed og en beskrivelse af dit projekt. Vi bruger oplysningerne til at besvare din henvendelse og kommunikere med dig om dit projekt.": "When you contact BK Studio, you can choose to send information such as your name, email address, company and a description of your project. We use the information to answer your enquiry and to communicate with you about your project.",
 "Opbevaring og deling": "Storage and sharing",
 "Vi opbevarer kun personoplysninger så længe, det er nødvendigt for det formål, de blev indsamlet til, eller så længe vi er forpligtet til det efter gældende regler. Oplysningerne deles ikke med tredjeparter til markedsføring. Hjemmesiden driftes hos Vercel Inc., og vores e-mail leveres af Simply.com A/S. De behandler oplysningerne på vores vegne som databehandlere.": "We only keep personal data for as long as is necessary for the purpose it was collected for, or for as long as we are required to by applicable rules. The information is not shared with third parties for marketing. The website is hosted by Vercel Inc., and our email is provided by Simply.com A/S. They process the information on our behalf as data processors.",
 "Dine rettigheder": "Your rights",
 "Hjemmesiden bruger ingen cookies til sporing eller markedsføring, og vi måler ikke selv dine besøg. Siden bruger browserens midlertidige lager (sessionStorage) til at huske, at du allerede har set åbningen, mens fanen er åben. Det slettes, når du lukker fanen.": "The website uses no cookies for tracking or marketing, and we do not measure your visits ourselves. The site uses the browser's temporary storage (sessionStorage) to remember that you have already seen the opening while the tab is open. It is deleted when you close the tab.",
 "Spørgsmål": "Questions",
 "Sidst opdateret: 5. oktober 2026.": "Last updated: 5 October 2026.",
 "Skriften på siden Om os leveres af Adobe Fonts (Adobe Systems Software Ireland Ltd.). Når du åbner den side, henter din browser skriften direkte fra Adobes servere, og Adobe modtager derfor din IP-adresse og oplysninger om din browser. Vi får ikke oplysninger om dig fra Adobe. Læs mere i Adobes egen privatlivspolitik.": "The font on the About us page is provided by Adobe Fonts (Adobe Systems Software Ireland Ltd.). When you open that page, your browser fetches the font directly from Adobe's servers, so Adobe receives your IP address and information about your browser. We do not receive any information about you from Adobe. You can read more in Adobe's own privacy policy.",
 "Fejl 404": "Error 404",
 "Siden findes ikke": "Page not found",
 "Linket er forkert, eller siden er blevet flyttet. Klik på logoet for at komme tilbage til forsiden, eller se, hvad vi har lavet.": "The link is wrong, or the page has been moved. Click the logo to go back to the front page, or see what we've made.",
 "Se vores arbejde": "See our work",
 "Har du noget,<br>der skal skabes?": "Got something<br>that needs creating?",
 "Jeg accepterer <a href=\"/privatlivspolitik\">privatlivspolitikken</a>": "I accept the <a href=\"/privatlivspolitik\">privacy policy</a>",
 "Send en forespørgsel via <a href=\"/book\">Start et projekt</a>, eller skriv direkte til os. Giv os et kort rids af opgaven, så vender vi tilbage, lægger en plan sammen — og herfra står vi for resten.": "Send a request via <a href=\"/book\">Start a project</a>, or write to us directly. Give us a short outline of the job, and we'll get back to you, make a plan together — and from there we take care of the rest.",
 "Har du ikke helt styr på idéen endnu? Det behøver du heller ikke. Skriv til os, så finder vi ud af det sammen.<br>Har du derimod allerede besluttet dig? <a href=\"/book\">Start et projekt her →</a>": "Haven't quite got the idea nailed down yet? You don't need to. Write to us and we'll figure it out together.<br>Already made up your mind? <a href=\"/book\">Start a project here →</a>",
 "Telefon <span class=\"optional\">(valgfrit)</span>": "Phone <span class=\"optional\">(optional)</span>",
 "Virksomhed <span class=\"optional\">(valgfrit)</span>": "Company <span class=\"optional\">(optional)</span>",
 "TRIN <strong id=\"wizardStepNum\">1</strong> AF <span id=\"wizardStepTotal\">5</span>": "STEP <strong id=\"wizardStepNum\">1</strong> OF <span id=\"wizardStepTotal\">5</span>",
 "<strong>Basharat &amp; Valdemar</strong> svarer personligt — <a href=\"/kontakt\">kontakt@bkstudio.dk</a>": "<strong>Basharat &amp; Valdemar</strong> reply personally — <a href=\"/kontakt\">kontakt@bkstudio.dk</a>",
 "Dataansvarlig for behandlingen af dine oplysninger er BK Studio v/ Basharat Ullah Dar og Valdemar Kure Lundskov, Midtsjælland, Danmark. Du kan kontakte os på <a href=\"/kontakt\">kontakt@bkstudio.dk</a>.": "The data controller for the processing of your information is BK Studio, run by Basharat Ullah Dar and Valdemar Kure Lundskov, Central Zealand, Denmark. You can contact us at <a href=\"/kontakt\">kontakt@bkstudio.dk</a>.",
 "Når du udfylder kontakt- eller bookingformularen, sendes oplysningerne direkte fra vores server til <a href=\"/kontakt\">kontakt@bkstudio.dk</a>. Du modtager en automatisk bekræftelse på den e-mailadresse, du har oplyst, og bekræftelsen indeholder en kopi af det, du har skrevet. Dine oplysninger bruges udelukkende til at besvare din henvendelse.": "When you fill in the contact or booking form, the information is sent directly from our server to <a href=\"/kontakt\">kontakt@bkstudio.dk</a>. You receive an automatic confirmation at the email address you provided, and the confirmation contains a copy of what you wrote. Your information is used only to answer your enquiry.",
 "Du har ret til at få indsigt i de oplysninger, vi har om dig, og til at få dem rettet eller slettet. Du kan også gøre indsigelse mod behandlingen eller bede om, at den begrænses. Skriv til <a href=\"/kontakt\">kontakt@bkstudio.dk</a>, hvis du vil bruge dine rettigheder. Mener du, at vi behandler dine oplysninger forkert, kan du klage til Datatilsynet (datatilsynet.dk).": "You have the right to access the information we hold about you, and to have it corrected or deleted. You can also object to the processing or ask for it to be restricted. Write to <a href=\"/kontakt\">kontakt@bkstudio.dk</a> if you want to exercise your rights. If you believe we are processing your information incorrectly, you can complain to the Danish Data Protection Agency (datatilsynet.dk).",
 "Har du spørgsmål til denne politik, er du velkommen til at skrive til <a href=\"/kontakt\">kontakt@bkstudio.dk</a>.": "If you have questions about this policy, you are welcome to write to <a href=\"/kontakt\">kontakt@bkstudio.dk</a>.",
 "Menu": "Menu",
 "Udvalgte projekter": "Selected projects",
 "Portræt": "Portrait",
 "Billeder fra vejen": "Pictures from the road",
 "Skriv kort, hvad du har brug for foto eller video til…": "Write briefly what you need photo or video for…",
 "Til toppen af forsiden": "To the top of the home page",
 "F.eks. en kampagne, portrætter, content til sociale medier…": "E.g. a campaign, portraits, content for social media…",
 "F.eks. inden for 2 uger, medio juni…": "E.g. within 2 weeks, mid-June…",
 "F.eks. 1.500-3.000 kr., eller et cirka-tal": "E.g. DKK 1,500–3,000, or a rough figure",
 "Referencer, ønsker, særlige detaljer…": "References, wishes, special details…",
 "BK Studio — foto, video og content skabt af Basharat Ullah Dar og Valdemar Kure Lundskov i Danmark.": "BK Studio — photo, video and content by Basharat Ullah Dar and Valdemar Kure Lundskov in Denmark.",
 "Foto / Video / Content — BK Studio": "Photo / Video / Content — BK Studio",
 "BK Studio — Foto, video og content": "BK Studio — Photo, video and content",
 "BK Studio — dansk foto, video og content af Basharat Ullah Dar og Valdemar Kure Lundskov.": "BK Studio — Danish photo, video and content by Basharat Ullah Dar and Valdemar Kure Lundskov.",
 "Om os — BK Studio": "About us — BK Studio",
 "Vi er Basharat og Valdemar — to fotografer, der driver BK Studio sammen.": "We are Basharat and Valdemar — two photographers who run BK Studio together.",
 "Arbejde — BK Studio": "Work — BK Studio",
 "Foto og content fra projekter, hvor vi har fået lov til at fortælle historier gennem billeder.": "Photo and content from projects where we've been allowed to tell stories through images.",
 "Arkivet: alle billeder fra BK Studio samlet ét sted. Filtrér på projekt og åbn billederne i fuld størrelse.": "The archive: all images from BK Studio in one place. Filter by project and open the images at full size.",
 "Arkiv — BK Studio": "Archive — BK Studio",
 "Kontakt — BK Studio": "Contact — BK Studio",
 "Har du et projekt, en idé, eller vil du bare høre, hvad vi kan hjælpe med? Skriv til BK Studio.": "Have a project, an idea, or just want to hear what we can help with? Write to BK Studio.",
 "Start et projekt — BK Studio": "Start a project — BK Studio",
 "Fortæl os lidt om projektet. På fem enkle trin får vi de vigtigste detaljer på plads.": "Tell us a little about the project. In five simple steps we get the key details in place.",
 "Privatlivspolitik — BK Studio": "Privacy policy — BK Studio",
 "Privatlivspolitik for BK Studio.": "Privacy policy for BK Studio.",
 "Siden findes ikke — BK Studio": "Page not found — BK Studio",
 "Siden findes ikke. Gå til forsiden af BK Studio.": "Page not found. Go to the BK Studio home page.",
 "Hop til indhold": "Skip to content",
 "Se projekt": "View project",
 "Se hele projektet": "View the full project",
 "Alle": "All",
 "Landskab": "Landscape",
 "Fotografi": "Photography",
 "Kategori": "Category",
 "År": "Year",
 "Sted": "Location",
 "Billeder": "Images",
 "Fotografi af en klassisk Porsche 924 — et privat projekt, hvor vi fokuserede på detaljer, linjer og bilens rå, tidløse stil.": "Photography of a classic Porsche 924 — a private project where we focused on details, lines and the car's raw, timeless style.",
 "Foto og content fra Vildbjerg Cup — vi dokumenterede stemningen, kampene og menneskerne på og omkring banen under turneringen.": "Photo and content from Vildbjerg Cup — we documented the atmosphere, the matches and the people on and around the pitch during the tournament.",
 "Rejsefotografi fra Thailand — mennesker, steder og øjeblikke fanget undervejs.": "Travel photography from Thailand — people, places and moments captured along the way.",
 "Beskeden kunne ikke sendes lige nu. Prøv igen om lidt, eller skriv direkte til kontakt@bkstudio.dk.": "The message could not be sent right now. Please try again in a moment, or write directly to kontakt@bkstudio.dk.",
 "Tak! Din besked er sendt — vi vender tilbage hurtigst muligt.": "Thank you! Your message has been sent — we'll get back to you as soon as possible.",
 "Beskeden kunne ikke sendes. Prøv igen senere.": "The message could not be sent. Please try again later.",
 "Udfyld alle felter for at sende bookingen.": "Fill in all fields to send the booking.",
 "Tak! Din forespørgsel er sendt — vi vender tilbage hurtigst muligt.": "Thank you! Your request has been sent — we'll get back to you as soon as possible.",
 "Bookingen kunne ikke sendes. Prøv igen senere.": "The booking could not be sent. Please try again later."
};
  var PATTERNS = [["^Projekt (\\d+) / (\\d+)$", "Project $1 / $2"], ["^(\\d+) billeder$", "$1 images"], ["^Se projektet (.+)$", "View project $1"], ["^Åbn billede: (.+)$", "Open image: $1"], ["^Der opstod en fejl ved afsendelsen: (.*)$", "An error occurred while sending: $1"], ["^(.+) — Om os \\| BK Studio$", "$1 — About us | BK Studio"]], TOKENS = {"Fotografi": "Photography", "Danmark": "Denmark", "Landskab": "Landscape"}, IMGS = {"images/logo/nav-arbejde.svg": ["images/logo/nav-work-en.svg", "Work"], "images/logo/nav-arkiv.svg": ["images/logo/nav-archive-en.svg", "Archive"], "images/logo/nav-om-os.svg": ["images/logo/nav-team-en.svg", "Team"], "images/logo/nav-kontakt.svg": ["images/logo/nav-contact-en.svg", "Contact"], "images/logo/start-projekt.svg": ["images/logo/start-project-en.svg", "Start a project"]};
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, SVG: 1, svg: 1, CANVAS: 1, TEMPLATE: 1 };
  var INL = { A: 1, B: 1, STRONG: 1, EM: 1, I: 1, SPAN: 1, BR: 1, SMALL: 1, U: 1, MARK: 1 };
  var ATTRS = ['alt', 'aria-label', 'placeholder', 'title'], has = Object.prototype.hasOwnProperty;
  PATTERNS = PATTERNS.map(function (p) { return [new RegExp(p[0]), p[1]]; });

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function lookup(s) {
    var k = norm(s); if (!k) return null;
    if (has.call(EN, k)) return EN[k];
    for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i][0].test(k)) return k.replace(PATTERNS[i][0], PATTERNS[i][1]);
    if (k.length < 70 && /(Fotografi|Danmark|Landskab)/.test(k)) { var r = k.replace(/Fotografi|Danmark|Landskab/g, function (m) { return TOKENS[m]; }); return r !== k ? r : null; }
    return null;
  }
  function attrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i]; if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a), t = lookup(v); if (t !== null && t !== v) el.setAttribute(a, t);
    }
  }
  function walk(el) {
    if (el.nodeType !== 1 || SKIP[el.tagName]) return;
    attrs(el);
    if (el.tagName === 'IMG') { var s = el.getAttribute('src'); if (s && has.call(IMGS, s)) { el.setAttribute('src', IMGS[s][0]); el.setAttribute('alt', IMGS[s][1]); } }
    var kids = el.children, direct = [], i, n;
    for (i = 0; i < el.childNodes.length; i++) { n = el.childNodes[i]; if (n.nodeType === 3 && n.nodeValue.trim()) direct.push(n); }
    if (!kids.length) { if (direct.length) { var t = lookup(el.textContent); if (t !== null) el.textContent = t; } return; }
    if (direct.length) {
      var inline = true;
      for (i = 0; i < kids.length; i++) if (!INL[kids[i].tagName] || kids[i].querySelector('div,p,ul,li,h1,h2,h3,section')) { inline = false; break; }
      if (inline) { var t2 = lookup(el.innerHTML); if (t2 !== null) { el.innerHTML = t2; return; } }
      for (i = 0; i < direct.length; i++) { var tt = lookup(direct[i].nodeValue); if (tt !== null) direct[i].nodeValue = tt; }
    }
    for (i = 0; i < kids.length; i++) walk(kids[i]);
  }
  function addedNode(n) {
    if (n.nodeType === 3) { var p = n.parentNode; if (p && !SKIP[p.tagName]) { var t = lookup(n.nodeValue); if (t !== null && t !== n.nodeValue) n.nodeValue = t; } }
    else if (n.nodeType === 1) walk(n);
  }
  function meta() {
    var t = lookup(document.title); if (t) document.title = t;
    var ms = document.querySelectorAll('meta[name=description],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"],meta[property="og:image:alt"],meta[name="twitter:image:alt"]');
    for (var i = 0; i < ms.length; i++) { var tt = lookup(ms[i].getAttribute('content') || ''); if (tt) ms[i].setAttribute('content', tt); }
  }
  walk(document.body); meta();
  var ti = document.querySelector('title');                                                     // sidens titel skiftes af andre scripts (fx Om os)
  if (ti) new MutationObserver(function () { var v = lookup(document.title); if (v && v !== document.title) document.title = v; }).observe(ti, { childList: true, characterData: true, subtree: true });
  new MutationObserver(function (recs) {
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.type === 'childList') for (var j = 0; j < r.addedNodes.length; j++) addedNode(r.addedNodes[j]);
      else if (r.type === 'attributes') attrs(r.target);
      else if (r.type === 'characterData') addedNode(r.target);
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ATTRS, characterData: true });
  pend.remove('i18n-pending');
})();

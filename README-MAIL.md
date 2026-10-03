# Mail fra hjemmesiden: Vercel + Simply.com (uden Web3Forms)

Hjemmesiden ligger på **Vercel**, og e-mailen ligger hos **Simply.com**. Vercel kan ikke køre PHP (derfor gav `send-mail.php` en
"405 Method Not Allowed"). I stedet sender formularerne til en Vercel-funktion, `api/send-mail.js`, som logger ind på Simply.coms
mailserver og sender mailen til `kontakt@bkstudio.dk`. Der bruges ingen tredjepartstjeneste.

```
Formular på siden  ->  POST /api/send-mail  (Vercel-funktion)  ->  smtp.simply.com:587 (STARTTLS)  ->  kontakt@bkstudio.dk
```

## 1. Gør dette FØRST: skift adgangskoden til mailadressen
Tidligere versioner af siden indeholdt filen `mail-config.php` med adgangskoden i klartekst. På Vercel er alle filer i projektet
**offentligt tilgængelige**, så hvis den har ligget på siden, kan alle hente den på `bkstudio.dk/mail-config.php`.
1. Log ind på Simply.com → Mail → vælg `kontakt@bkstudio.dk` → skift adgangskoden.
2. Fjern `send-mail.php`, `mail-config.php`, `mail-test.php`, `lib/` og `.htaccess` fra jeres projekt/Git (de er fjernet i denne udgave).
3. Skift også MySQL-adgangskoden i Simply-kontrolpanelet, hvis den har stået i en chat eller en fil. Databasen bruges ikke af siden.

## 2. Sæt miljøvariabler i Vercel
Vercel → jeres projekt → **Settings → Environment Variables** (vælg Production, gerne også Preview):

| Navn | Værdi | Påkrævet |
|---|---|---|
| `SMTP_USER` | `kontakt@bkstudio.dk` (den fulde mailadresse) | ja |
| `SMTP_PASS` | den NYE adgangskode til mailadressen | ja |
| `MAIL_TO` | hvor henvendelserne sendes hen (standard: `SMTP_USER`) | nej |
| `MAIL_FROM` | afsenderadresse, skal være en adresse hos Simply.com (standard: `SMTP_USER`) | nej |
| `SMTP_HOST` | standard `smtp.simply.com` | nej |
| `SMTP_PORT` | standard `587` | nej |
| `ALLOWED_ORIGINS` | standard `https://bkstudio.dk,https://www.bkstudio.dk` | nej |
| `CHECK_TOKEN` | en lang, tilfældig tekst, der slår kontrol-adressen til (se punkt 4) | nej |
| `AUTOREPLY_REPLY_TO` | hvem der svarer, når kunden trykker "Svar" i bekræftelsen, fx `valdemar@bkstudio.dk` | nej |
| `AUTOREPLY_FROM_NAME` | navnet i afsenderfeltet i bekræftelsen (standard: `BK Studio`) | nej |
| `AUTOREPLY` | skriv `off` for at slå bekræftelsen til kunden fra | nej |
| `SITE_URL` | standard `https://bkstudio.dk` (bruges til logo og links i mailen) | nej |

Brug `smtp.simply.com`. **`websmtp.simply.com` virker kun fra Simply.coms egne webservere** og må ikke bruges her.
Når I har ændret variablerne, skal projektet deployes igen (Deployments → ⋯ → Redeploy), ellers træder de ikke i kraft.

## 3. Læg filerne op
Den mappe, der indeholder `index.html`, **`api/`**, `package.json` og `vercel.json`, skal være Vercel-projektets **Root Directory**
(Settings → General → Root Directory). Vercel installerer selv `nodemailer` ud fra `package.json`. Der skal ikke være en build-kommando.

## 4. Test, at det virker
Sæt `CHECK_TOKEN` (punkt 2), deploy, og åbn:
- `https://bkstudio.dk/api/send-mail?check=DIT_TOKEN` : kontrollerer forbindelse, STARTTLS og login til Simply. Der står `"ok": true`, når det virker.
- `https://bkstudio.dk/api/send-mail?check=DIT_TOKEN&send=1` : sender desuden en testmail til `kontakt@bkstudio.dk`.

Send derefter en rigtig besked fra kontaktformularen og en fra "Start et projekt". Fejl står i Vercel → **Logs**.

| Fejlkode i svaret | Betydning |
|---|---|
| `EAUTH` | Forkert brugernavn/adgangskode. Brugernavnet skal være den fulde mailadresse. |
| `ECONNECTION`, `ETIMEDOUT`, `ESOCKET` | Kan ikke nå mailserveren. Tjek `SMTP_HOST` og `SMTP_PORT`. |
| `CONFIG` | `SMTP_USER`/`SMTP_PASS` er ikke sat for det miljø, siden kører i, eller der mangler en redeploy. |
| `ORIGIN` | Siden kører på et domæne, der ikke står i `ALLOWED_ORIGINS`. |
| `RATE` | Mere end 6 henvendelser fra samme IP på 10 minutter. |
| HTTP 404 på `/api/send-mail` | `api/`-mappen ligger ikke i Vercel-projektets rod (se punkt 3). |

## 5. Når det virker
- Sæt `SHOW_MAIL_DEBUG` til `false` i `script.js`, så besøgende ikke ser teknisk fejlinfo ved en fejl.
- Slå `CHECK_TOKEN` fra (slet variablen), når I ikke bruger kontrol-adressen.
- Web3Forms bruges ikke længere nogen steder i koden. Jeres nøgle kan slettes hos dem.

## Gode at vide
- Vercels gratis Hobby-plan er beregnet til ikke-kommerciel brug. En virksomhedshjemmeside hører normalt under en betalt plan, så tjek deres vilkår.
- Mailen sendes fra Simply.coms server, og e-mailens SPF/DKIM hos Simply gælder derfor som normalt. Domænets MX-poster og mail ændres ikke.
- Beskederne har samme opbygning som før, og "Svar" i mailprogrammet går direkte til afsenderen.

## Bekræftelsesmail til kunden (ny)
Når nogen sender en henvendelse eller en booking, sker der to ting:
1. **I får en overskuelig mail** med navn, kontaktoplysninger og besked, og en knap, der svarer direkte til afsenderen.
2. **Kunden får en bekræftelse** med jeres logo: "Tak for din henvendelse. Vi har modtaget din besked og vender tilbage hurtigst muligt", en kopi af det, kunden skrev, og et link til jeres arbejde. Den er underskrevet "Valdemar & Basharat".

Bekræftelsen sendes først, efter at henvendelsen er sendt til jer. Fejler bekræftelsen, påvirker det ikke jer, og kunden ser stadig "Tak".

**Hvem svarer?** Sæt `AUTOREPLY_REPLY_TO` til `valdemar@bkstudio.dk`. Så går kundens svar direkte til Valdemar, mens mailen stadig sendes fra `kontakt@bkstudio.dk`, som Simply tillader. Vil I have, at henvendelserne også lander hos Valdemar, så sæt `MAIL_TO` til `kontakt@bkstudio.dk,valdemar@bkstudio.dk` (flere adresser adskilles med komma).

**Vil I have `valdemar@bkstudio.dk` som afsender?** Sæt `MAIL_FROM` til den adresse. Simply tillader ikke altid, at man sender som en anden adresse end den, man logger ind med, så test det med kontrol-adressen (`...?check=TOKEN&send=1`). Afvises den, så sæt `MAIL_FROM` tilbage, eller log ind som `valdemar@bkstudio.dk` ved at ændre `SMTP_USER` og `SMTP_PASS`.

**Logoet** ligger på siden som `images/email/logo-email.png`, så det vises i mailprogrammet. Det betyder, at siden skal være udrullet, før logoet kan ses i bekræftelsen. Nogle mailprogrammer viser først billeder, når man trykker "vis billeder".

**Spam:** Bekræftelsen sendes til den adresse, en besøgende skriver. Derfor har funktionen skjult felt, grænse på 6 henvendelser pr. IP pr. 10 minutter og kun jeres egne domæner. Får I alligevel mange falske henvendelser, så tilføj en captcha (fx Cloudflare Turnstile) i formularen, eller slå bekræftelsen fra med `AUTOREPLY=off`.

**Privatliv:** Bekræftelsen indeholder en kopi af det, kunden skrev. Det er normalt, men nævn gerne i privatlivspolitikken, at I sender en bekræftelse pr. mail.

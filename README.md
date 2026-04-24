# Fuelstate — fuelstate.app

Static marketing site. Plain HTML/CSS/JS. Deployed to Cloudflare Pages.

## Structure

```
Website/
  index.html            Landing: hero + waitlist + how-it-works + stats + footer
  privacy.html          Legal (existing)
  terms.html            Legal (existing)
  support.html          Support page (existing)
  delete.html           Account deletion request (existing)
  delete-confirm.html   Confirmation page (existing)
  assets/
    styles.css          Shared stylesheet
    main.js             Waitlist form -> Supabase REST
    logo.png            App icon (512px)
    favicon.png         Favicon (64px)
    topo.svg            Rainbow topographic hero frame
  supabase/
    waitlist.sql        Idempotent migration (already applied to prod)
  _headers              Cloudflare Pages security + caching headers
  _redirects            Clean-URL redirects (/privacy -> /privacy.html)
  robots.txt
  sitemap.xml
```

## Local preview

```bash
npx serve Website -l 4173
# open http://localhost:4173
```

## Supabase waitlist

- Project: `bghekdandbybblhwjjgc`
- Table: `public.waitlist` (email, source, user_agent, referrer, created_at)
- Insert-only RLS policy for `anon`. No SELECT from the client.
- Unique index on `lower(email)` — duplicates return HTTP 409 and the UI treats them as success.
- Export signups from the Supabase dashboard (Table Editor or SQL with `service_role`).

The SQL in `supabase/waitlist.sql` has already been applied. It is idempotent — re-running it is safe.

## Deploy — Cloudflare Pages via GitHub

This site currently lives inside the iOS repo. For the Pages GitHub integration, create a small repo dedicated to the site:

```bash
# 1. New repo with just the Website/ contents
cp -R Website /tmp/fuelstate-web && cd /tmp/fuelstate-web
git init -b main
git add .
git commit -m "Initial site"

# 2. Create the GitHub repo and push (requires `gh` auth)
gh repo create fuelstate-web --public --source=. --remote=origin --push
```

Then in the Cloudflare dashboard:

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → select `fuelstate-web`.
2. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/`
3. **Save and Deploy**.
4. After first deploy succeeds, go to the project's **Custom domains** tab → add `fuelstate.app` (and `www.fuelstate.app` if desired). Cloudflare will auto-provision DNS if the domain is already in your Cloudflare account.

Every push to `main` will auto-deploy.

### Alternative: deploy from this repo with wrangler

If you prefer to keep everything in one repo:

```bash
npm i -g wrangler
wrangler pages deploy Website --project-name fuelstate-web
```

## Waitlist maintenance

Pull the current list:

```sql
select email, source, created_at
from public.waitlist
order by created_at desc;
```

## Design

- Palette matches the iOS app: `#0B1019` background, `#F5C542` gold accent, Space Grotesk + Outfit fonts.
- Centered hero mirrors the reference mockup exactly (1:1 pixel fidelity was the goal).
- Responsive from 320px to 1400px. No horizontal overflow.
- Follows taste-skill guardrails (no emojis, no Inter, no pure black, no outer glows, no fake numbers — everything you see is real product output from the fueling engine).

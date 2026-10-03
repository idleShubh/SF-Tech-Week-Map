# SF Tech Week Map

A small map and event planner for 241 October events in `240+_EVENTS.csv`, with a dedicated filter for the 50 handpicked events in `top50_eventsinSF.csv`.

## Run locally

```sh
npm install
npm run dev
```

Build with `npm run build`. The static output is in `dist/`.

The default view shows the handpicked 50 to keep the map readable. Switch to **All 241 events** to browse the complete catalog. To regenerate `src/events.json` after changing either CSV, run `python3 scripts/build-events.py`.

## Share flow

Visitors save events with the bookmark button, then open **My plan**. The plan is kept in local storage. **Post on X** first opens a preview of their 1200 × 630 plan image with the selected events and Alan logo. They can download the PNG, then continue to an X composer with a prewritten list of up to five selected events and a link to the complete plan. Anyone opening that link sees the same saved selection. The image must be attached manually in X because Web Intent cannot attach a locally generated file.

On Vercel, shared `/p/:ids` URLs run through `api/plan.js` to add personalized X and Open Graph metadata to the normal app page. `api/og.js` generates the matching PNG with selected events and “Built with Alan AI.” The homepage uses the generic monochrome image in `public/social-card.png`. Public link previews require the site to be deployed and reachable by X. While running locally, plan links point to localhost and are only useful on the same computer.

## Deploy to Vercel

Import this folder as a Vite project. Vercel should use `npm run build` and output directory `dist`; `vercel.json` adds the personalized plan route. The current public URL is `https://sf-tech-week-map.vercel.app/`, which the homepage social image and SEO metadata use while `sftechweekmap.com` has no DNS record. Once the custom domain is connected, update the homepage canonical/Open Graph URLs in `index.html`, the sitemap URLs in `public/`, and set `VITE_PUBLIC_SITE_URL=https://sftechweekmap.com` for plan links.

## Data notes

The full CSV has coordinates for some public venues. Other pins use approximate neighborhood or city positions so nearby events remain individually selectable. Events without a usable location appear in the list without a map pin. Some events are outside San Francisco. Details such as approval status, pricing, and availability can change; visitors should check each event's linked page before attending.

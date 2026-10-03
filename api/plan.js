import events from '../src/events.json' with { type: 'json' };

const known = new Map(events.map((event) => [event.id, event]));
const liveOrigin = 'https://sf-tech-week-map.vercel.app';

function safeIds(raw) {
  return [...new Set((raw || '').split(',').filter((id) => known.has(id)))].slice(0, 50);
}

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function shortName(value) {
  return value.length > 48 ? `${value.slice(0, 47).trimEnd()}…` : value;
}

export async function GET(request) {
  const requested = new URL(request.url);
  let pathIds = '';
  if (requested.pathname.startsWith('/p/')) {
    try { pathIds = decodeURIComponent(requested.pathname.slice(3)); }
    catch { return Response.redirect(new URL('/', request.url), 302); }
  }
  const ids = safeIds(requested.searchParams.get('ids') || pathIds).sort();
  if (!ids.length) return Response.redirect(new URL('/', request.url), 302);

  // Use the connected custom domain once it resolves; preview deployments point
  // their card images at the current public Vercel site in the meantime.
  const siteOrigin = ['sftechweekmap.com', 'www.sftechweekmap.com'].includes(requested.hostname)
    ? 'https://sftechweekmap.com' : liveOrigin;
  const planUrl = new URL(`/p/${ids.join(',')}`, siteOrigin);
  const imageUrl = new URL('/api/og', siteOrigin);
  imageUrl.searchParams.set('ids', ids.join(','));
  const chosen = ids.map((id) => known.get(id)).sort((a, b) =>
    a.date.localeCompare(b.date) || a.time_pt.localeCompare(b.time_pt) || a.rank - b.rank);
  const preview = chosen.slice(0, 2).map((event) => shortName(event.name)).join(' · ');
  const description = `My SF Tech Week plan: ${preview}${chosen.length > 2 ? ` · +${chosen.length - 2} more` : ''}. Explore the map.`;
  const title = `My SF Tech Week plan · ${ids.length} ${ids.length === 1 ? 'event' : 'events'}`;
  const imageAlt = `SF Tech Week Map preview of my ${ids.length}-event plan`;
  const socialMeta = `
    <meta name="description" content="${escapeAttribute(description)}" />
    <link rel="canonical" href="${escapeAttribute(planUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SF Tech Week Map" />
    <meta property="og:url" content="${escapeAttribute(planUrl)}" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttribute(imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(imageAlt)}" />`;

  // Serve the regular SPA with personalized metadata, so crawlers and people see
  // the same plan URL. The root route is the static Vite index on Vercel.
  const root = await fetch(new URL('/', request.url));
  if (!root.ok) return new Response('Plan unavailable', { status: 502 });
  const html = (await root.text())
    .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>\s*/i, '')
    .replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/i, '')
    .replace(/<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<!-- SOCIAL_META_START -->[\s\S]*?<!-- SOCIAL_META_END -->/, socialMeta)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(title)} · SF Tech Week Map</title>`);
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

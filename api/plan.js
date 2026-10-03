import events from '../src/events.json' with { type: 'json' };

const known = new Map(events.map((event) => [event.id, event]));

function safeIds(raw) {
  return [...new Set((raw || '').split(',').filter((id) => known.has(id)))].slice(0, 50);
}

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export async function GET(request) {
  const requested = new URL(request.url);
  const ids = safeIds(requested.searchParams.get('ids') || (requested.pathname.startsWith('/p/') ? decodeURIComponent(requested.pathname.slice(3)) : ''));
  if (!ids.length) return Response.redirect(new URL('/', request.url), 302);

  const imageUrl = new URL('/api/og', requested.origin);
  imageUrl.searchParams.set('ids', ids.join(','));
  const chosen = ids.map((id) => known.get(id));
  const description = `${chosen.slice(0, 3).map((event) => event.name).join(' · ')}${chosen.length > 3 ? ` · +${chosen.length - 3} more` : ''}`;
  const title = `My SF Tech Week plan · ${ids.length} ${ids.length === 1 ? 'event' : 'events'}`;
  const socialMeta = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />`;

  // Serve the regular SPA with personalized metadata, so crawlers and people see
  // the same plan URL. The root route is the static Vite index on Vercel.
  const root = await fetch(new URL('/', request.url));
  if (!root.ok) return new Response('Plan unavailable', { status: 502 });
  const html = (await root.text())
    .replace(/<!-- SOCIAL_META_START -->[\s\S]*?<!-- SOCIAL_META_END -->/, socialMeta)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(title)} · SF Tech Week Map</title>`);
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

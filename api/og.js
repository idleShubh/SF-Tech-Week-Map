import sharp from 'sharp';
import events from '../src/events.json' with { type: 'json' };
import { planCardSvg } from '../src/card-art.js';

const known = new Map(events.map((event) => [event.id, event]));

export async function GET(request) {
  const requested = new URL(request.url);
  const ids = [...new Set((requested.searchParams.get('ids') || '').split(',').filter((id) => known.has(id)))].slice(0, 50);
  const chosen = ids.map((id) => known.get(id)).sort((a, b) => a.date.localeCompare(b.date) || a.time_pt.localeCompare(b.time_pt));
  if (!chosen.length) return new Response('Plan not found', { status: 404 });

  const png = await sharp(Buffer.from(planCardSvg(chosen))).png().toBuffer();
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
}

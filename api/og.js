import sharp from 'sharp';
import events from '../src/events.json' with { type: 'json' };

const known = new Map(events.map((event) => [event.id, event]));

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function shortDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`)).toUpperCase();
}

function fitName(value) {
  return value.length > 56 ? `${value.slice(0, 55).trimEnd()}…` : value;
}

export async function GET(request) {
  const requested = new URL(request.url);
  const ids = [...new Set((requested.searchParams.get('ids') || '').split(',').filter((id) => known.has(id)))].slice(0, 50);
  const chosen = ids.map((id) => known.get(id)).sort((a, b) => a.date.localeCompare(b.date) || a.time_pt.localeCompare(b.time_pt));
  if (!chosen.length) return new Response('Plan not found', { status: 404 });

  const rows = chosen.slice(0, 5).map((event, index) => {
    const y = 248 + index * 62;
    return `<line x1="64" y1="${y - 32}" x2="1136" y2="${y - 32}" stroke="#3d3d3d" />
      <text x="67" y="${y + 7}" fill="#bdbdbd" font-size="21" font-family="Arial, sans-serif">${escapeXml(shortDate(event.date))}</text>
      <text x="250" y="${y + 10}" fill="#f1f1f1" font-size="28" font-weight="bold" font-family="Arial, sans-serif">${escapeXml(fitName(event.name))}</text>`;
  }).join('');
  const more = chosen.length > 5
    ? `<text x="67" y="545" fill="#bdbdbd" font-size="19" font-family="Arial, sans-serif">+${chosen.length - 5} more on my map</text>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#141414" />
    <rect x="32" y="32" width="1136" height="566" fill="none" stroke="#454545" stroke-width="2" />
    <text x="65" y="83" fill="#d7d7d7" font-size="22" font-weight="bold" letter-spacing="2" font-family="Arial, sans-serif">SF TECH WEEK MAP  /  OCT 2026</text>
    <text x="64" y="155" fill="#f1f1f1" font-size="62" font-weight="bold" font-family="Arial, sans-serif">My Tech Week plan</text>
    <text x="67" y="198" fill="#b5b5b5" font-size="23" font-family="Arial, sans-serif">${chosen.length} ${chosen.length === 1 ? 'event' : 'events'} worth showing up for</text>
    ${rows}
    ${more}
    <rect x="66" y="571" width="8" height="17" rx="4" fill="#eee" />
    <rect x="78" y="565" width="8" height="23" rx="4" fill="#eee" />
    <rect x="90" y="571" width="8" height="17" rx="4" fill="#eee" />
    <text x="113" y="585" fill="#d8d8d8" font-size="20" font-family="Arial, sans-serif">Built with Alan AI</text>
    <text x="1137" y="585" text-anchor="end" fill="#bdbdbd" font-size="20" font-family="Arial, sans-serif">sftechweekmap.com</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
}

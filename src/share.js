import { planCardSvg } from './card-art.js';

const POST_INTRO = "I'm visiting SF Tech Week. Here's my event plan:";

export function planIdsFromUrl(href) {
  const url = new URL(href);
  if (url.pathname.startsWith('/p/')) {
    try { return decodeURIComponent(url.pathname.slice(3)); }
    catch { return ''; }
  }
  return url.searchParams.get('plan') || '';
}

export function eventsInPlan(allEvents, savedIds) {
  const ids = new Set(savedIds);
  return allEvents.filter((event) => ids.has(event.id)).sort((a, b) =>
    a.date.localeCompare(b.date) || a.time_pt.localeCompare(b.time_pt) || a.rank - b.rank);
}

export function planUrl(savedIds, currentHref) {
  const url = new URL(currentHref);
  url.pathname = `/p/${savedIds.join(',')}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function shorten(value, length) {
  return value.length <= length ? value : `${value.slice(0, length - 1).trimEnd()}…`;
}

export function postText(events) {
  const firstFive = events.slice(0, 5);
  const more = events.length - firstFive.length;
  const outro = more > 0 ? `\n+${more} more on my map.` : '';
  // Leave room for the 23-character t.co URL, separating space and any X UI additions.
  const available = 250 - POST_INTRO.length - outro.length - 2;
  const nameLimit = Math.min(43, Math.floor((available - firstFive.length * 3) / Math.max(firstFive.length, 1)));
  const lines = firstFive.map((event) => `• ${shorten(event.name, nameLimit)}`);
  return `${POST_INTRO}\n${lines.join('\n')}${outro}`;
}

export function xIntentUrl(events, shareUrl) {
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', postText(events));
  url.searchParams.set('url', shareUrl);
  return url.toString();
}

export async function planImageDataUrl(events) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const blobUrl = URL.createObjectURL(new Blob([planCardSvg(events)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = blobUrl;
    await image.decode();
    context.drawImage(image, 0, 0);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
  return canvas.toDataURL('image/png');
}

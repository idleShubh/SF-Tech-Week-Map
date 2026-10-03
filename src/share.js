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

function fitText(context, value, maxWidth) {
  if (context.measureText(value).width <= maxWidth) return value;
  let text = value;
  while (text.length > 1 && context.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1);
  return `${text.trimEnd()}…`;
}

export function planImageDataUrl(events) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  context.fillStyle = '#141414';
  context.fillRect(0, 0, 1200, 675);
  context.strokeStyle = '#454545';
  context.lineWidth = 2;
  context.strokeRect(32, 32, 1136, 611);

  context.fillStyle = '#d8d8d8';
  context.font = '500 22px "DM Mono", monospace';
  context.fillText('SF TECH WEEK MAP  /  OCT 2026', 76, 88);
  context.fillStyle = '#f4f4f4';
  context.font = '700 64px "DM Sans", sans-serif';
  context.fillText('My Tech Week plan', 76, 169);
  context.fillStyle = '#a9a9a9';
  context.font = '400 24px "DM Sans", sans-serif';
  context.fillText(`${events.length} ${events.length === 1 ? 'event' : 'events'} worth showing up for`, 78, 210);

  const shown = events.slice(0, 5);
  shown.forEach((event, index) => {
    const y = 278 + index * 69;
    context.strokeStyle = '#383838';
    context.beginPath();
    context.moveTo(76, y - 25);
    context.lineTo(1124, y - 25);
    context.stroke();
    context.fillStyle = '#bcbcbc';
    context.font = '500 21px "DM Mono", monospace';
    context.fillText(event.dateText.toUpperCase(), 78, y + 8);
    context.fillStyle = '#f4f4f4';
    context.font = '600 30px "DM Sans", sans-serif';
    context.fillText(fitText(context, event.name, 800), 300, y + 10);
  });

  if (events.length > shown.length) {
    context.fillStyle = '#bcbcbc';
    context.font = '500 22px "DM Mono", monospace';
    context.fillText(`+ ${events.length - shown.length} more events on my map`, 78, 594);
  }
  context.fillStyle = '#ededed';
  for (const [x, y, height] of [[78, 610, 18], [90, 604, 24], [102, 610, 18]]) {
    context.beginPath();
    context.moveTo(x + 3, y);
    context.lineTo(x + 5, y);
    context.quadraticCurveTo(x + 8, y, x + 8, y + 3);
    context.lineTo(x + 8, y + height - 3);
    context.quadraticCurveTo(x + 8, y + height, x + 5, y + height);
    context.lineTo(x + 3, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - 3);
    context.lineTo(x, y + 3);
    context.quadraticCurveTo(x, y, x + 3, y);
    context.fill();
  }
  context.font = '500 21px "DM Mono", monospace';
  context.fillText('Built with Alan AI', 126, 628);
  context.fillStyle = '#e2e2e2';
  context.font = '500 21px "DM Mono", monospace';
  context.textAlign = 'right';
  context.fillText('sftechweekmap.com', 1120, 628);

  return canvas.toDataURL('image/png');
}

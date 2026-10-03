const INK = '#111111';
const PAPER = '#f4f4f2';
const MUTED = '#a8a8a5';

function xml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function shortDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`)).toUpperCase();
}

function shortName(value) {
  return value.length > 59 ? `${value.slice(0, 58).trimEnd()}…` : value;
}

// Matches the current mark in the header of tryalan.ai (11 × 12 viewBox).
function alanMark(x, y, width = 18, color = PAPER) {
  const scale = width / 11;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}"><rect x="0" y="3" width="3" height="9" rx="1.5"/><rect x="4" y="0" width="3" height="6" rx="1.5"/><rect x="8" y="3" width="3" height="9" rx="1.5"/></g>`;
}

function siteMark(x, y, size = 38) {
  const scale = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${scale})"><rect width="64" height="64" rx="15" fill="${PAPER}"/><path d="M45 16H29c-7 0-11 4-11 10s4 10 11 10h7c7 0 11 4 11 10s-4 10-11 10H19" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="16" r="5.5" fill="${INK}"/><circle cx="18" cy="56" r="5.5" fill="${INK}"/></g>`;
}

function shell(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${INK}"/>
    <rect x="28" y="28" width="1144" height="574" rx="18" fill="#171717" stroke="#424242"/>
    ${siteMark(62, 58, 38)}
    <text x="115" y="84" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="-.4">SF Tech Week Map</text>
    <text x="1138" y="82" text-anchor="end" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="2">SAN FRANCISCO  /  OCT 2026</text>
    <path d="M62 117H1138" stroke="#454545"/>
    ${inner}
    <path d="M62 559H1138" stroke="#454545"/>
    <text x="62" y="587" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="15" letter-spacing="1.4">BUILT WITH</text>
    ${alanMark(174, 569, 17)}
    <text x="201" y="586" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">Alan AI</text>
    <text x="1138" y="586" text-anchor="end" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="18">sftechweekmap.com</text>
  </svg>`;
}

export function planCardSvg(events) {
  const shown = events.slice(0, 5);
  const rows = shown.map((event, index) => {
    const y = 265 + index * 56;
    return `<path d="M80 ${y}H1120" stroke="#353535"/>
      <text x="82" y="${y + 36}" fill="#b4b4b1" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1">${xml(shortDate(event.date))}</text>
      <text x="236" y="${y + 37}" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600">${xml(shortName(event.name))}</text>`;
  }).join('');
  const more = events.length > 5
    ? `<text x="81" y="547" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="16">+${events.length - 5} more on my map</text>`
    : '';
  const count = String(events.length).padStart(2, '0');
  return shell(`<text x="62" y="199" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="61" font-weight="700" letter-spacing="-2.4">My week, mapped.</text>
    <text x="65" y="236" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="21">The places I plan to be during SF Tech Week.</text>
    <text x="1138" y="204" text-anchor="end" fill="#777774" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700" letter-spacing="-5">${count}</text>
    <rect x="62" y="265" width="1076" height="${Math.max(64, shown.length * 56)}" rx="9" fill="#1e1e1e"/>
    ${rows}
    ${more}`);
}

export function homeCardSvg() {
  const streetLines = [
    ...Array.from({ length: 11 }, (_, i) => `<path d="M${726 + i * 43} 152L${770 + i * 43} 523" stroke="#343434" stroke-width="1.5"/>`),
    ...Array.from({ length: 9 }, (_, i) => `<path d="M688 ${174 + i * 44}L1140 ${190 + i * 44}" stroke="#343434" stroke-width="1.5"/>`),
  ].join('');
  const pins = [[800, 278], [934, 228], [1008, 390], [868, 453]]
    .map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="15" fill="${PAPER}"/><circle cx="${x}" cy="${y}" r="4" fill="${INK}"/><text x="${x + 22}" y="${y + 5}" fill="#c9c9c6" font-family="Arial, Helvetica, sans-serif" font-size="14">0${index + 1}</text>`).join('');
  return shell(`<text x="62" y="225" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700" letter-spacing="-2.5">Find your people.</text>
    <text x="62" y="300" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700" letter-spacing="-2.5">Plan your week.</text>
    <text x="65" y="365" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="22">Explore the city. Save your events.</text>
    <text x="65" y="398" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="22">Share where you’ll be.</text>
    <path d="M64 466H575" stroke="#454545"/>
    <text x="65" y="510" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">241 events</text>
    <text x="237" y="510" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="22">/</text>
    <text x="265" y="510" fill="${PAPER}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">50 handpicked</text>
    <defs><clipPath id="mapclip"><rect x="676" y="152" width="462" height="371" rx="12"/></clipPath></defs>
    <rect x="676" y="152" width="462" height="371" rx="12" fill="#222222" stroke="#414141"/>
    <g clip-path="url(#mapclip)">${streetLines}<path d="M672 446C788 385 786 285 890 275S1034 230 1174 150" fill="none" stroke="#6b6b6b" stroke-width="7"/><path d="M740 546C832 476 950 476 1034 357S1120 274 1182 247" fill="none" stroke="#555555" stroke-width="6"/>${pins}</g>`);
}

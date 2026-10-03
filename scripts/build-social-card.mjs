import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const streets = [
  ...Array.from({ length: 14 }, (_, i) => `<line x1="${616 + i * 48}" y1="0" x2="${690 + i * 48}" y2="630" stroke="#3a3a3a" stroke-width="2" />`),
  ...Array.from({ length: 14 }, (_, i) => `<line x1="605" y1="${15 + i * 46}" x2="1200" y2="${44 + i * 46}" stroke="#3a3a3a" stroke-width="2" />`),
].join('');
const markers = [[795, 244], [931, 330], [1070, 451], [878, 491], [1101, 194]]
  .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="23" fill="#e4e4e4" stroke="#141414" stroke-width="4" /><circle cx="${x}" cy="${y}" r="5" fill="#252525" />`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#141414" />
  <rect x="605" width="595" height="630" fill="#242424" />
  ${streets}
  <path d="M630 -20 L730 145 L820 220 L870 345 L1010 410 L1160 650" fill="none" stroke="#515151" stroke-width="11" />
  <path d="M1170 -20 L1090 110 L985 175 L915 285 L825 330 L715 505 L640 650" fill="none" stroke="#515151" stroke-width="11" />
  ${markers}
  <line x1="605" y1="0" x2="605" y2="630" stroke="#5a5a5a" stroke-width="3" />
  <text x="56" y="77" fill="#d1d1d1" font-size="22" font-weight="bold" font-family="Arial, sans-serif">SF TECH WEEK MAP</text>
  <line x1="56" y1="103" x2="545" y2="103" stroke="#5b5b5b" stroke-width="2" />
  <text x="56" y="228" fill="#f3f3f3" font-size="69" font-weight="bold" font-family="Arial, sans-serif">Your week,</text>
  <text x="56" y="309" fill="#f3f3f3" font-size="69" font-weight="bold" font-family="Arial, sans-serif">mapped.</text>
  <text x="58" y="382" fill="#bdbdbd" font-size="27" font-family="Arial, sans-serif">241 events. 50 handpicked highlights.</text>
  <text x="58" y="425" fill="#bdbdbd" font-size="27" font-family="Arial, sans-serif">Pick your places. Make a plan. Share it.</text>
  <rect x="56" y="515" width="489" height="62" fill="none" stroke="#686868" stroke-width="2" />
  <text x="78" y="555" fill="#eeeeee" font-size="24" font-weight="bold" font-family="Arial, sans-serif">sftechweekmap.com</text>
  <rect x="628" y="578" width="8" height="17" rx="4" fill="#eee" />
  <rect x="640" y="572" width="8" height="23" rx="4" fill="#eee" />
  <rect x="652" y="578" width="8" height="17" rx="4" fill="#eee" />
  <text x="676" y="592" fill="#dedede" font-size="18" font-family="Arial, sans-serif">Built with Alan AI</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL('../public/social-card.png', import.meta.url)));

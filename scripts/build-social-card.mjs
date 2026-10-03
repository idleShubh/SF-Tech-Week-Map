import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { homeCardSvg } from '../src/card-art.js';

await sharp(Buffer.from(homeCardSvg())).png().toFile(fileURLToPath(new URL('../public/social-card.png', import.meta.url)));

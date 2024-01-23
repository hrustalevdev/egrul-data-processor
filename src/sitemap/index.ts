import path from 'node:path';

import { sitemap } from './sitemap';

const outputFolderPath = path.resolve(
  __dirname,
  '..',
  '..',
  'output',
  'sitemap',
);

sitemap(outputFolderPath);

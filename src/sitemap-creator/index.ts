import path from 'node:path';

import { sitemapCreator } from './sitemap-creator';

const outputFolderPath = path.resolve(
  __dirname,
  '..',
  '..',
  'output',
  'sitemap',
);

sitemapCreator(outputFolderPath);

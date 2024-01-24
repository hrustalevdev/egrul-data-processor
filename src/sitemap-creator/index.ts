import path from 'node:path';

import { isTesting } from '../env';

import { sitemapCreator } from './sitemap-creator';

const folderName = isTesting ? '_sitemap' : 'sitemap';

const outputFolderPath = path.resolve(
  __dirname,
  '..',
  '..',
  'output',
  folderName,
);

sitemapCreator(outputFolderPath);

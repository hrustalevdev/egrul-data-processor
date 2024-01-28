import path from 'node:path';

import { isTesting } from '../env';

import { SitemapCreator } from './sitemap-creator';

const folderName = isTesting ? '_sitemap' : 'sitemap';

SitemapCreator.create({
  outputFolderPath: path.resolve(__dirname, '..', '..', 'output', folderName),
  hostname: 'https://www.sravni.ru/kontragent/',
  linksPerSitemap: 49500,
});

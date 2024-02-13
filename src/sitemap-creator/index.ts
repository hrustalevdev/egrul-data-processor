import path from 'node:path';

import { isTesting } from '../env';

import { SitemapCreator } from './SitemapCreator';

const folderName = isTesting ? '_sitemap' : 'sitemap';

SitemapCreator.create({
  outputFolderPath: path.resolve(__dirname, '..', '..', 'output', folderName),
  hostname: 'https://www.sravni.ru/kontragent/',
  storageUrl: 'https://s3.sravni.ru/xml-sitemaps/sitemap-kontragent/',
  fileNamePrefix: 'sitemap-kontragent',
  linksPerSitemap: 49500,
});

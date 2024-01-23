import mongoose from 'mongoose';
import { simpleSitemapAndIndex } from 'sitemap';
import { EnumChangefreq } from 'sitemap/dist/lib/types';
import type { SitemapItemLoose } from 'sitemap/dist/lib/types';

import { Organization } from '../db';
import { isTesting } from '../env';

const DB_NAME = isTesting ? 'egrul_egrip_test' : 'egrul_egrip';

const URL = `mongodb://127.0.0.1:27017/${DB_NAME}`;

export const sitemapCreator = async (outputFolderPath: string) => {
  try {
    await mongoose.connect(URL);

    const links: SitemapItemLoose[] = [];

    await Organization.find({}, { inn: 1, kpp: 1, _id: 0 })
      .lean()
      .cursor()
      .forEach((doc) => {
        const link: SitemapItemLoose = {
          url: `/kontragent/${[doc.inn, doc.kpp].filter(Boolean).join('-')}/`,
          changefreq: EnumChangefreq.MONTHLY,
          priority: 0.8,
        };
        links.push(link);
      });

    await simpleSitemapAndIndex({
      hostname: 'https://sravni.ru/',
      destinationDir: outputFolderPath,
      sourceData: links,
      gzip: false,
      sitemapHostname: 'https://sravni.ru/kontragent/sitemap/',
    });
  } catch (error) {
    console.error('Error during sitemap process:', error);
  } finally {
    await mongoose.disconnect();
  }
};

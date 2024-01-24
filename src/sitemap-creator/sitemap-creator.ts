import mongoose from 'mongoose';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { createGzip } from 'node:zlib';
import { SitemapAndIndexStream, SitemapStream } from 'sitemap';
import { EnumChangefreq } from 'sitemap/dist/lib/types';
import type { SitemapItemLoose } from 'sitemap/dist/lib/types';

import { db, Organization } from '../db';

export const sitemapCreator = async (outputFolderPath: string) => {
  try {
    await db.connect();

    if (!existsSync(outputFolderPath)) {
      mkdirSync(outputFolderPath, { recursive: true });
    }

    const totalDocuments = await Organization.countDocuments();
    console.log('Total documents:', totalDocuments);

    const cursor = Organization.find({}, { inn: 1, kpp: 1, _id: 0 })
      .lean()
      .cursor();

    const sms = new SitemapAndIndexStream({
      limit: 45000, // defaults to 45k
      lastmodDateOnly: false, // print date not time
      getSitemapStream: (i) => {
        const sitemapStream = new SitemapStream({
          hostname: 'https://example.com',
        });
        const fileName = `sitemap-${i}.xml`;

        const ws = sitemapStream
          .pipe(createGzip()) // compress the output of the sitemap
          .pipe(createWriteStream(resolve(outputFolderPath, fileName + '.gz'))); // write it to sitemap-NUMBER.xml

        return [
          new URL(fileName, 'https://example.com/subdir/').toString(),
          sitemapStream,
          ws,
        ];
      },
    });

    sms
      .pipe(createGzip())
      .pipe(
        createWriteStream(resolve(outputFolderPath, './sitemap-index.xml.gz')),
      );

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      const link: SitemapItemLoose = {
        url: `/kontragent/${[doc.inn, doc.kpp].filter(Boolean).join('-')}/`,
        changefreq: EnumChangefreq.MONTHLY,
        priority: 0.8,
      };

      sms.write(link);
    }

    sms.end();
  } catch (error) {
    console.error('Error during sitemap process:', error);
  } finally {
    await mongoose.disconnect();
  }
};

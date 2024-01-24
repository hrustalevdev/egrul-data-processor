import mongoose from 'mongoose';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { createGzip } from 'node:zlib';
import ProgressBar from 'progress';
import { SitemapAndIndexStream, SitemapStream } from 'sitemap';
import type { SitemapItemLoose } from 'sitemap/dist/lib/types';

import { db, Organization } from '../db';

export const sitemapCreator = async (outputFolderPath: string) => {
  try {
    await db.connect();

    if (!existsSync(outputFolderPath)) {
      mkdirSync(outputFolderPath, { recursive: true });
    }

    const totalDocuments = await Organization.countDocuments();
    console.log(`${'Total documents'.padEnd(15)} :`, totalDocuments);

    const cursor = Organization.find({}, { inn: 1, kpp: 1, _id: 0 })
      .lean()
      .cursor()
      .addCursorFlag('noCursorTimeout', true);

    const LINKS_PER_SITEMAP = 49500;

    const smsProcess = new ProgressBar(
      `${'Sitemap process'.padEnd(15)} : [:bar] :current/:total :percent :etas :elapseds`,
      {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total: Math.ceil(totalDocuments / LINKS_PER_SITEMAP),
      },
    );

    const sms = new SitemapAndIndexStream({
      limit: LINKS_PER_SITEMAP,
      lastmodDateOnly: false,
      getSitemapStream: (i) => {
        const sitemapStream = new SitemapStream({
          hostname: 'https://www.sravni.ru/kontragent/',
          xmlns: {
            news: false,
            xhtml: true,
            image: false,
            video: false,
          },
        });
        const fileName = `sitemap-kontragent-${i}.xml.gz`;

        const ws = sitemapStream
          .pipe(createGzip())
          .pipe(createWriteStream(resolve(outputFolderPath, fileName)));

        ws.on('finish', () => {
          smsProcess.tick();
        });

        return [
          new URL(fileName, 'https://s3.sravni.ru/xml-sitemaps/').toString(),
          sitemapStream,
          ws,
        ];
      },
    });

    sms
      .pipe(createGzip())
      .pipe(
        createWriteStream(
          resolve(outputFolderPath, './sitemap-kontragent-index.xml.gz'),
        ),
      );

    const dbProcess = new ProgressBar(
      `${'Data fetching'.padEnd(15)} : [:bar] :current/:total :percent :etas :elapseds`,
      {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total: totalDocuments,
      },
    );

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      const link: SitemapItemLoose = {
        url: `${[doc.inn, doc.kpp].filter(Boolean).join('-')}/`,
      };

      sms.write(link);
      dbProcess.tick();
    }

    sms.end();
  } catch (error) {
    console.error('Error during sitemap process:', error);
  } finally {
    await mongoose.disconnect();
  }
};

import mongoose from 'mongoose';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGzip } from 'node:zlib';
import ProgressBar from 'progress';
import { SitemapAndIndexStream, SitemapStream } from 'sitemap';
import type { SitemapItemLoose } from 'sitemap/dist/lib/types';

import { db, Organization } from '../db';

interface IOptions {
  outputFolderPath: string;
  hostname: string;
  storageUrl: string;
  fileNamePrefix: string;
  linksPerSitemap: number;
}

export class SitemapCreator {
  private readonly outputFolderPath: string;
  private readonly hostname: string;
  private readonly storageUrl: string;
  private readonly fileNamePrefix: string;
  private readonly linksPerSitemap: number;

  constructor(options: IOptions) {
    this.outputFolderPath = options.outputFolderPath;
    this.hostname = options.hostname;
    this.storageUrl = options.storageUrl;
    this.fileNamePrefix = options.fileNamePrefix;
    this.linksPerSitemap = options.linksPerSitemap;
  }

  static async create(options: IOptions) {
    const sitemapCreator = new SitemapCreator(options);
    await sitemapCreator.create();
  }

  async create() {
    try {
      await db.connect();
      this.createFolder();

      const sitemapStream = await this.getSitemapStream();
      const organizationsCursor = this.getOrganizationsCursor();

      for (
        let organization = await organizationsCursor.next();
        organization != null;
        organization = await organizationsCursor.next()
      ) {
        const link: SitemapItemLoose = {
          url: `${[organization.inn, organization.kpp].filter(Boolean).join('-')}/`,
        };

        sitemapStream.write(link);
      }

      sitemapStream.end();
    } catch (error) {
      console.error('Error during sitemap process:', error);
    } finally {
      await mongoose.disconnect();
    }
  }

  private createFolder() {
    try {
      if (!existsSync(this.outputFolderPath)) {
        mkdirSync(this.outputFolderPath, { recursive: true });
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async getSitemapStream() {
    const processLog = await this.processLog();

    const stream = new SitemapAndIndexStream({
      limit: this.linksPerSitemap,
      lastmodDateOnly: false,
      getSitemapStream: (i) => {
        const sitemapStream = new SitemapStream({
          hostname: this.hostname,
          xmlns: {
            news: false,
            xhtml: true,
            image: false,
            video: false,
          },
        });

        const fileName = `${this.fileNamePrefix}-${i}.xml.gz`;
        const outputFilePath = resolve(this.outputFolderPath, fileName);
        const writeStream = sitemapStream
          .pipe(createGzip())
          .pipe(createWriteStream(outputFilePath));

        writeStream.on('finish', () => {
          processLog.tick();
        });

        return [
          new URL(fileName, this.storageUrl).toString(),
          sitemapStream,
          writeStream,
        ];
      },
    });

    const indexFileName = `${this.fileNamePrefix}-index.xml`;
    const outputIndexFilePath = resolve(this.outputFolderPath, indexFileName);
    stream.pipe(createWriteStream(outputIndexFilePath));

    return stream;
  }

  private getOrganizationsCursor() {
    return Organization.find({}, { inn: 1, kpp: 1, _id: 0 })
      .lean()
      .cursor()
      .addCursorFlag('noCursorTimeout', true);
  }

  private async processLog() {
    console.log('Start counting documents...');
    const totalDocuments = await Organization.countDocuments();

    console.log(`${'Total documents'.padEnd(15)} :`, totalDocuments);
    console.log(
      `${'Total sitemaps'.padEnd(15)} :`,
      Math.ceil(totalDocuments / this.linksPerSitemap),
    );

    return new ProgressBar(
      `${'Sitemap process'.padEnd(15)} : [:bar] :current/:total :percent :etas :elapseds`,
      {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: Math.ceil(totalDocuments / this.linksPerSitemap),
      },
    );
  }
}

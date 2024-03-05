import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import ProgressBar from 'progress';

import { db, Organization } from '../db';
import type { IOrganization } from '../db';

interface IOptions {
  outputFolderPath: string;
  hostname: string;
  fileSize: number;
}

export class LinksCreator {
  private readonly outputFolderPath: string;
  private readonly hostname: string;
  private readonly linksBatch: {
    id: number;
    links: string[];
  };
  private readonly fileSize: number;

  constructor(options: IOptions) {
    this.outputFolderPath = options.outputFolderPath;
    this.hostname = options.hostname;
    this.linksBatch = {
      id: 1,
      links: [],
    };
    this.fileSize = options.fileSize;
  }

  static async create(options: IOptions) {
    const linksCreator = new LinksCreator(options);
    await linksCreator.create();
  }

  async create() {
    try {
      await db.connect();
      this.createFolder();
      const organizationsCursor = this.getOrganizationsCursor();
      const processLog = await this.processLog();

      for (
        let organization = await organizationsCursor.next();
        organization != null;
        organization = await organizationsCursor.next()
      ) {
        if (this.linksBatch.links.length < this.fileSize) {
          this.enrichLinkBatch(organization);
        } else {
          await this.saveLinksBatch();
          processLog.tick();
        }
      }

      if (this.linksBatch.links.length) {
        await this.saveLinksBatch();
        processLog.tick();
      }
    } catch (error) {
      console.error(error);
    } finally {
      await db.disconnect();
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

  private getOrganizationsCursor() {
    return Organization.find({}, { inn: 1, kpp: 1, _id: 0 })
      .lean()
      .cursor()
      .addCursorFlag('noCursorTimeout', true);
  }

  private enrichLinkBatch(organization: IOrganization) {
    const pathname = `${[organization.inn, organization.kpp].filter(Boolean).join('-')}/`;
    const url = new URL(pathname, this.hostname);

    this.linksBatch.links.push(url.href);
  }

  private async saveLinksBatch() {
    try {
      const fileName = `${this.outputFolderPath}/links-batch-${this.linksBatch.id}.txt`;
      await writeFile(fileName, this.linksBatch.links.join('\n'));
      this.linksBatch.links = [];
      this.linksBatch.id++;
    } catch (error) {
      console.error(error);
    }
  }

  private async processLog() {
    console.log('Start counting documents...');
    const totalDocuments = await Organization.countDocuments();

    console.log(`${'Total documents'.padEnd(15)} :`, totalDocuments);
    console.log(
      `${'Total files'.padEnd(15)} :`,
      Math.ceil(totalDocuments / this.fileSize),
    );

    return new ProgressBar(
      `${'Links process'.padEnd(15)} : [:bar] :current/:total :percent :etas :elapseds`,
      {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: Math.ceil(totalDocuments / this.fileSize),
      },
    );
  }
}

import iconv from 'iconv-lite';
import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';
import sax from 'sax';

import { db, Organization, OrganizationBuilder } from './db';
import type { IOrganization } from './db';

const INPUT_FOLDER_PATH = path.resolve(__dirname, '..', 'input', '_egrul');

const enrich = async () => {
  await db.connect();
  await db.connection.dropDatabase();

  const zipFileNames = fs
    .readdirSync(INPUT_FOLDER_PATH)
    .filter((file) => file.match(/\.zip$/i));

  const zipFilePaths = zipFileNames.map((file) =>
    path.resolve(INPUT_FOLDER_PATH, file),
  );

  for (const zipFilePath of zipFilePaths) {
    const zipFile = await JSZip.loadAsync(fs.readFileSync(zipFilePath));
    const xmlFiles = Object.values(zipFile.files).filter((file) =>
      file.name.match(/\.xml$/i),
    );

    for (const xmlFile of xmlFiles) {
      const saxStream = sax.createStream(true, { trim: true });
      const xmlStream = xmlFile
        .nodeStream()
        .pipe(iconv.decodeStream('win1251'))
        .pipe(saxStream);

      const organizations: IOrganization[] = [];
      let organization: OrganizationBuilder | null = null;

      xmlStream.on('opentag', (node) => {
        switch (node.name) {
          case 'СвЮЛ': {
            if (organization) organizations.push(organization.build());

            const ogrn = node.attributes['ОГРН'] as string;
            const ogrnDate = node.attributes['ДатаОГРН'] as string;
            const opf = node.attributes?.['ПолнНаимОПФ'] as string;
            const inn = node.attributes?.['ИНН'] as string;
            const kpp = node.attributes?.['КПП'] as string;

            organization = new OrganizationBuilder(
              ogrn,
              ogrnDate,
              opf,
              inn,
              kpp,
            );
            break;
          }
          case 'СвНаимЮЛ': {
            const fullName = node.attributes['НаимЮЛПолн'] as string;
            organization?.setFullName(fullName);
            break;
          }
          case 'СвНаимЮЛСокр': {
            const shortName = node.attributes['НаимСокр'] as string;
            organization?.setShortName(shortName);
            break;
          }
        }
      });

      xmlStream.on('end', () => {
        if (organization) organizations.push(organization.build());
        Organization.insertMany(organizations);
        console.log('>>>END');
      });

      // TODO
      xmlStream.on('error', (error) => {
        console.log('>>>ERROR: ', error);
      });
    }
  }

  // TODO
  // await db.disconnect();
};

enrich();

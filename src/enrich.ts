import iconv from 'iconv-lite';
import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';
import ProgressBar from 'progress';
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

  for (let i = 0; i < zipFilePaths.length; i++) {
    const zipFilePath = zipFilePaths[i];
    const zipFile = await JSZip.loadAsync(fs.readFileSync(zipFilePath));
    const xmlFiles = Object.values(zipFile.files).filter((file) =>
      file.name.match(/\.xml$/i),
    );

    const progressBar = new ProgressBar(
      `Processing "${zipFileNames[i]}"`.padEnd(43, ' ') +
        ': [:bar] :ratexml/s :percent :etas :elapseds',
      {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: xmlFiles.length,
      },
    );

    for (let j = 0; j < xmlFiles.length; j++) {
      const xmlFile = xmlFiles[j];
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

      xmlStream.on('error', (error) => {
        console.error(error);
      });

      xmlStream.on('end', () => {
        if (organization) organizations.push(organization.build());
        Organization.insertMany(organizations);
      });

      await new Promise((resolve) => xmlStream.on('end', resolve));
      progressBar.tick();

      const isLastFile =
        i === zipFilePaths.length - 1 && j === xmlFiles.length - 1;

      if (isLastFile) {
        console.log('Processing finished');
        await db.disconnect();
      }
    }
  }
};

enrich();

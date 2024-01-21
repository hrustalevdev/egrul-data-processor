import iconv from 'iconv-lite';
import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';

import { db, Organization } from './db';

const INPUT_FOLDER_PATH = path.resolve(__dirname, '..', 'input', '_egrul');

const enrich = async () => {
  await db.connect();
  await db.connection.dropDatabase();

  console.log('>>>INPUT_FOLDER_PATH: ', INPUT_FOLDER_PATH);
  const zipFileNames = fs
    .readdirSync(INPUT_FOLDER_PATH)
    .filter((file) => file.match(/\.zip$/i));
  console.log('>>>ZIP FILES: ', zipFileNames);
  const zipFilePaths = zipFileNames.map((file) =>
    path.resolve(INPUT_FOLDER_PATH, file),
  );
  console.log('>>>ZIP FILES PATHS: ', zipFilePaths);

  for (let i = 0; i < zipFilePaths.length; i++) {
    const zipFilePath = zipFilePaths[i];
    const zipFile = await JSZip.loadAsync(fs.readFileSync(zipFilePath));
    const xmlFiles = Object.values(zipFile.files).filter((file) =>
      file.name.match(/\.xml$/i),
    );
    console.log('>>>XML FILES: ', xmlFiles);

    for (let j = 0; j < xmlFiles.length; j++) {
      const xmlFile = xmlFiles[j];
      const xmlStream = xmlFile
        .nodeStream()
        .pipe(iconv.decodeStream('win1251'));

      let xmlContent = '';

      xmlStream.on('data', (chunk) => {
        xmlContent += chunk;
        const lines = xmlContent.split('\n');
        console.log('>>>LINES: ', lines);
      });
    }
  }

  await Organization.create({
    name: 'Bill',
    inn: '123',
    kpp: '123',
    type: 'legal',
  });
  await Organization.insertMany([
    {
      name: 'Bill',
      inn: '123',
      kpp: '123',
      type: 'legal',
    },
    {
      name: 'Bill',
      inn: '123',
      kpp: '123',
      type: 'legal',
    },
  ]);
  await db.disconnect();
};

enrich();

import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';

import { db } from '../db';

import { Progress } from './lib/Progress';
import { xmlProcess } from './lib/xmlProcess';

export const enrich = async (inputFolderPath: string) => {
  await db.connect();
  await db.connection.dropDatabase();

  const zipFileNames = fs
    .readdirSync(inputFolderPath)
    .filter((file) => file.match(/\.zip$/i))
    .sort((a, b) => {
      const numberA = Number(a.match(/(\d+)\.zip$/)?.[1]);
      const numberB = Number(b.match(/(\d+)\.zip$/)?.[1]);
      return numberA - numberB;
    });

  const zipFilePaths = zipFileNames.map((file) =>
    path.resolve(inputFolderPath, file),
  );

  for (let i = 0; i < zipFilePaths.length; i++) {
    const zipFilePath = zipFilePaths[i];
    const zipFile = await JSZip.loadAsync(fs.readFileSync(zipFilePath));
    const xmlFiles = Object.values(zipFile.files).filter((file) =>
      file.name.match(/\.xml$/i),
    );

    const progress = new Progress(zipFileNames[i], xmlFiles.length);

    for (let j = 0; j < xmlFiles.length; j++) {
      const xmlFile = xmlFiles[j];
      const isLastFile =
        i === zipFilePaths.length - 1 && j === xmlFiles.length - 1;

      await xmlProcess(xmlFile);
      progress.tick();

      if (isLastFile) {
        console.log('Processing finished');
        await db.disconnect();
      }
    }
  }
};

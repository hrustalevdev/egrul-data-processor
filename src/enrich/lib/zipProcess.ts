import JSZip from 'jszip';
import fs from 'node:fs';

import { xmlProcess } from './xmlProcess';

export const zipProcess = async (zipFilePath: string) => {
  const zipFile = await JSZip.loadAsync(fs.readFileSync(zipFilePath));
  const xmlFiles = Object.values(zipFile.files).filter((file) =>
    file.name.match(/\.xml$/i),
  );

  /** Promise.all не подходит, т.к. сильно нагружает память */
  for (const xmlFile of xmlFiles) {
    await xmlProcess(xmlFile);
  }
};

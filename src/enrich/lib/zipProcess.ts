import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';

import { Progress } from './Progress';
import { xmlProcess } from './xmlProcess';

export const zipProcess = async (zipFilePath: string) => {
  const zipFile = await JSZip.loadAsync(fs.readFileSync(zipFilePath));
  const xmlFiles = Object.values(zipFile.files).filter((file) =>
    file.name.match(/\.xml$/i),
  );

  const zipFileName = path.basename(zipFilePath);
  const progress = new Progress(zipFileName, xmlFiles.length);

  for (const xmlFile of xmlFiles) {
    await xmlProcess(xmlFile);
    progress.tick();
  }
};

import fs from 'node:fs';
import path from 'node:path';

export const prepareZipFilePaths = (inputFolderPath: string): string[] => {
  return fs
    .readdirSync(inputFolderPath)
    .filter((file) => file.match(/\.zip$/i))
    .sort((a, b) => {
      const numberA = Number(a.match(/(\d+)\.zip$/)?.[1]);
      const numberB = Number(b.match(/(\d+)\.zip$/)?.[1]);
      return numberA - numberB;
    })
    .map((file) => path.resolve(inputFolderPath, file));
};

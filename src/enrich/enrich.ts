import { db } from '../db';

import { prepareZipFilePaths } from './lib/prepareZipFilePaths';
import { zipProcess } from './lib/zipProcess';

export const enrich = async (inputFolderPath: string) => {
  try {
    await db.connect();
    await db.connection.dropDatabase();

    const zipFilePaths = prepareZipFilePaths(inputFolderPath);

    for (const zipFilePath of zipFilePaths) {
      await zipProcess(zipFilePath);
    }

    console.log('Processing finished');
  } catch (error) {
    console.error('Error during enrich process:', error);
  } finally {
    await db.disconnect();
  }
};

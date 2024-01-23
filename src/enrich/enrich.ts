import os from 'node:os';
import path from 'node:path';

import { db } from '../db';
import { isDropDatabase } from '../env';

import { prepareZipFilePaths } from './lib/prepareZipFilePaths';
import { Progress } from './lib/Progress';
import { WorkerPool } from './lib/worker-pool/WorkerPool';

const workerPool = new WorkerPool(
  os.availableParallelism(),
  path.resolve(__dirname, 'lib', 'zipProcess.worker.js'),
);

export const enrich = async (inputFolderPath: string) => {
  try {
    await db.connect();
    if (isDropDatabase) await db.connection.dropDatabase();

    const zipFilePaths = prepareZipFilePaths(inputFolderPath);

    const folderName = path.basename(inputFolderPath);
    const progress = new Progress(folderName, zipFilePaths.length);

    await Promise.all(
      zipFilePaths.map((zipFilePath) => {
        return new Promise((resolve, reject) => {
          workerPool.runTask(zipFilePath, (error, result) => {
            if (error) {
              console.error(error);
              reject(error);
            } else {
              console.clear();
              progress.tick({ file: result });
              resolve(result);
            }
          });
        });
      }),
    );

    console.log('Processing finished');
  } catch (error) {
    console.error('Error during enrich process:', error);
  } finally {
    await db.disconnect();
    workerPool.close();
  }
};

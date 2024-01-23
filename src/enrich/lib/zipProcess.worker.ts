import path from 'node:path';
import { parentPort } from 'node:worker_threads';

import { db } from '../../db';

import { zipProcess } from './zipProcess';

parentPort?.on('message', async (zipFilePath) => {
  await db.connect();
  await zipProcess(zipFilePath);
  const zipFileName = path.basename(zipFilePath);
  parentPort?.postMessage(zipFileName);
});

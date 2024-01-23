import path from 'node:path';

import { isTesting, registryType } from '../env';

import { enrich } from './enrich';

const folderName = isTesting ? `_${registryType}` : `${registryType}`;

const inputFolderPath = path.resolve(
  __dirname,
  '..',
  '..',
  'input',
  `${folderName}`,
);

enrich(inputFolderPath);

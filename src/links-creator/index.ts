import path from 'node:path';

import { LinksCreator } from './LinksCreator';

const MILLION = 1000000;

LinksCreator.create({
  outputFolderPath: path.resolve(__dirname, '..', '..', 'output', 'links'),
  hostname: 'https://www.sravni.ru/kontragent/',
  fileSize: MILLION,
});

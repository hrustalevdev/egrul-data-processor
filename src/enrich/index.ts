import path from 'node:path';

import { enrich } from './enrich';

const INPUT_FOLDER_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'input',
  '_egrul',
);

enrich(INPUT_FOLDER_PATH);

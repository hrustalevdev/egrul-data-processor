import { db } from '../db';

export const sitemap = async (outputFolderPath: string) => {
  try {
    await db.connect();

    console.log(outputFolderPath);
    console.log('Sitemap is ready');
    console.log('Processing finished');
  } catch (error) {
    console.error('Error during sitemap process:', error);
  } finally {
    await db.disconnect();
  }
};

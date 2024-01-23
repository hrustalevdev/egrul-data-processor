import iconv from 'iconv-lite';
import type JSZip from 'jszip';
import sax from 'sax';

import { Organization, OrganizationBuilder } from '../../db';
import type { IOrganization } from '../../db';

export const xmlProcess = async (xmlFile: JSZip.JSZipObject) => {
  const saxStream = sax.createStream(true, { trim: true });
  const xmlStream = xmlFile
    .nodeStream()
    .pipe(iconv.decodeStream('win1251'))
    .pipe(saxStream);

  const organizations: IOrganization[] = [];
  let organization: OrganizationBuilder | null = null;

  xmlStream.on('opentag', (node) => {
    switch (node.name) {
      case 'СвЮЛ': {
        if (organization) organizations.push(organization.build());

        const ogrn = node.attributes['ОГРН'] as string;
        const ogrnDate = node.attributes['ДатаОГРН'] as string;
        const opf = node.attributes?.['ПолнНаимОПФ'] as string;
        const inn = node.attributes?.['ИНН'] as string;
        const kpp = node.attributes?.['КПП'] as string;

        organization = new OrganizationBuilder(ogrn, ogrnDate, opf, inn, kpp);
        break;
      }
      case 'СвНаимЮЛ': {
        const fullName = node.attributes['НаимЮЛПолн'] as string;
        organization?.setFullName(fullName);
        break;
      }
      case 'СвНаимЮЛСокр': {
        const shortName = node.attributes['НаимСокр'] as string;
        organization?.setShortName(shortName);
        break;
      }
    }
  });

  xmlStream.on('error', (error) => {
    console.error(error);
    throw error;
  });

  xmlStream.on('end', () => {
    if (organization) organizations.push(organization.build());
    Organization.insertMany(organizations);
  });

  await new Promise((resolve) => xmlStream.on('end', resolve));
};
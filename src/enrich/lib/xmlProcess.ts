import iconv from 'iconv-lite';
import type JSZip from 'jszip';
import sax from 'sax';

import { Contractor, ContractorBuilder } from '../../db';
import type { TFullOrganizationDataItem } from '../../db/types';
import { registryType } from '../../env';

export const xmlProcess = async (xmlFile: JSZip.JSZipObject) => {
  const saxStream = sax.createStream(true, { trim: true });
  const xmlStream = xmlFile
    .nodeStream()
    .pipe(iconv.decodeStream('win1251'))
    .pipe(saxStream);

  let contractor: ContractorBuilder | null = null;
  const contractors: TFullOrganizationDataItem[] = [];
  const openTags: Map<string, true> = new Map();

  /** ЕГРЮЛ */
  xmlStream.on('opentag', (tag) => {
    if (registryType !== 'egrul') return;

    switch (tag.name) {
      case 'СвЮЛ': {
        if (contractor) {
          contractors.push(contractor.build());
          openTags.clear();
        }

        contractor = ContractorBuilder.init();

        const ogrn = tag.attributes['ОГРН'] as string;
        const ogrnDate = tag.attributes['ДатаОГРН'] as string;
        const inn = tag.attributes?.['ИНН'] as string;
        const kpp = tag.attributes?.['КПП'] as string;

        contractor.setType('LEGAL');
        contractor.setOgrn(ogrn, ogrnDate);
        contractor.setInn(inn);
        contractor.setKpp(kpp);
        break;
      }

      case 'СвУчетНО': {
        const inn = tag.attributes?.['ИНН'] as string;
        const kpp = tag.attributes?.['КПП'] as string;

        contractor?.setInn(inn);
        contractor?.setKpp(kpp);
        break;
      }

      case 'СвНаимЮЛ': {
        const fullNameWithOpf = tag.attributes['НаимЮЛПолн'] as string;
        const shortNameWithOpf = tag.attributes['НаимЮЛСокр'] as string;
        contractor?.setValue(fullNameWithOpf);
        contractor?.setFullNameWithOpf(fullNameWithOpf);
        shortNameWithOpf && contractor?.setShortNameWithOpf(shortNameWithOpf);
        break;
      }

      case 'СвНаимЮЛСокр': {
        const shortName = tag.attributes['НаимСокр'] as string;
        contractor?.setShortNameWithOpf(shortName);
        break;
      }

      case 'СведДолжнФЛ': {
        openTags.set(tag.name, true);
        break;
      }

      case 'СвФЛ': {
        if (!openTags.has('СведДолжнФЛ')) return;

        const surname = tag.attributes['Фамилия'];
        const name = tag.attributes['Имя'];
        const patronymic = tag.attributes['Отчество'];
        const fullName = [surname, name, patronymic].filter(Boolean).join(' ');

        contractor?.setManagementName(fullName);
        break;
      }

      case 'СвДолжн': {
        if (!openTags.has('СведДолжнФЛ')) return;

        const post = tag.attributes['НаимДолжн'] as string;
        contractor?.setManagementPost(post);
        break;
      }

      case 'СвАдресЮЛ': {
        openTags.set(tag.name, true);
        break;
      }

      // case 'СвАдрЮЛФИАС'

      // TODO: добавить мыло
      // case 'СвАдрЭлПочты': {
      //   const email = tag.attributes['E-mail'] as string;
      //   contractor?.setEmail(email);
      //   break;
      // }

      // case 'СвОКВЭДОсн': {
      //   const code = tag.attributes['КодОКВЭД'] as string;
      //   const name = tag.attributes['НаимОКВЭД'] as string;
      //   contractor?.setMainOkved(code, name);
      //   break;
      // }
    }
  });
  // .on('text', (text) => {
  //   console.log('>>>TEXT: ', text);
  // })

  /** ЕГРИП */
  xmlStream.on('opentag', (tag) => {
    if (registryType !== 'egrip') return;
    console.log(tag);

    // switch (tag.name) {
    //   case 'СвИП': {
    //     if (contractor) contractors.push(contractor.build());
    //
    //     const ogrn = tag.attributes['ОГРНИП'] as string;
    //     const ogrnDate = tag.attributes['ДатаОГРНИП'] as string;
    //     const opf = tag.attributes?.['НаимВидИП'] as string;
    //     const inn = tag.attributes?.['ИННФЛ'] as string;
    //
    //     contractor = new OrganizationBuilder(ogrn, ogrnDate, opf, inn);
    //     break;
    //   }
    //
    //   case 'ФИОРус': {
    //     const lastName = tag.attributes['Фамилия'] as string;
    //     const firstName = tag.attributes['Имя'] as string;
    //     const patronymic = tag.attributes['Отчество'] as string;
    //
    //     const fullName = [lastName, firstName, patronymic]
    //       .filter(Boolean)
    //       .join(' ');
    //
    //     contractor?.setFullName(fullName);
    //     break;
    //   }
    //
    //   case 'СвАдрЭлПочты': {
    //     const email = tag.attributes['E-mail'] as string;
    //     contractor?.setEmail(email);
    //     break;
    //   }
    //
    //   case 'СвОКВЭДОсн': {
    //     const code = tag.attributes['КодОКВЭД'] as string;
    //     const name = tag.attributes['НаимОКВЭД'] as string;
    //     contractor?.setMainOkved(code, name);
    //     break;
    //   }
    // }
  });

  xmlStream.on('closetag', (tag) => openTags.delete(tag));

  xmlStream.on('error', (error) => {
    console.error(error);
    throw error;
  });

  xmlStream.on('end', () => {
    if (contractor) contractors.push(contractor.build());
    Contractor.insertMany(contractors);
  });

  await new Promise((resolve) => xmlStream.on('end', resolve));
};

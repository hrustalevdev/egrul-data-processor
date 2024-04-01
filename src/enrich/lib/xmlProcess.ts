import * as console from 'console';
import iconv from 'iconv-lite';
import type JSZip from 'jszip';
import sax from 'sax';

import { Contractor, ContractorBuilder } from '../../db';
import type { TFullOrganizationDataItem, UAreaKind } from '../../db/types';
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

  xmlStream.on('opentag', (tag) => openTags.set(tag.name, true));
  xmlStream.on('closetag', (tag) => openTags.delete(tag));

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

      case 'СвАдрЮЛФИАС': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const postalCode = tag.attributes['Индекс'] as string;
        contractor?.setAddrPostalCode(postalCode);
        break;
      }

      case 'МуниципРайон': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['ВидКод'] as UAreaKind;
        const area = tag.attributes['Наим'] as string;
        contractor?.setMunicipalArea(kind, area);
        break;
      }

      case 'ГородСелПоселен': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['ВидКод'] as UAreaKind;
        const settlement = tag.attributes['Наим'] as string;
        contractor?.setSettlement(kind, settlement);
        break;
      }

      case 'НаселенПункт': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Вид'] as string;
        const locality = tag.attributes['Наим'] as string;
        contractor?.setLocality(kind, locality);
        break;
      }

      case 'ЭлПланСтруктур': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const district = tag.attributes['Наим'] as string;
        contractor?.setDistrict(kind, district);
        break;
      }

      case 'ЭлУлДорСети': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const street = tag.attributes['Наим'] as string;
        contractor?.setStreet(kind, street);
        break;
      }

      case 'Здание': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const number = tag.attributes['Номер'] as string;
        contractor?.setBuilding(kind, number);
        break;
      }

      case 'ПомещЗдания': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const number = tag.attributes['Номер'] as string;
        contractor?.setApartment(kind, number);
        break;
      }

      case 'ПомещКвартиры': {
        if (!openTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const number = tag.attributes['Номер'] as string;
        contractor?.setRoom(kind, number);
        break;
      }

      case 'СвСтатус': {
        const code = tag.attributes['КодСтатусЮЛ'] as string;
        contractor?.setStatus(code);
        break;
      }

      case 'СвОКВЭДОсн':
      case 'СвОКВЭДДоп': {
        const isMain = openTags.has('СвОКВЭДОсн');
        const code = tag.attributes['КодОКВЭД'] as string;
        const name = tag.attributes['НаимОКВЭД'] as string;
        const type = tag.attributes['ПрВерсОКВЭД'] as string;
        contractor?.setOkved(isMain, code, name, type);
        break;
      }

      case 'СвРегОрг': {
        const code = tag.attributes['КодНО'] as string;
        const name = tag.attributes['НаимНО'] as string;
        const address = tag.attributes['АдрРО'] as string;
        contractor?.setFtsRegistration(code, name, address);
        break;
      }

      case 'СвНО': {
        if (!openTags.has('СвУчетНО')) return;

        const code = tag.attributes['КодНО'] as string;
        const name = tag.attributes['НаимНО'] as string;
        contractor?.setFtsReport(code, name);
        break;
      }

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

  xmlStream.on('text', (text) => {
    if (registryType !== 'egrul') return;

    if (openTags.has('СвАдресЮЛ') && openTags.has('НаимРегион')) {
      contractor?.setAddrRegion(text);
    }
  });

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

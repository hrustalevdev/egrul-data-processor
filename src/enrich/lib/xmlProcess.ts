import * as console from 'console';
import iconv from 'iconv-lite';
import type JSZip from 'jszip';
import sax from 'sax';
import type { QualifiedTag, Tag } from 'sax';

import { Contractor, ContractorBuilder } from '../../db';
import type {
  TFounder,
  TFullOrganizationDataItem,
  UAreaKind,
  UIpKind,
} from '../../db/types';
import { registryType } from '../../env';

interface IMemo {
  founder: TFounder;
}

export const xmlProcess = async (xmlFile: JSZip.JSZipObject) => {
  const saxStream = sax.createStream(true, { trim: true });
  const xmlStream = xmlFile
    .nodeStream()
    .pipe(iconv.decodeStream('win1251'))
    .pipe(saxStream);

  let contractor: ContractorBuilder | null = null;
  const contractors: TFullOrganizationDataItem[] = [];
  const openedTags: Map<string, true> = new Map();
  /** Для промежуточного хранения данных */
  const memo: IMemo = { founder: {} };

  const getFio = (tag: Tag | QualifiedTag) => {
    const surname = tag.attributes['Фамилия'];
    const name = tag.attributes['Имя'];
    const patronymic = tag.attributes['Отчество'];
    return [surname, name, patronymic].filter(Boolean).join(' ');
  };

  xmlStream.on('opentag', (tag) => openedTags.set(tag.name, true));
  xmlStream.on('closetag', (tag) => openedTags.delete(tag));

  /** ЕГРЮЛ */
  xmlStream.on('opentag', (tag) => {
    if (registryType !== 'egrul') return;

    switch (tag.name) {
      case 'СвЮЛ': {
        if (contractor) {
          contractors.push(contractor.build());
          openedTags.clear();
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
        const date = tag.attributes['ДатаПостУч'] as string;

        contractor?.setInn(inn);
        contractor?.setKpp(kpp);
        contractor?.setFtsReportDoc({ date });
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
        if (openedTags.has('СведДолжнФЛ')) {
          const fio = getFio(tag);
          contractor?.setManagementName(fio);
        }

        if (openedTags.has('СвУчредит') && openedTags.has('УчрФЛ')) {
          const inn = tag.attributes['ИННФЛ'] as string;
          const fio = getFio(tag);
          memo.founder = { inn, fio, type: 'PHYSICAL' };
        }

        break;
      }

      case 'СвДолжн': {
        if (!openedTags.has('СведДолжнФЛ')) return;

        const post = tag.attributes['НаимДолжн'] as string;
        contractor?.setManagementPost(post);
        break;
      }

      case 'СвАдрЮЛФИАС': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const postalCode = tag.attributes['Индекс'] as string;
        contractor?.setAddrPostalCode(postalCode);
        break;
      }

      case 'МуниципРайон': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['ВидКод'] as UAreaKind;
        const area = tag.attributes['Наим'] as string;
        contractor?.setMunicipalArea(kind, area);
        break;
      }

      case 'ГородСелПоселен': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['ВидКод'] as UAreaKind;
        const settlement = tag.attributes['Наим'] as string;
        contractor?.setSettlement(kind, settlement);
        break;
      }

      case 'НаселенПункт': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Вид'] as string;
        const locality = tag.attributes['Наим'] as string;
        contractor?.setLocality(kind, locality);
        break;
      }

      case 'ЭлПланСтруктур': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const district = tag.attributes['Наим'] as string;
        contractor?.setDistrict(kind, district);
        break;
      }

      case 'ЭлУлДорСети': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const street = tag.attributes['Наим'] as string;
        contractor?.setStreet(kind, street);
        break;
      }

      case 'Здание': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const number = tag.attributes['Номер'] as string;
        contractor?.setBuilding(kind, number);
        break;
      }

      case 'ПомещЗдания': {
        if (!openedTags.has('СвАдресЮЛ')) return;

        const kind = tag.attributes['Тип'] as string;
        const number = tag.attributes['Номер'] as string;
        contractor?.setApartment(kind, number);
        break;
      }

      case 'ПомещКвартиры': {
        if (!openedTags.has('СвАдресЮЛ')) return;

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
        const isMain = openedTags.has('СвОКВЭДОсн');
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
        if (!openedTags.has('СвУчетНО')) return;

        const code = tag.attributes['КодНО'] as string;
        const name = tag.attributes['НаимНО'] as string;
        contractor?.setFtsReport(code, name);
        contractor?.setFtsReportDoc({ code });
        break;
      }

      case 'СвОргПФ': {
        if (!openedTags.has('СвРегПФ')) return;

        const code = tag.attributes['КодПФ'] as string;
        const name = tag.attributes['НаимПФ'] as string;
        contractor?.setPf(code, name);
        contractor?.setPfRegDoc({ code });
        break;
      }

      case 'СвОргФСС': {
        if (!openedTags.has('СвРегФСС')) return;

        const code = tag.attributes['КодФСС'] as string;
        const name = tag.attributes['НаимФСС'] as string;
        contractor?.setSif(code, name);
        break;
      }

      case 'НаимИННЮЛ': {
        const isUlRussian =
          openedTags.has('СвУчредит') && openedTags.has('УчрЮЛРос');

        const isUlForeign =
          openedTags.has('СвУчредит') && openedTags.has('УчрЮЛИн');

        const isUlMunicipal =
          openedTags.has('СвУчредит') &&
          openedTags.has('УчрРФСубМО') &&
          openedTags.has('СвОргОсущПр');

        const isUl = isUlRussian || isUlForeign || isUlMunicipal;

        if (!isUl) return;

        const ogrn = tag.attributes['ОГРН'] as string;
        const inn = tag.attributes['ИНН'] as string;
        const name = tag.attributes['НаимЮЛПолн'] as string;
        memo.founder = { ogrn, inn, name, type: 'LEGAL' };
        break;
      }

      case 'УчрФЛ': {
        if (!openedTags.has('СвУчредит')) return;
        const ogrnip = tag.attributes['ОГРНИП'] as string;
        ogrnip && (memo.founder.ogrn = ogrnip);
        break;
      }

      case 'ДоляУстКап': {
        const isUlRussian =
          openedTags.has('СвУчредит') && openedTags.has('УчрЮЛРос');

        const isUlForeign =
          openedTags.has('СвУчредит') && openedTags.has('УчрЮЛИн');

        const isUlMunicipal =
          openedTags.has('СвУчредит') && openedTags.has('УчрРФСубМО');

        const isUl = isUlRussian || isUlForeign || isUlMunicipal;

        if (!isUl) return;

        // const type = tag.attributes['НаимВидКап'] as string;
        // const value = tag.attributes['ПроцУстКап'] as string;
        // memo.founder.share = {  };
        // contractor?.setFounderShare(type, value);
        break;
      }

      case 'СвУстКап': {
        const type = tag.attributes['НаимВидКап'] as string;
        const value = tag.attributes['СумКап'] as string;
        contractor?.setCapital(type, value);
        break;
      }

      case 'СвРегПФ': {
        const number = tag.attributes['РегНомПФ'] as string;
        const date = tag.attributes['ДатаРег'] as string;
        contractor?.setPfRegDoc({ number, date });
        break;
      }

      case 'СвАдрЭлПочты': {
        const email = tag.attributes['E-mail'] as string;
        contractor?.setEmail(email);
        break;
      }
    }
  });

  xmlStream.on('closetag', (tag) => {
    if (registryType !== 'egrul') return;

    switch (tag) {
      case 'УчрЮЛРос':
      case 'УчрЮЛИн':
      case 'УчрФЛ':
      case 'УчрРФСубМО': {
        if (!openedTags.has('СвУчредит')) return;
        if (!Object.keys(memo.founder).length) return;

        contractor?.setFounder(memo.founder);
        memo.founder = {};
        break;
      }
    }
  });

  xmlStream.on('text', (text) => {
    if (registryType !== 'egrul') return;

    if (openedTags.has('СвАдресЮЛ') && openedTags.has('НаимРегион')) {
      contractor?.setAddrRegion(text);
    }
  });

  /** ЕГРИП */
  xmlStream.on('opentag', (tag) => {
    if (registryType !== 'egrip') return;

    switch (tag.name) {
      case 'СвИП': {
        if (contractor) {
          contractors.push(contractor.build());
          openedTags.clear();
        }

        contractor = ContractorBuilder.init();

        const ogrn = tag.attributes['ОГРНИП'] as string;
        const ogrnDate = tag.attributes['ДатаОГРНИП'] as string;
        const inn = tag.attributes?.['ИННФЛ'] as string;
        const opfKind = tag.attributes?.['КодВидИП'] as UIpKind;

        contractor.setType('INDIVIDUAL');
        contractor.setOgrn(ogrn, ogrnDate);
        contractor.setInn(inn);
        contractor.setIpOpf(opfKind);
        break;
      }

      case 'ФИОРус': {
        if (!openedTags.has('СвФЛ')) return;

        const fio = getFio(tag);
        const fullOpfWithName = [contractor?.data.opf.full, fio]
          .filter(Boolean)
          .join(' ');
        const shortOpfWithName = [contractor?.data.opf.short, fio]
          .filter(Boolean)
          .join(' ');

        const surname = tag.attributes['Фамилия'] as string;
        const name = tag.attributes['Имя'] as string;
        const patronymic = tag.attributes['Отчество'] as string;

        contractor?.setIpFio(surname, name, patronymic);
        contractor?.setValue(shortOpfWithName);
        contractor?.setFullNameWithOpf(fullOpfWithName);
        contractor?.setShortNameWithOpf(shortOpfWithName);
        break;
      }

      case 'СвУчетНО': {
        const inn = tag.attributes?.['ИННФЛ'] as string;
        const date = tag.attributes['ДатаПостУч'] as string;

        contractor?.setInn(inn);
        contractor?.setFtsReportDoc({ date });
        break;
      }

      case 'СвСтатус': {
        const code = tag.attributes['КодСтатус'] as string;
        contractor?.setStatus(code);
        break;
      }

      case 'СвГражд': {
        const kind = tag.attributes['ВидГражд'] as string;
        const country = tag.attributes['НаимСтран'] as string;
        contractor?.setCitizenship(kind, country);
        break;
      }

      case 'СвОКВЭДОсн':
      case 'СвОКВЭДДоп': {
        const isMain = openedTags.has('СвОКВЭДОсн');
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
        if (!openedTags.has('СвУчетНО')) return;

        const code = tag.attributes['КодНО'] as string;
        const name = tag.attributes['НаимНО'] as string;
        contractor?.setFtsReport(code, name);
        contractor?.setFtsReportDoc({ code });
        break;
      }

      case 'СвОргПФ': {
        if (!openedTags.has('СвРегПФ')) return;

        const code = tag.attributes['КодПФ'] as string;
        const name = tag.attributes['НаимПФ'] as string;
        contractor?.setPf(code, name);
        contractor?.setPfRegDoc({ code });
        break;
      }

      case 'СвОргФСС': {
        if (!openedTags.has('СвРегФСС')) return;

        const code = tag.attributes['КодФСС'] as string;
        const name = tag.attributes['НаимФСС'] as string;
        contractor?.setSif(code, name);
        break;
      }

      case 'СвРегПФ': {
        const number = tag.attributes['РегНомПФ'] as string;
        const date = tag.attributes['ДатаРег'] as string;
        contractor?.setPfRegDoc({ number, date });
        break;
      }

      case 'СвАдрЭлПочты': {
        const email = tag.attributes['E-mail'] as string;
        contractor?.setEmail(email);
        break;
      }
    }
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

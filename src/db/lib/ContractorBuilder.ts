import { getTime, parse } from 'date-fns';

import type {
  IFullOrganizationData,
  IRegistrationDocument,
  TFullOrganizationDataItem,
  UType,
} from '../types';
import type { IAddressItem } from '../types/addresses';

import { statusCodesMap } from './statusCodesMap';

interface IAddress {
  postalCode?: string;
  region?: string;
  /** Муниципальный район */
  municipalArea?: string;
  /** Город, село, поселение */
  settlement?: string;
  /** Населённый пункт */
  locality?: string;
  /** Элемент планировочной структуры (р-н, мкр-н) */
  district?: string;
  /** Элемент улично-дорожной сети (ул., ш. и т.п.)*/
  street?: string;
  /** Здание/сооружение */
  building?: string;
  /** Помещение в пределах здания, сооружения */
  apartment?: string;
  /** Помещение в пределах квартиры */
  room?: string;
}

export type UAreaKind = '1' | '2' | '3' | '4';
export type UIpKind = '1' | '2';
export type TMunicipalAreaKind = Record<UAreaKind, string>;
export type TSettlementKind = TMunicipalAreaKind;
export type TIpKind = Record<UIpKind, { full: string; short: string }>;
export type TFounder = IFullOrganizationData['founders'][0];

export class ContractorBuilder implements TFullOrganizationDataItem {
  private readonly _address: IAddress = {};
  private readonly _municipalAreaKind: TMunicipalAreaKind = {
    '1': 'муниципальный район',
    '2': 'городской округ',
    '3': 'внутригородская территория города федерального значения',
    '4': 'муниципальный округ',
  };
  private readonly _settlementKind: TSettlementKind = {
    '1': 'городское поселение',
    '2': 'сельское поселение',
    '3': 'межселенная территория в составе муниципального района',
    '4': 'внутригородской район городского округа',
  };
  private readonly _ipKind: TIpKind = {
    '1': { full: 'Индивидуальный предприниматель', short: 'ИП' },
    '2': { full: 'Глава крестьянского фермерского хозяйства', short: 'ГКФХ' },
  };
  private readonly _statusCodesMap = statusCodesMap;
  private readonly _founders: IFullOrganizationData['founders'] = [];

  constructor(
    public value: string,
    public unrestricted_value: string,
    public data: IFullOrganizationData,
  ) {}

  static init() {
    return new this('', '', {
      state: { status: 'ACTIVE' },
      authorities: {},
      documents: {},
    } as IFullOrganizationData);
  }

  /**
   * Описание типов данных
   * @link - https://sudact.ru/law/prikaz-fns-rossii-ot-18012021-n-ed-7-1417/
   * C - tag
   * A - attr
   * П - text
   * O - required
   * H - optional
   * K - classifier or dictionary
   * M - many
   */

  /** C: СвНаимЮЛ; A_O: НаимЮЛПолн */
  setValue(value: string) {
    this.value = value;
    this.unrestricted_value = value;

    return this;
  }

  /**
   * C: СвЮЛ; A_H: ИНН
   * C: СвУчетНО; A_O: ИНН
   *
   * C: СвИП, A_H: ИННФЛ
   * C: СвУчетНО; A_O: ИННФЛ
   */
  setInn(inn: string) {
    this.data.inn = inn;
    return this;
  }

  /**
   * C: СвЮЛ; A_H: КПП
   * C: СвУчетНО; A_O: КПП
   */
  setKpp(kpp: string) {
    this.data.kpp = kpp;
    return this;
  }

  /**
   * C: СвЮЛ; A_O: ОГРН, ДатаОГРН
   * C: СвИП: A_O: ОГРНИП, ДатаОГРНИП
   */
  setOgrn(ogrn: string, date: string) {
    this.data.ogrn = ogrn;
    this.data.ogrn_date = this._getTimestamp(date);
    return this;
  }

  /** C: СвФЛ > ФИОРус; A_H: Фамилия, Имя, Отчество */
  setIpFio(surname: string, name: string, patronymic: string) {
    this.data.fio = { surname, name, patronymic };
  }

  /** C: СвИП; A_OK: КодВидИП */
  setIpOpf(kind: UIpKind) {
    this.data.opf = {
      full: this._ipKind[kind].full,
      short: this._ipKind[kind].short,
    };
  }

  /** "LEGAL" | "INDIVIDUAL" */
  setType(type: UType) {
    this.data.type = type;
    return this;
  }

  /** C: СвНаимЮЛ; A_O: НаимЮЛПолн */
  setFullNameWithOpf(name: string) {
    this.data.name = {
      full_with_opf: name,
    };

    return this;
  }

  /**
   * C: СвНаимЮЛ; A_H: НаимЮЛСокр
   * C: СвНаимЮЛСокр; A_O: НаимСокр
   */
  setShortNameWithOpf(name: string) {
    this.data.name.short_with_opf = name;
    return this;
  }

  /** C: СведДолжнФЛ > C_H: СвФЛ; A_H: Фамилия, Имя, Отчество */
  setManagementName(name: string) {
    this.data.management = { name, post: '' };
    return this;
  }

  /** C: СведДолжнФЛ > C_H: СвДолжн; A_O: НаимДолжн */
  setManagementPost(post: string) {
    this.data.management.post = post;
    return this;
  }

  /** C: СвАдрЮЛФИАС; A_H: Индекс */
  setAddrPostalCode(code: string) {
    this._address.postalCode = code;
    return this;
  }

  /** С_П: НаимРегион */
  setAddrRegion(region: string) {
    this._address.region = region;
    return this;
  }

  /** С: МуниципРайон; A_O: ВидКод, Наим */
  setMunicipalArea(kind: UAreaKind, area: string) {
    this._address.municipalArea = `${this._municipalAreaKind[kind]} ${area}`;
    return this;
  }

  /** C: ГородСелПоселен; A_O: ВидКод, Наим */
  setSettlement(kind: UAreaKind, settlement: string) {
    this._address.settlement = `${this._settlementKind[kind]} ${settlement}`;
    return this;
  }

  /** C: НаселенПункт; A_O: Вид, Наим */
  setLocality(kind: string, locality: string) {
    this._address.locality = `${kind} ${locality}`;
    return this;
  }

  /** С: ЭлПланСтруктур; A_O: Тип, Наим */
  setDistrict(kind: string, district: string) {
    this._address.district = `${kind} ${district}`;
    return this;
  }

  /** С: ЭлУлДорСети; A_O: Тип, Наим */
  setStreet(kind: string, street: string) {
    this._address.street = `${kind} ${street}`;
    return this;
  }

  /** С: Здание; A_O: Тип, Номер */
  setBuilding(kind: string, number: string) {
    const bNumber = `${kind} ${number}`;

    this._address.building =
      this._address.building ?
        `${this._address.building}, ${bNumber}`
      : bNumber;

    return this;
  }

  /** С: ПомещЗдания; A_O: Тип, Номер */
  setApartment(kind: string, number: string) {
    this._address.apartment = `${kind} ${number}`;
    return this;
  }

  /** С: ПомещКвартиры; A_O: Тип, Номер */
  setRoom(kind: string, number: string) {
    this._address.room = `${kind} ${number}`;
    return this;
  }

  /** С: СвСтатус; A_OK: КодСтатусЮЛ | КодСтатус (для ИП) */
  setStatus(code: string) {
    this.data.state = {
      status: this._statusCodesMap[code]?.status || 'ACTIVE',
    };

    return this;
  }

  /**
   * Гражданство ИП
   * C: СвГражд; A_OK: ВидГражд; A_H: НаимСтран
   */
  setCitizenship(kind: string, country?: string) {
    const countryName = kind === '1' ? 'Российская Федерация' : country || '';

    this.data.citizenship = {
      name: { full: countryName },
    } as IFullOrganizationData['citizenship'];

    return this;
  }

  /** С: СвОКВЭДОсн | СвОКВЭДДоп; A_OK: КодОКВЭД; A_O: НаимОКВЭД; A_HK: ПрВерсОКВЭД */
  setOkved(isMain: boolean, code: string, name: string, type = '2001') {
    const okved = { main: isMain, type, code, name };

    this.data.okveds ?
      this.data.okveds.push(okved)
    : (this.data.okveds = [okved]);

    return this;
  }

  /** C: СвРегОрг; A_OK: КодНО, НаимНО; A_H: АдрРО */
  setFtsRegistration(code: string, name: string, address: string) {
    if (this.data.authorities.fts_registration) return;

    this.data.authorities.fts_registration = { code, name, address };
    return this;
  }

  /** C: СвУчетНО > СвНО; A_OK: КодНО, НаимНО */
  setFtsReport(code: string, name: string) {
    this.data.authorities.fts_report = { code, name };
    return this;
  }

  /** C: СвРегПФ > СвОргПФ; A_OK: КодПФ, НаимПФ */
  setPf(code: string, name: string) {
    this.data.authorities.pf = { code, name };
    return this;
  }

  /** C: СвРегФСС > СвОргФСС; A_OK: КодФСС, НаимФСС */
  setSif(code: string, name: string) {
    this.data.authorities.sif = { code, name };
    return this;
  }

  /**
   * C: СвУчредит > УчрЮЛРос > НаимИННЮЛ 4.131; A_H: ОГРН, ИНН; A_O: НаимЮЛПолн
   * C: СвУчредит > УчрЮЛИн > НаимИННЮЛ 4.131; A_H: ОГРН, ИНН; A_O: НаимЮЛПолн
   * C: СвУчредит > УчрФЛ; A_H: ОГРНИП > СвФЛ 4.129; A_H: Фамилия, Имя, Отчество, ИННФЛ
   * C: СвУчредит > УчрРФСубМО > СвОргОсущПр 4.46 > НаимИННЮЛ 4.131; A_H: ОГРН, ИНН; A_O: НаимЮЛПолн
   *
   * C: СвУчредит > УчрЮЛРос > ДоляУстКап 4.96
   * C: СвУчредит > УчрЮЛИн > ДоляУстКап 4.96
   * C: СвУчредит > УчрФЛ > ДоляУстКап 4.96
   * C: СвУчредит > УчрРФСубМО > ДоляУстКап 4.96
   *
   * ДоляУстКап 4.96; A_O: НоминСтоим > ДоляРубля 4.98; A_O: Числит, Знаменат
   * ДоляУстКап 4.96; A_O: НоминСтоим > РазмерДоли 4.97; П_О: Процент, ДробДесят; C_O: ДробПрост 4.98; A_O: Числит, Знаменат
   */
  setFounder(founder: TFounder) {
    this._founders.push(founder);
    return this;
  }

  /** C: СвУстКап; A_ОК: НаимВидКап; A_O: СумКап */
  setCapital(type: string, value: string) {
    this.data.capital = { type, value: Number(value) };
    return this;
  }

  /**
   * C: СвУчетНО; A_O: ДатаПостУч
   * C: СвУчетНО > СвНО; A_OK: КодНО
   */
  setFtsReportDoc(params: { date?: string; code?: string }) {
    const { date, code } = params;
    if (!this.data.documents.fts_report) {
      this.data.documents.fts_report = {
        type: 'FTS_REPORT',
      } as IRegistrationDocument;
    }

    if (date) {
      this.data.documents.fts_report.issue_date = this._getTimestamp(date);
    }

    if (code) {
      this.data.documents.fts_report.issue_authority = code;
    }

    return this;
  }

  /**
   * C: СвРегПФ; A_O: РегНомПФ, ДатаРег
   * C: СвРегПФ > СвОргПФ; A_OK: КодПФ
   */
  setPfRegDoc(params: { number?: string; date?: string; code?: string }) {
    const { number, date, code } = params;
    if (!this.data.documents.pf_registration) {
      this.data.documents.pf_registration = {
        type: 'PF_REGISTRATION',
      } as IRegistrationDocument;
    }

    if (number) {
      this.data.documents.pf_registration.number = number;
    }

    if (date) {
      this.data.documents.pf_registration.issue_date = this._getTimestamp(date);
    }

    if (code) {
      this.data.documents.pf_registration.issue_authority = code;
    }

    return this;
  }

  /** С: СвАдрЭлПочты; A_O: E-mail */
  setEmail(email: string) {
    const [local, domain] = email.split('@');
    this.data.emails = [
      {
        value: email,
        unrestricted_value: email,
        data: {
          source: email.toLowerCase(),
          local,
          domain,
        },
      },
    ];

    return this;
  }

  build() {
    const { value, unrestricted_value, data } = this;

    const address =
      !this._isEmptyObj(this._address) && this._prepareAddress(this._address);

    const founders = !this._isEmptyObj(this._founders) && this._founders;

    return {
      value,
      unrestricted_value,
      data: {
        ...data,
        ...(address && { address }),
        ...(founders && { founders }),
      },
    } as TFullOrganizationDataItem;
  }

  private _prepareAddress({
    postalCode,
    region,
    municipalArea,
    settlement,
    locality,
    district,
    street,
    building,
    apartment,
    room,
  }: IAddress): Partial<IAddressItem> {
    const source = [
      postalCode,
      region,
      municipalArea,
      settlement,
      locality,
      district,
      street,
      building,
      apartment,
      room,
    ]
      .filter(Boolean)
      .join(', ');

    const data = {
      postal_code: postalCode,
      region_with_type: region,
      source,
    } as IAddressItem['data'];

    return {
      value: source,
      unrestricted_value: source,
      data,
    };
  }

  /**
   * Преобразовывает полученную дату в миллисекунды.
   * @param date - `yyyy-MM-dd`, ex.: `2023-12-30`.
   * @private
   */
  private _getTimestamp(date: string) {
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    return getTime(parsedDate);
  }

  private _isEmptyObj(obj: object) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj) && obj.length === 0) return true;

    return Object.keys(obj).length === 0;
  }
}

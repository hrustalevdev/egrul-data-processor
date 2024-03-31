import { getTime, parse } from 'date-fns';

import type {
  IAuthority,
  IFullOrganizationData,
  TFullOrganizationDataItem,
  UType,
} from '../types';

import { statusCodesMap } from './statusCodesMap';

interface IAddress {
  postalCode?: string;
  regionId?: string;
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

type UKind = '1' | '2' | '3' | '4';
type TMunicipalAreaKind = Record<UKind, string>;
type TSettlementKind = TMunicipalAreaKind;

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
  private readonly _statusCodesMap = statusCodesMap;

  constructor(
    public value: string,
    public unrestricted_value: string,
    public data: IFullOrganizationData,
  ) {}

  static init() {
    return new this('', '', {
      state: {
        status: 'ACTIVE',
      },
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

  /** C: СвЮЛ; A_O: ОГРН */
  setOgrn(ogrn: string) {
    this.data.ogrn = ogrn;
    return this;
  }

  /**
   * C: СвЮЛ; A_O: ДатаОГРН
   * Преобразовываем полученную дату в миллисекунды.
   * @param ogrnDate - `yyyy-MM-dd`, ex.: `2023-12-30`.
   */
  setOgrnDate(ogrnDate: string) {
    const parsedDate = parse(ogrnDate, 'yyyy-MM-dd', new Date());
    this.data.ogrn_date = getTime(parsedDate);
    return this;
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

  /** C: СвНаимЮЛ; A_O: НаимЮЛСокр */
  setShortNameWithOpf(name: string) {
    this.data.name.short_with_opf = name;
    return this;
  }

  /** C: СведДолжнФЛ; C_H: СвФЛ; A_H: Фамилия, Имя, Отчество */
  setManagementName(name: string) {
    this.data.management = { name, post: '' };
    return this;
  }

  /** C: СведДолжнФЛ; C_H: СвДолжн; A_O: НаимДолжн */
  setManagementPost(post: string) {
    this.data.management.post = post;
    return this;
  }

  /** C: СвАдрЮЛФИАС; A_H: Индекс */
  setAddrPostalCode(code: string) {
    this._address.postalCode = code;
    return this;
  }

  /** С_П: Регион */
  setAddrRegionId(id: string) {
    this._address.regionId = id;
    return this;
  }

  /** С_П: НаимРегион */
  setAddrRegion(region: string) {
    this._address.region = region;
    return this;
  }

  /** С: МуниципРайон; A_O: ВидКод, Наим */
  setMunicipalArea(kind: UKind, area: string) {
    this._address.municipalArea = `${this._municipalAreaKind[kind]} ${area}`;
    return this;
  }

  /** C: ГородСелПоселен; A_O: ВидКод, Наим */
  setSettlement(kind: UKind, settlement: string) {
    this._address.settlement = `${this._municipalAreaKind[kind]} ${settlement}`;
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

  setOkved(okved: IFullOrganizationData['okveds'][0]) {
    this.data.okveds ?
      this.data.okveds.push(okved)
    : (this.data.okveds = [okved]);

    return this;
  }

  /** tag: `СвНО`; attr: `КодНО`, `НаимНО` */
  setFts(authority: IAuthority) {
    this.data.authorities = {
      fts_registration: authority,
    };

    return this;
  }

  /** tag: `СвОргПФ`; attr: `КодПФ`, `НаимПФ` */
  setPf(authority: IAuthority) {
    this.data.authorities.pf = authority;
    return this;
  }

  /** tag: `СвОргФСС`; attr: `КодФСС`, `НаимФСС` */
  setSif(authority: IAuthority) {
    this.data.authorities.sif = authority;
    return this;
  }

  // TODO: вернуться и поля и методы! Критично?
  build() {
    // TODO: собрать строку адреса из `_address`
    // setAddress(address: string) {
    //   this.data.address = {
    //     value: address,
    //     unrestricted_value: address,
    //     data: {} as IAddressItem['data'],
    //   };
    //
    //   return this;
    // }
    return this;
  }
}

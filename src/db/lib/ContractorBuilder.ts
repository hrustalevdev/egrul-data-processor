import { getTime, parse } from 'date-fns';

import type {
  IAuthority,
  IFullOrganizationData,
  TFullOrganizationDataItem,
  UStatus,
  UType,
} from '../types';

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

export class ContractorBuilder implements TFullOrganizationDataItem {
  private readonly _address: IAddress = {};

  constructor(
    public value: string,
    public unrestricted_value: string,
    public data: IFullOrganizationData,
  ) {}

  static init() {
    return new this('', '', {} as IFullOrganizationData);
  }

  /**
   * Описание типов данных
   * @link - https://sudact.ru/law/prikaz-fns-rossii-ot-18012021-n-ed-7-1417/
   * C - tag
   * A - attr
   * П - text
   * O - required
   * H - optional
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
  setAddrRegion(id: string) {
    this._address.region = id;
    return this;
  }

  setMunicipalArea(area: string) {
    this._address.municipalArea = area;
    return this;
  }
  setSettlement(settlement: string) {
    this._address.settlement = settlement;
    return this;
  }
  setLocality(locality: string) {
    this._address.locality = locality;
    return this;
  }
  setDistrict(district: string) {
    this._address.district = district;
    return this;
  }
  setStreet(street: string) {
    this._address.street = street;
    return this;
  }
  setBuilding(building: string) {
    this._address.building = building;
    return this;
  }
  setApartment(apartment: string) {
    this._address.apartment = apartment;
    return this;
  }
  setRoom(room: string) {
    this._address.room = room;
    return this;
  }

  // setAddress(address: string) {
  //   this.data.address = {
  //     value: address,
  //     unrestricted_value: address,
  //     data: {} as IAddressItem['data'],
  //   };
  //
  //   return this;
  // }

  setStatus(status: UStatus) {
    this.data.state = {
      status,
    };

    return this;
  }

  /**
   * Гражданство ИП.
   * @param citizenship - полное наименование страны.
   */
  setCitizenship(citizenship: string) {
    this.data.citizenship = {
      name: { full: citizenship },
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
  // TODO: собрать строку адреса из `_address`
  build() {
    return this;
  }
}

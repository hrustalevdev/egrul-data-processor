import { getTime, parse } from 'date-fns';

import type {
  IFullOrganizationData,
  TFullOrganizationDataItem,
  UStatus,
  UType,
} from '../types';
import type { IAddressItem } from '../types/addresses';

export class ContractorBuilder implements TFullOrganizationDataItem {
  constructor(
    public value: string,
    public unrestricted_value: string,
    public data: IFullOrganizationData,
  ) {}

  static init() {
    return new this('', '', {} as IFullOrganizationData);
  }

  setValue(value: string) {
    this.value = value;
    this.unrestricted_value = value;
    return this;
  }

  setInn(inn: string) {
    this.data.inn = inn;
    return this;
  }

  setKpp(kpp: string) {
    this.data.kpp = kpp;
    return this;
  }

  setOgrn(ogrn: string) {
    this.data.ogrn = ogrn;
    return this;
  }

  /**
   * Преобразовываем полученную дату в миллисекунды.
   * @param ogrnDate - `yyyy-MM-dd`, ex.: `2023-12-30`.
   */
  setOgrnDate(ogrnDate: string) {
    const parsedDate = parse(ogrnDate, 'yyyy-MM-dd', new Date());
    this.data.ogrn_date = getTime(parsedDate);
    return this;
  }

  setType(type: UType) {
    this.data.type = type;
    return this;
  }

  setFullNameWithOpf(name: string) {
    this.data.name = {
      full_with_opf: name,
    };
    return this;
  }

  setShortNameWithOpf(name: string) {
    this.data.name.short_with_opf = name;
    return this;
  }

  setOkato(okato: string) {
    this.data.okato = okato;
    return this;
  }

  setOktmo(oktmo: string) {
    this.data.oktmo = oktmo;
    return this;
  }

  setOkpo(okpo: string) {
    this.data.okpo = okpo;
    return this;
  }

  setOkogu(okogu: string) {
    this.data.okogu = okogu;
    return this;
  }

  setOkfs(okfs: string) {
    this.data.okfs = okfs;
    return this;
  }

  setManagementName(name: string) {
    this.data.management = { name, post: '' };
    return this;
  }

  setManagementPost(post: string) {
    this.data.management.post = post;
    return this;
  }

  setAddress(address: string) {
    this.data.address = {
      value: address,
      unrestricted_value: address,
      data: {} as IAddressItem['data'],
    };

    return this;
  }

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

  build() {
    return this;
  }
}

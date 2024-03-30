import type {
  IMainOkved,
  IOrganization,
  IOrganizationName,
} from '../models/Organization';

export class OrganizationBuilder implements IOrganization {
  ogrn: string;
  ogrnDate: Date;
  name: IOrganizationName;
  opf?: string;
  inn?: string;
  kpp?: string;
  email?: string;
  mainOkved?: IMainOkved;

  constructor(
    ogrn: string,
    ogrnDate: string,
    opf?: string,
    inn?: string,
    kpp?: string,
  ) {
    this.ogrn = ogrn;
    this.ogrnDate = new Date(ogrnDate);
    this.name = {
      full: '',
    };
    if (opf) this.opf = opf;
    if (inn) this.inn = inn;
    if (kpp) this.kpp = kpp;
  }

  setShortName(name: string): OrganizationBuilder {
    this.name.short = name;
    return this;
  }

  setFullName(name: string): OrganizationBuilder {
    this.name.full = name;
    return this;
  }

  setEmail(email: string): OrganizationBuilder {
    this.email = email;
    return this;
  }

  setMainOkved(code: string, name: string): OrganizationBuilder {
    this.mainOkved = {
      code,
      name,
    };
    return this;
  }

  build(): IOrganization {
    return {
      inn: this.inn,
      ogrn: this.ogrn,
      ogrnDate: this.ogrnDate,
      name: this.name,
      opf: this.opf,
      kpp: this.kpp,
      email: this.email,
      mainOkved: this.mainOkved,
    };
  }
}

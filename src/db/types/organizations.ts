import type { IAddressItem } from './addresses';

export type UType = 'LEGAL' | 'INDIVIDUAL';
export type UStatus =
  | 'ACTIVE'
  | 'LIQUIDATING'
  | 'LIQUIDATED'
  | 'BANKRUPT'
  | 'REORGANIZING';
type UBranchType = 'MAIN' | 'BRANCH';
type UTaxSystem = 'AUSN' | 'ESHN' | 'SRP' | 'USN';
type USmallMediumBusiness = 'MICRO' | 'SMALL' | 'MEDIUM';

export interface IBaseOrganizationData {
  inn: string;
  kpp: string;
  ogrn: string;
  ogrn_date: number;
  /** Внутренний уникальный идентификатор в Дадате */
  hid: string;
  type: UType;
  name: {
    full_with_opf: string;
    short_with_opf?: string;
    latin?: unknown;
    full?: string;
    short?: string;
  };
  /** ФИО индивидуального предпринимателя */
  fio?: {
    surname: string;
    name: string;
    patronymic: string;
  };
  okato: string;
  oktmo: string;
  okpo: string;
  okogu: string;
  okfs: string;
  okved: string;
  /** Версия справочника ОКВЭД (2001 или 2014) */
  okved_type: string;
  opf: {
    /** Код по классификатору ОКОПФ */
    code: string;
    full: string;
    short: string;
    type: string;
  };
  management: {
    name: string;
    post: string;
  };
  branch_count: number;
  branch_type: UBranchType;
  address?: IAddressItem;
  state: {
    actuality_date?: number;
    registration_date?: number;
    liquidation_date?: unknown;
    status: UStatus;
  };
}

export interface IAuthority {
  /** Код гос. органа */
  type?: string;
  /** Код отделения */
  code: string;
  /** Наименование отделения */
  name: string;
  address?: string;
}

export interface IRegistrationDocument {
  type: string;
  series: string;
  number: string;
  /** Дата выдачи */
  issue_date: number;
  /** Код подразделения */
  issue_authority: string;
}

export interface IFullOrganizationData extends IBaseOrganizationData {
  employee_count: number;
  /** Гражданство ИП */
  citizenship: {
    code: {
      /** Числовой код страны по ОКСМ */
      numeric: number;
      /** Трехбуквенный код страны по ОКСМ */
      alpha_3: string;
    };
    name: {
      /** Наименование страны */
      full: string;
      /** Краткое наименование страны */
      short: string;
    };
  };
  finance: {
    tax_system: UTaxSystem;
    /** Год бух. отчётности */
    year: number;
    /** Доходы по бух. отчётности */
    income: number;
    /** Расходы по бух. отчётности */
    expense: number;
    /** Недоимки по налогам */
    debt: number;
    /** Налоговые штрафы */
    penalty: number;
  };
  /** Коды ОКВЭД дополнительных видов деятельности */
  okveds: Array<{
    /** Основной или нет */
    main: boolean;
    /** Версия справочника ОКВЭД (2001 или 2014) */
    type: string;
    /** Код по справочнику */
    code: string;
    /** Наименование по справочнику */
    name: string;
  }>;
  authorities: {
    /** Сведения о регистрирующем органе по месту нахождения */
    fts_registration: IAuthority;
    /** Сведения об учете в налоговом органе */
    fts_report: IAuthority;
    /** Отделение Пенсионного фонда */
    pf?: IAuthority;
    /** Отделение Фонда соц. страхования */
    sif?: IAuthority;
  };
  /** Учредители компании */
  founders: Array<{
    /** ОГРН учредителя (для юр.лиц) */
    ogrn?: string;
    /** ИНН учредителя */
    inn?: string;
    /** Наименование учредителя (для юр.лиц) */
    name?: string;
    /** ФИО учредителя (для физ.лиц) */
    fio?: string | { surname: string; name: string; patronymic: string };
    /** Внутренний идентификатор */
    hid?: string;
    /** Тип учредителя (LEGAL / PHYSICAL) */
    type?: 'LEGAL' | 'PHYSICAL';
    share?: {
      /** Тип значения (PERCENT / DECIMAL / FRACTION) */
      type: 'PERCENT' | 'DECIMAL' | 'FRACTION';
      /** Значение (для type = PERCENT и type = DECIMAL) */
      value: number;
      /** Числитель дроби (для type = FRACTION) */
      numerator: number;
      /** Знаменатель дроби (для type = FRACTION) */
      denominator: number;
    };
  }>;
  managers: Array<Record<string, unknown>>;
  /** Уставной капитал */
  capital: { type: string; value: number };
  documents: {
    /** Свидетельство о регистрации в налоговой */
    fts_registration: IRegistrationDocument;
    /** Сведения об учете в налоговом органе */
    fts_report: IRegistrationDocument;
    /** Свидетельство о регистрации в Пенсионном фонде */
    pf_registration: IRegistrationDocument;
    smb: {
      type: 'SMB';
      category: USmallMediumBusiness;
      issue_date: number;
    };
  };
  licenses: Array<Record<string, unknown>>;
  phones: Array<Record<string, unknown>>;
  emails: Array<{
    data?: {
      /** Email одной строкой как в ЕГРЮЛ */
      source: string;
      /** Локальная часть адреса (то, что до «собачки») */
      local: string;
      /** Домен (то, что после «собачки») */
      domain: string;
    };
    /** Email одной строкой */
    unrestricted_value: string;
    /** Email одной строкой */
    value: string;
  }>;

  /**
   * Полный перечень данных можно найти по ссылке:
   * @link https://dadata.ru/api/find-party/#response
   */
}

type TBaseData = IBaseOrganizationData;

export interface IOrganizationItem<T extends TBaseData = TBaseData> {
  value: string;
  unrestricted_value: string;
  data: T;
}

export type TFullOrganizationDataItem =
  IOrganizationItem<IFullOrganizationData>;

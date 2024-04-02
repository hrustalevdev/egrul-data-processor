import { model, Schema } from 'mongoose';

import type {
  IFullOrganizationData,
  TFullOrganizationDataItem,
  IRegistrationDocument,
  IAuthority,
} from '../types';

const Authority = new Schema<IAuthority>({
  type: String,
  code: String,
  name: String,
  address: String,
});

const RegistrationDocument = new Schema<IRegistrationDocument>({
  type: String,
  series: String,
  number: String,
  issue_date: String,
  issue_authority: String,
});

const Okved = new Schema({
  main: Boolean,
  type: String,
  code: String,
  name: String,
});

const Capital = new Schema({
  type: String,
  value: Number,
});

const FullOrganizationData = new Schema<IFullOrganizationData>({
  inn: String,
  kpp: String,
  ogrn: String,
  ogrn_date: Number,
  type: String,
  name: {
    short_with_opf: String,
    full_with_opf: String,
  },
  fio: {
    surname: String,
    name: String,
    patronymic: String,
  },
  opf: {
    full: String,
    short: String,
  },
  management: {
    name: String,
    post: String,
  },
  address: {
    unrestricted_value: String,
  },
  state: {
    status: String,
  },
  citizenship: {
    name: {
      full: String,
    },
  },
  okveds: [Okved],
  authorities: {
    fts_registration: Authority,
    fts_report: Authority,
    pf: Authority,
    sif: Authority,
  },
  founders: [
    {
      name: String,
      fio: [
        String,
        {
          surname: String,
          name: String,
          patronymic: String,
        },
      ],
      type: String,
      share: {
        type: String,
        value: Number,
        numerator: Number,
        denominator: Number,
      },
    },
  ],
  capital: Capital,
  documents: {
    fts_report: RegistrationDocument,
    pf_registration: RegistrationDocument,
  },
  emails: [
    {
      value: String,
      unrestricted_value: String,
      data: {
        source: String,
        local: String,
        domain: String,
      },
    },
  ],
});

const contractorSchema = new Schema<TFullOrganizationDataItem>({
  value: String,
  unrestricted_value: String,
  data: FullOrganizationData,
});

export const Contractor = model<TFullOrganizationDataItem>(
  'Contractor',
  contractorSchema,
);

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

const FullOrganizationData = new Schema<IFullOrganizationData>({
  type: ['LEGAL', 'INDIVIDUAL'],
  name: {
    short_with_opf: String,
    full_with_opf: String,
  },
  inn: String,
  ogrn: String,
  ogrn_date: Number,
  okpo: String,
  okogu: String,
  oktmo: String,
  okato: String,
  state: {
    status: ['ACTIVE', 'BANKRUPT', 'LIQUIDATED', 'LIQUIDATING', 'REORGANIZING'],
  },
  emails: [
    {
      value: String,
      unrestricted_value: String,
      data: {
        source: String,
      },
    },
  ],
  citizenship: {
    name: {
      full: String,
    },
  },
  address: {
    unrestricted_value: String,
  },
  management: {
    post: String,
    name: String,
  },
  founders: [
    {
      type: ['LEGAL', 'PHYSICAL'],
      name: String,
      fio: [
        String,
        {
          surname: String,
          name: String,
          patronymic: String,
        },
      ],
      share: {
        type: ['DECIMAL', 'PERCENT', 'FRACTION'],
        value: Number,
        numerator: Number,
        denominator: Number,
      },
    },
  ],
  documents: {
    fts_registration: RegistrationDocument,
    fts_report: RegistrationDocument,
    pf_registration: RegistrationDocument,
  },
  authorities: {
    fts_registration: Authority,
    pf: Authority,
    sif: Authority,
  },
  okfs: String,
  capital: {
    type: String,
    value: Number,
  },
  okveds: [Okved],
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

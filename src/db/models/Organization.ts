import { model, Schema } from 'mongoose';

export interface IOrganizationName {
  short?: string;
  full: string;
}

export interface IMainOkved {
  code: string;
  name: string;
}

export interface IOrganization {
  ogrn: string;
  ogrnDate: Date;
  name: IOrganizationName;
  opf?: string;
  inn?: string;
  kpp?: string;
  email?: string;
  mainOkved?: IMainOkved;
}

const organizationNameSchema = new Schema<IOrganizationName>({
  short: String,
  full: { type: String, required: true },
});

const mainOkvedSchema = new Schema<IMainOkved>({
  code: { type: String, required: true },
  name: { type: String, required: true },
});

const organizationSchema = new Schema<IOrganization>({
  ogrn: { type: String, required: true },
  ogrnDate: { type: Date, required: true },
  name: { type: organizationNameSchema, required: true },
  opf: String,
  inn: String,
  kpp: String,
  email: String,
  mainOkved: mainOkvedSchema,
});

export const Organization = model<IOrganization>(
  'Organization',
  organizationSchema,
);

import { model, Schema } from 'mongoose';

export enum EOrganizationType {
  LEGAL = 'legal',
  INDIVIDUAL = 'individual',
}

interface IOrganization {
  name: string;
  type: EOrganizationType;
  inn: string;
  kpp?: string;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [EOrganizationType.LEGAL, EOrganizationType.INDIVIDUAL],
  },
  inn: { type: String, required: true },
  kpp: { type: String },
});

export const Organization = model<IOrganization>(
  'Organization',
  organizationSchema,
);

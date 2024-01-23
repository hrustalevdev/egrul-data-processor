type URegistryType = 'egrul' | 'egrip';

export const registryType: URegistryType =
  (process.env.REGISTRY_TYPE as URegistryType) || 'egrul';

export const isTesting = process.env.NODE_ENV === 'testing';

export const isDropDatabase = process.env.DROP_DATABASE === 'true';

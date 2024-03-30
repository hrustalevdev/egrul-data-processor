type UBound =
  | 'country'
  | 'region'
  | 'area'
  | 'city'
  | 'settlement'
  | 'street'
  | 'house';

export interface IAddressSuggestionsParams {
  address: string;
  /** Количество результатов. По умолчанию — 10, максимум — 20 */
  count?: number;
  /**
   * Гранулярные подсказки по адресу. Если задать параметры `fromBound` и `toBound`, то в выдаче будут подсказки,
   * ограниченные данными параметрами.
   */
  fromBound?: UBound;
  toBound?: UBound;
}

export interface IAddressSuggestionsPayload {
  /** Адрес */
  query: string;
  /** Количество результатов. По умолчанию — 10, максимум — 20 */
  count?: number;
  /**
   * Гранулярные подсказки по адресу. Если задать параметры `from_bound` и `to_bound`, то в выдаче будут подсказки,
   * ограниченные данными параметрами. Таким образом можно ограничить выдачу регионом или городом.
   * @example
   *  {
   *     "query": "Пе",
   *     "from_bound": { "value": "region" },
   *     "to_bound": { "value": "region" }
   * }
   */
  from_bound?: { value: UBound };
  to_bound?: { value: UBound };
}

export interface IAddressItem {
  value: string;
  unrestricted_value: string;
  data: {
    postal_code: string;
    country: string;
    federal_district?: unknown;
    region_fias_id: string;
    region_kladr_id: string;
    region_with_type: string;
    region_type: string;
    region_type_full: string;
    region: string;
    area_fias_id: string;
    area_kladr_id: string;
    area_with_type: string;
    area_type: string;
    area_type_full: string;
    area: string;
    city_fias_id?: unknown;
    city_kladr_id?: unknown;
    city_with_type?: unknown;
    city_type?: unknown;
    city_type_full?: unknown;
    city?: unknown;
    city_area?: unknown;
    city_district_fias_id?: unknown;
    city_district_kladr_id?: unknown;
    city_district_with_type?: unknown;
    city_district_type?: unknown;
    city_district_type_full?: unknown;
    city_district?: unknown;
    settlement_fias_id: string;
    settlement_kladr_id: string;
    settlement_with_type: string;
    settlement_type: string;
    settlement_type_full: string;
    settlement: string;
    street_fias_id: string;
    street_kladr_id: string;
    street_with_type: string;
    street_type: string;
    street_type_full: string;
    street: string;
    house_fias_id: string;
    house_kladr_id: string;
    house_type: string;
    house_type_full: string;
    house: string;
    block_type?: unknown;
    block_type_full?: unknown;
    block?: unknown;
    flat_type?: unknown;
    flat_type_full?: unknown;
    flat?: unknown;
    flat_area?: unknown;
    square_meter_price?: unknown;
    flat_price?: unknown;
    postal_box?: unknown;
    fias_id: string;
    fias_code?: unknown;
    fias_level?: string;
    fias_actuality_state?: unknown;
    kladr_id: string;
    geoname_id?: unknown;
    capital_marker: string;
    okato: string;
    oktmo: string;
    tax_office: string;
    tax_office_legal: string;
    timezone?: unknown;
    geo_lat?: unknown;
    geo_lon?: unknown;
    beltway_hit?: unknown;
    beltway_distance?: unknown;
    metro?: unknown;
    qc_geo?: unknown;
    qc_complete?: unknown;
    qc_house?: unknown;
    history_values?: unknown;
    unparsed_parts?: unknown;
    source?: unknown;
    qc?: unknown;
  };
}

export interface IAddressSuggestions {
  suggestions: IAddressItem[];
}

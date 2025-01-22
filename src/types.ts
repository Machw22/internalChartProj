export interface AirtableFieldChoice {
  id: string;
  name: string;
  color: string;
}

export interface AirtableFieldOptions {
  choices?: AirtableFieldChoice[];
  linkedTableId?: string;
  isReversed?: boolean;
  prefersSingleRecordLink?: boolean;
  inverseLinkFieldId?: string;
  precision?: number;
  symbol?: string;
  isValid?: boolean;
  recordLinkFieldId?: string;
  fieldIdInLinkedTable?: string;
  result?: {
    type: string;
    options?: {
      isReversed: boolean;
      prefersSingleRecordLink: boolean;
    };
  };
}

export interface AirtableField {
  id: string;
  name: string;
  type: string;
  options: AirtableFieldOptions | null;
}

export interface AirtableTable {
  tableId: string;
  tableName: string;
  fields: AirtableField[];
}

export interface Node {
  id: string;
  type: 'table';
  position: { x: number; y: number };
  data: {
    label: string;
    fields: AirtableField[];
  };
}
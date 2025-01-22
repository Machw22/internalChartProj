import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database } from 'lucide-react';
import { AirtableField } from '../types';

interface TableNodeProps {
  data: {
    label: string;
    fields: AirtableField[];
  };
}

function getFieldTypeDisplay(field: AirtableField): string {
  if (field.type === 'multipleRecordLinks' && field.options?.linkedTableId) {
    return `→ ${field.options.linkedTableId}`;
  }
  if (field.type === 'multipleLookupValues' && field.options?.result?.type) {
    return `lookup (${field.options.result.type})`;
  }
  return field.type;
}

function getFieldColor(field: AirtableField): string {
  switch (field.type) {
    case 'multipleRecordLinks':
    case 'singleRecordLink':
      return 'text-blue-600';
    case 'multipleLookupValues':
      return 'text-purple-600';
    case 'singleSelect':
    case 'multipleSelects':
      return 'text-green-600';
    default:
      return 'text-gray-500';
  }
}

export default function TableNode({ data }: TableNodeProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200 min-w-[300px] max-w-[400px]">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <Database className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-lg text-gray-800">{data.label}</h3>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {data.fields.map((field) => (
          <div key={field.id} className="flex justify-between text-sm items-start">
            <span className="text-gray-700 font-medium">{field.name}</span>
            <span className={`${getFieldColor(field)} italic`}>
              {getFieldTypeDisplay(field)}
            </span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}
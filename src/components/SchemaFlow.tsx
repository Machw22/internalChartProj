import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './TableNode';
import { AirtableTable, AirtableField } from '../types';
import { Download, Filter, Link2, ArrowRight, Search } from 'lucide-react';

const nodeTypes = {
  table: TableNode,
};

// Define available field types for filtering
const FIELD_TYPES = [
  'all',
  'multipleRecordLinks',
  'singleRecordLink',
  'multipleLookupValues',
  'singleLineText',
  'multilineText',
  'number',
  'singleSelect',
  'multipleSelects',
  'date',
  'checkbox',
] as const;

type FieldType = typeof FIELD_TYPES[number];

interface SchemaFlowProps {
  data: AirtableTable[] | null;
}

export default function SchemaFlow({ data }: SchemaFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('all');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const createEdges = useCallback((tables: AirtableTable[]) => {
    return tables.flatMap(table => 
      table.fields
        .filter(field => {
          if (selectedFieldType === 'all') {
            return field.type === 'multipleRecordLinks' || field.type === 'singleRecordLink';
          }
          return field.type === selectedFieldType;
        })
        .map(field => ({
          id: `${table.tableId}-${field.options?.linkedTableId}-${field.id}`,
          source: table.tableId,
          target: field.options?.linkedTableId || '',
          animated: true,
          label: field.name,
          style: { stroke: '#2563eb' },
          data: { type: field.type },
        }))
    ).filter(edge => edge.target);
  }, [selectedFieldType]);

  React.useEffect(() => {
    if (data) {
      const newNodes = data.map((table, index) => ({
        id: table.tableId,
        type: 'table',
        position: { 
          x: 250 * (index % 3), 
          y: Math.floor(index / 3) * 400 
        },
        data: {
          label: table.tableName,
          fields: table.fields,
        },
      }));
      setNodes(newNodes);
      setEdges(createEdges(data));
    }
  }, [data, setNodes, setEdges, createEdges]);

  const onDownload = useCallback(() => {
    if (!data) return;
    
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = 'schema.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  }, [data]);

  const formatFieldType = (type: string) => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase());
  };

  const getConnectedTables = useCallback(() => {
    if (!selectedNode || !data) return [];
    
    const selectedTable = data.find(table => table.tableId === selectedNode.id);
    if (!selectedTable) return [];

    const connections = selectedTable.fields
      .filter(field => field.type === 'multipleRecordLinks' || field.type === 'singleRecordLink')
      .map(field => {
        const linkedTable = data.find(table => table.tableId === field.options?.linkedTableId);
        return {
          fieldName: field.name,
          fieldType: field.type,
          linkedTable: linkedTable?.tableName || 'Unknown Table',
          linkedTableId: field.options?.linkedTableId,
        };
      });

    // Also find reverse connections
    const reverseConnections = data.flatMap(table =>
      table.fields
        .filter(field => 
          (field.type === 'multipleRecordLinks' || field.type === 'singleRecordLink') &&
          field.options?.linkedTableId === selectedNode.id
        )
        .map(field => ({
          fieldName: field.name,
          fieldType: field.type,
          linkedTable: table.tableName,
          linkedTableId: table.tableId,
          isReverse: true,
        }))
    );

    return [...connections, ...reverseConnections];
  }, [selectedNode, data]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const centerNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && reactFlowInstance.current) {
      const x = node.position.x;
      const y = node.position.y;
      const zoom = 1.5;
      
      reactFlowInstance.current.setCenter(x, y, { zoom, duration: 800 });
      setSelectedNode(node);
    }
  }, [nodes]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!data || !term) return;

    const foundTable = data.find(table => 
      table.tableName.toLowerCase().includes(term.toLowerCase())
    );

    if (foundTable) {
      centerNode(foundTable.tableId);
    }
  }, [data, centerNode]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-grow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          minZoom={0.05}
          maxZoom={4}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          fitView
        >
          <Background />
          <Controls />
          <Panel position="top-left" className="flex gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search tables..."
                className="bg-transparent border-none text-sm w-48 focus:ring-0 focus:outline-none"
              />
            </div>
          </Panel>
          <Panel position="top-right" className="flex gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedFieldType}
                onChange={(e) => setSelectedFieldType(e.target.value as FieldType)}
                className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none"
              >
                {FIELD_TYPES.map(type => (
                  <option key={type} value={type}>
                    {formatFieldType(type)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Schema
            </button>
          </Panel>
        </ReactFlow>
      </div>
      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <Link2 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-lg">Connected Tables</h3>
          </div>
          <div className="space-y-2">
            {getConnectedTables().map((connection, index) => (
              <div
                key={`${connection.linkedTableId}-${connection.fieldName}-${index}`}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  {connection.isReverse ? (
                    <>
                      <span>{connection.linkedTable}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{selectedNode.data.label}</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedNode.data.label}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{connection.linkedTable}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  via field: <span className="font-medium">{connection.fieldName}</span>
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {formatFieldType(connection.fieldType)}
                  </span>
                </div>
              </div>
            ))}
            {getConnectedTables().length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No connected tables found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
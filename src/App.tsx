import React, { useState, useEffect } from 'react';
import { FileJson, Share2 } from 'lucide-react';
import SchemaFlow from './components/SchemaFlow';
import { AirtableTable } from './types';

export default function App() {
  const [schema, setSchema] = useState<AirtableTable[] | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if there's schema data in the URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(hash));
        setSchema(decodedData);
      } catch (err) {
        setError('Invalid schema data in URL');
      }
    }
  }, []);

  const handleJsonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const json = JSON.parse(jsonInput);
      if (!Array.isArray(json)) {
        throw new Error('Invalid schema format. Must be an array of tables.');
      }
      if (!json.every(table => table.tableId && table.tableName && Array.isArray(table.fields))) {
        throw new Error('Invalid table format. Each table must have tableId, tableName, and fields array.');
      }
      setSchema(json);
      setError('');

      // Create shareable URL
      const encodedData = encodeURIComponent(JSON.stringify(json));
      const url = `${window.location.origin}${window.location.pathname}#${encodedData}`;
      setShareUrl(url);
    } catch (err) {
      setError('Invalid JSON format or schema structure');
      setSchema(null);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!schema ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
            <div className="text-center mb-6">
              <FileJson className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Airtable Schema Visualizer
              </h1>
              <p className="text-gray-600 mb-4">
                Paste your Airtable base JSON to generate a schema diagram
              </p>
            </div>

            <form onSubmit={handleJsonSubmit}>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-96 p-4 text-sm font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors"
                placeholder='[
  {
    "tableId": "tbl123",
    "tableName": "Table Name",
    "fields": [
      {
        "id": "fld456",
        "name": "Field Name",
        "type": "text",
        "options": null
      }
    ]
  }
]'
              />
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium"
              >
                Visualize Schema
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="h-screen relative">
          {shareUrl && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-96 text-sm bg-transparent border-none focus:ring-0"
                />
                <button
                  onClick={copyShareUrl}
                  className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
          <SchemaFlow data={schema} />
        </div>
      )}
    </div>
  );
}
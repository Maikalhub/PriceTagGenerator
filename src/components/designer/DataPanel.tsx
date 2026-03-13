import { useState } from 'react';
import { useDesigner } from '@/contexts/DesignerContext';
import {
  Upload, Globe, ChevronDown, ChevronRight, GripVertical,
  Database, FileJson
} from 'lucide-react';

export function DataPanel() {
  const { state, dispatch } = useDesigner();
  const [jsonInput, setJsonInput] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiHeaders, setApiHeaders] = useState('');
  const [showApi, setShowApi] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalizeData = (parsed: unknown): Record<string, unknown>[] => {
    // Если пришёл объект вида { products: [...] } — используем products как массив записей
    if (
      parsed &&
      typeof parsed === 'object' &&
      'products' in (parsed as any) &&
      Array.isArray((parsed as any).products)
    ) {
      return (parsed as any).products as Record<string, unknown>[];
    }

    // Обычное поведение: массив или одиночный объект
    if (Array.isArray(parsed)) {
      return parsed as Record<string, unknown>[];
    }

    return [parsed as Record<string, unknown>];
  };

  const parseAndSetData = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const arr = normalizeData(parsed);
      dispatch({ type: 'SET_JSON_DATA', payload: arr });
    } catch {
      alert('Invalid JSON');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseAndSetData(reader.result as string);
    reader.readAsText(file);
  };

  const fetchFromApi = async () => {
    if (!apiUrl) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (apiHeaders.trim()) {
        apiHeaders.split('\n').forEach(line => {
          const [k, ...v] = line.split(':');
          if (k && v.length) headers[k.trim()] = v.join(':').trim();
        });
      }
      const res = await fetch(apiUrl, { headers });
      const data = await res.json();
      const arr = normalizeData(data);
      dispatch({ type: 'SET_JSON_DATA', payload: arr });
    } catch {
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, field: string) => {
    e.dataTransfer.setData('field', field);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-panel-bg border-r border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-panel-header px-3 py-2 border-b border-border flex items-center gap-2">
        <Database className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Data Source</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Fields */}
        <div className="panel-section">
          <div className="panel-label">Draggable Fields</div>
          <div className="flex flex-wrap gap-1.5">
            {state.fields.map(field => (
              <div
                key={field}
                draggable
                onDragStart={e => handleDragStart(e, field)}
                className="field-chip flex items-center gap-1"
              >
                <GripVertical className="w-3 h-3 opacity-50" />
                {field}
              </div>
            ))}
          </div>
          {state.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">No data loaded</p>
          )}
        </div>

        {/* Data info */}
        <div className="panel-section">
          <div className="panel-label">Records</div>
          <p className="text-xs text-muted-foreground">
            {state.jsonData.length} item{state.jsonData.length !== 1 ? 's' : ''} loaded
          </p>
        </div>

        {/* JSON Input */}
        <div className="panel-section">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1 text-xs font-medium text-secondary-foreground w-full"
          >
            {showJson ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <FileJson className="w-3 h-3" />
            Import JSON
          </button>
          {showJson && (
            <div className="mt-2 space-y-2">
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='[{"name":"Product","price":"9.99"}]'
                className="property-input h-24 text-xs font-mono resize-none"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => parseAndSetData(jsonInput)}
                  className="flex-1 text-xs bg-accent text-accent-foreground rounded py-1 hover:opacity-90"
                >
                  Parse
                </button>
                <label className="flex-1 text-xs bg-secondary text-secondary-foreground rounded py-1 text-center cursor-pointer hover:opacity-90">
                  <Upload className="w-3 h-3 inline mr-1" />
                  File
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* API */}
        <div className="panel-section">
          <button
            onClick={() => setShowApi(!showApi)}
            className="flex items-center gap-1 text-xs font-medium text-secondary-foreground w-full"
          >
            {showApi ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Globe className="w-3 h-3" />
            API Integration
          </button>
          {showApi && (
            <div className="mt-2 space-y-2">
              <input
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/products"
                className="property-input text-xs"
              />
              <textarea
                value={apiHeaders}
                onChange={e => setApiHeaders(e.target.value)}
                placeholder="Authorization: Bearer token"
                className="property-input h-12 text-xs font-mono resize-none"
              />
              <button
                onClick={fetchFromApi}
                disabled={loading}
                className="w-full text-xs bg-accent text-accent-foreground rounded py-1 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Fetching...' : 'Fetch Data'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

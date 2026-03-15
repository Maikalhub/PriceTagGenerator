import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface IRequestLog {
  id: number;
  method: string;
  url: string;
  status?: number;
  startedAt: string;
  finishedAt?: string;
}

// Простейший просмотрщик логов запросов внутри фронтенда.
// Чтобы он реально заполнялся, нужно оборачивать fetch/axios и пушить сюда записи.

const Logs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<IRequestLog[]>([]);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [url, setUrl] = useState<string>('http://localhost:8080/api/');
  const [body, setBody] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('ptg-request-logs');
    if (stored) {
      try {
        setLogs(JSON.parse(stored));
      } catch {
        setLogs([]);
      }
    }
  }, []);

  const examples = [
    {
      label: 'GET товары (пример)',
      method: 'GET' as const,
      url: 'http://localhost:8080/api/products',
      body: '',
    },
    {
      label: 'POST шаблон (пример)',
      method: 'POST' as const,
      url: 'http://localhost:8080/api/templates',
      body: '{"name":"My template","data":{}}',
    },
    {
      label: 'GET шаблоны (пример)',
      method: 'GET' as const,
      url: 'http://localhost:8080/api/templates',
      body: '',
    },
  ];

  const handleSendRequest = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResponseText('');
    setStatus('');
    const startedAt = new Date().toISOString();
    try {
      const init: RequestInit = { method };
      if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = body;
      }
      const res = await fetch(url, init);
      setStatus(`${res.status} ${res.statusText}`);
      const text = await res.text();
      // красиво форматируем JSON если возможно
      try {
        const json = JSON.parse(text);
        setResponseText(JSON.stringify(json, null, 2));
      } catch {
        setResponseText(text);
      }
      const finishedAt = new Date().toISOString();
      const entry: IRequestLog = {
        id: Date.now(),
        method,
        url,
        status: res.status,
        startedAt,
        finishedAt,
      };
      const nextLogs = [entry, ...logs];
      setLogs(nextLogs);
      sessionStorage.setItem('ptg-request-logs', JSON.stringify(nextLogs));
    } catch (e: any) {
      setStatus('Ошибка запроса');
      setResponseText(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel-header/80">
        <h1 className="text-sm font-semibold">Логи запросов</h1>
        <button
          onClick={() => navigate('/')}
          className="toolbar-btn text-xs px-3 py-1"
        >
          На главную
        </button>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Левая колонка: форма запроса + лог */}
        <div className="flex flex-col gap-3">
          <div className="panel-section rounded-md">
            <div className="panel-label">Отправка запроса</div>
            <p className="text-[11px] text-muted-foreground mb-2">
              Выберите метод, укажите URL вашего backend API и нажмите <span className="font-mono">Request</span>.
              Ниже можно вставить JSON‑тело для POST/PUT.
            </p>
            <div className="flex gap-2 mb-2">
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="property-input h-8 w-24 text-xs"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                className="property-input h-8 flex-1 text-xs font-mono"
                placeholder="http://localhost:8080/api/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="toolbar-btn text-xs px-3 py-1 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {loading ? 'Запрос...' : 'Request'}
              </button>
            </div>
            {(method === 'POST' || method === 'PUT') && (
              <textarea
                className="property-input w-full h-28 text-xs font-mono resize-none"
                placeholder='{"name":"Product","price":9.99}'
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            )}
            <div className="mt-3">
              <div className="text-[11px] text-muted-foreground mb-1">Примеры запросов</div>
              <div className="flex flex-wrap gap-2">
                {examples.map(ex => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setMethod(ex.method);
                      setUrl(ex.url);
                      setBody(ex.body);
                    }}
                    className="text-[11px] px-2 py-1 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel-section rounded-md flex-1 overflow-auto">
            <div className="panel-label">История запросов</div>
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Пока нет запросов. Отправьте первый запрос с помощью формы выше.
              </p>
            ) : (
              <table className="w-full text-[11px] border-collapse">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="border-b border-border text-left py-1 pr-2">Время</th>
                    <th className="border-b border-border text-left py-1 pr-2">Метод</th>
                    <th className="border-b border-border text-left py-1 pr-2">URL</th>
                    <th className="border-b border-border text-left py-1 pr-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="border-b border-border py-1 pr-2 whitespace-nowrap">
                        {log.startedAt}
                      </td>
                      <td className="border-b border-border py-1 pr-2">{log.method}</td>
                      <td className="border-b border-border py-1 pr-2 truncate max-w-[180px]">
                        {log.url}
                      </td>
                      <td className="border-b border-border py-1 pr-2">
                        {log.status ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Правая колонка: ответ сервера */}
        <div className="panel-section rounded-md flex flex-col">
          <div className="panel-label">Ответ API</div>
          <div className="text-xs text-muted-foreground mb-1">
            {status || 'Статус будет показан здесь после запроса.'}
          </div>
          <pre className="flex-1 mt-1 bg-secondary/40 rounded-md p-2 text-[11px] font-mono whitespace-pre-wrap overflow-auto">
            {responseText || '// Ответ пока пустой'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Logs;


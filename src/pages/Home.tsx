import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Верхняя полоса с примерами шаблонов */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-panel-header/80">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-lg font-semibold tracking-wide">PriceTAGenerator</h1>
            <p className="text-[11px] text-muted-foreground">
              Быстрый конструктор ценников под ваш магазин
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {['Классический', 'Акция', 'Премиум'].map(name => (
            <div
              key={name}
              className="w-28 h-16 rounded-md bg-card border border-border shadow-sm flex flex-col justify-between px-2 py-1 text-[10px]"
            >
              <div className="font-semibold truncate">{name}</div>
              <div className="flex justify-between items-end">
                <span className="text-[9px] text-muted-foreground">Product</span>
                <span className="text-base font-bold">9.99</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Центральный блок с кнопками */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3 w-full max-w-sm px-4">
          <button
            onClick={() => navigate('/designer')}
            className="w-full h-10 rounded-md bg-accent text-accent-foreground text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
          >
            Создать дизайн
          </button>
          <button
            onClick={() => navigate('/logs')}
            className="w-full h-10 rounded-md border border-border bg-transparent text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
          >
            Открыть log программы
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;


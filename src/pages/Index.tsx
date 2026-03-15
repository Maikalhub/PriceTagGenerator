import { DesignerProvider } from '@/contexts/DesignerContext';
import { DataPanel } from '@/components/designer/DataPanel';
import { PropertyPanel } from '@/components/designer/PropertyPanel';
import { Toolbar } from '@/components/designer/Toolbar';
import { DesignCanvas } from '@/components/designer/DesignCanvas';
import { Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <DesignerProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-panel-header border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-accent" />
            <h1 className="text-sm font-bold tracking-wide">PriceTAGenerator</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="toolbar-btn text-xs px-3 py-1"
          >
            На главную
          </button>
        </div>

        {/* Toolbar */}
        <Toolbar />

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          <DataPanel />
          <DesignCanvas />
          <PropertyPanel />
        </div>

      </div>
    </DesignerProvider>
  );
};

export default Index;

import { DesignerProvider } from '@/contexts/DesignerContext';
import { DataPanel } from '@/components/designer/DataPanel';
import { PropertyPanel } from '@/components/designer/PropertyPanel';
import { Toolbar } from '@/components/designer/Toolbar';
import { DesignCanvas } from '@/components/designer/DesignCanvas';
import { PrintLayoutPreview } from '@/components/designer/PrintLayoutPreview';
import { Tag } from 'lucide-react';

const Index = () => {
  return (
    <DesignerProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-panel-header border-b border-border px-4 py-2 flex items-center gap-3">
          <Tag className="w-5 h-5 text-accent" />
          <h1 className="text-sm font-bold tracking-wide">Price Tag Designer</h1>
          <span className="text-xs text-muted-foreground ml-2">FastReport-style editor</span>
        </div>

        {/* Toolbar */}
        <Toolbar />

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          <DataPanel />
          <DesignCanvas />
          <PropertyPanel />
        </div>

        {/* Print layout preview (how tags fall on sheet) - bottom of page */}
        <PrintLayoutPreview />
      </div>
    </DesignerProvider>
  );
};

export default Index;

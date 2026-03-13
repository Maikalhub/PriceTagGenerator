import { useDesigner } from '@/contexts/DesignerContext';
import { CanvasElement } from '@/types/designer';
import {
  Type, Square, Minus, Image, Grid3X3, Eye, EyeOff,
  ChevronLeft, ChevronRight, FileDown, Printer, Save
} from 'lucide-react';
import { v4ID } from '@/lib/idgen';

export function Toolbar() {
  const { state, dispatch } = useDesigner();

  const addElement = (type: CanvasElement['type']) => {
    const base: CanvasElement = {
      id: v4ID(),
      type,
      x: 20,
      y: 20,
      width: type === 'line' ? 120 : 100,
      height: type === 'line' ? 2 : type === 'text' || type === 'field' ? 24 : 60,
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: 'Inter',
      textAlign: 'left',
      alignH: 'left',
      alignV: 'center',
      color: '#e2e8f0',
      content: type === 'text' ? 'Text' : undefined,
      backgroundColor: type === 'rectangle' ? 'transparent' : undefined,
      borderColor: type === 'rectangle' || type === 'line' ? '#475569' : undefined,
      borderWidth: type === 'rectangle' || type === 'line' ? 1 : 0,
      borderRadius: 0,
      layer: 0,
    };
    dispatch({ type: 'ADD_ELEMENT', payload: base });
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const canvas = document.getElementById('tag-canvas');
    if (!canvas) return;

    const c = await html2canvas(canvas, { backgroundColor: null, scale: 2 });
    const imgData = c.toDataURL('image/png');
    const { template, printSettings } = state;

    const createDoc = (w: number, h: number) =>
      new jsPDF({
        orientation: w > h ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [w, h],
      });

    if (printSettings.layoutMode === 'single') {
      const pdf = createDoc(template.width, template.height);
      const margin = printSettings.margin || 0;
      const w = template.width - margin * 2;
      const h = template.height - margin * 2;
      pdf.addImage(imgData, 'PNG', margin, margin, Math.max(w, 1), Math.max(h, 1));
      pdf.save('price-tag.pdf');
      return;
    }

    // Grid layout on selected paper size
    const { paperWidth, paperHeight, margin, spacing, columns, rows } = printSettings;
    const pdf = createDoc(paperWidth, paperHeight);

    const cellW = template.width;
    const cellH = template.height;

    let y = margin;
    for (let r = 0; r < rows; r++) {
      let x = margin;
      for (let cIdx = 0; cIdx < columns; cIdx++) {
        if (
          x + cellW > paperWidth - margin ||
          y + cellH > paperHeight - margin
        ) {
          continue;
        }
        pdf.addImage(imgData, 'PNG', x, y, cellW, cellH);
        x += cellW + spacing;
      }
      y += cellH + spacing;
    }

    pdf.save('price-tag-grid.pdf');
  };

  const handlePrintAll = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const canvas = document.getElementById('tag-canvas');
    if (!canvas) return;

    const { template, printSettings, jsonData } = state;

    const createDoc = (w: number, h: number) =>
      new jsPDF({
        orientation: w > h ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [w, h],
      });

    // Simple mode: один ценник на страницу, как раньше
    if (printSettings.layoutMode === 'single') {
      const pdf = createDoc(template.width, template.height);
      const margin = printSettings.margin || 0;
      const w = template.width - margin * 2;
      const h = template.height - margin * 2;

      for (let i = 0; i < jsonData.length; i++) {
        dispatch({ type: 'SET_PREVIEW_INDEX', payload: i });
        await new Promise(r => setTimeout(r, 100));
        const c = await html2canvas(canvas, { backgroundColor: null, scale: 2 });
        const imgData = c.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin, Math.max(w, 1), Math.max(h, 1));
      }
      pdf.save('price-tags-all.pdf');
      return;
    }

    // Grid mode: несколько ценников на листе в виде таблицы
    const { paperWidth, paperHeight, margin, spacing, columns, rows } = printSettings;
    const pdf = createDoc(paperWidth, paperHeight);

    const cellW = template.width;
    const cellH = template.height;

    let index = 0;

    while (index < jsonData.length) {
      let y = margin;
      for (let r = 0; r < rows && index < jsonData.length; r++) {
        let x = margin;
        for (let cIdx = 0; cIdx < columns && index < jsonData.length; cIdx++) {
          if (
            x + cellW > paperWidth - margin ||
            y + cellH > paperHeight - margin
          ) {
            continue;
          }

          dispatch({ type: 'SET_PREVIEW_INDEX', payload: index });
          await new Promise(r => setTimeout(r, 100));
          const c = await html2canvas(canvas, { backgroundColor: null, scale: 2 });
          const imgData = c.toDataURL('image/png');

          pdf.addImage(imgData, 'PNG', x, y, cellW, cellH);

          index += 1;
          x += cellW + spacing;
        }
        y += cellH + spacing;
      }

      if (index < jsonData.length) {
        pdf.addPage();
      }
    }

    pdf.save('price-tags-grid.pdf');
  };

  const handleSaveTemplate = () => {
    const name = window.prompt('Название шаблона', state.template.name || 'New template');
    if (!name) return;
    const existingRaw = localStorage.getItem('tag-templates');
    const list: any[] = existingRaw ? JSON.parse(existingRaw) : [];
    const tmpl = { ...state.template, name };
    const idx = list.findIndex(t => t.id === tmpl.id || t.name === name);
    if (idx >= 0) {
      list[idx] = tmpl;
    } else {
      list.push(tmpl);
    }
    localStorage.setItem('tag-templates', JSON.stringify(list));
    localStorage.setItem('tag-template-last', JSON.stringify(tmpl));
  };

  const handleLoadTemplate = () => {
    const existingRaw = localStorage.getItem('tag-templates');
    if (!existingRaw) {
      const last = localStorage.getItem('tag-template-last');
      if (last) {
        dispatch({ type: 'LOAD_TEMPLATE', payload: JSON.parse(last) });
      } else {
        alert('Сохранённых шаблонов пока нет.');
      }
      return;
    }
    const list: any[] = JSON.parse(existingRaw);
    if (!list.length) {
      alert('Сохранённых шаблонов пока нет.');
      return;
    }
    const names = list.map((t, i) => `${i + 1}. ${t.name || t.id}`).join('\n');
    const input = window.prompt(`Выберите номер шаблона:\n${names}`, '1');
    if (!input) return;
    const index = Number(input) - 1;
    if (Number.isNaN(index) || index < 0 || index >= list.length) return;
    const tmpl = list[index];
    localStorage.setItem('tag-template-last', JSON.stringify(tmpl));
    dispatch({ type: 'LOAD_TEMPLATE', payload: tmpl });
  };

  return (
    <div className="bg-panel-header border-b border-border px-3 py-1.5 flex items-center justify-between">
      {/* Left: tools */}
      <div className="flex items-center gap-1">
        <button onClick={() => addElement('text')} className="toolbar-btn" title="Add Text">
          <Type className="w-4 h-4" />
        </button>
        <button onClick={() => addElement('rectangle')} className="toolbar-btn" title="Add Rectangle">
          <Square className="w-4 h-4" />
        </button>
        <button onClick={() => addElement('line')} className="toolbar-btn" title="Add Line">
          <Minus className="w-4 h-4" />
        </button>
        <button onClick={() => addElement('image')} className="toolbar-btn" title="Add Image">
          <Image className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-2" />

        <button
          onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
          className={`toolbar-btn ${state.snapToGrid ? 'toolbar-btn-active' : ''}`}
          title="Snap to Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW_MODE' })}
          className={`toolbar-btn ${state.isPreviewMode ? 'toolbar-btn-active' : ''}`}
          title="Preview Mode"
        >
          {state.isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Center: preview nav */}
      {state.isPreviewMode && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={() => dispatch({ type: 'SET_PREVIEW_INDEX', payload: Math.max(0, state.previewIndex - 1) })}
            disabled={state.previewIndex <= 0}
            className="toolbar-btn p-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono">
            {state.previewIndex + 1} / {state.jsonData.length}
          </span>
          <button
            onClick={() => dispatch({ type: 'SET_PREVIEW_INDEX', payload: Math.min(state.jsonData.length - 1, state.previewIndex + 1) })}
            disabled={state.previewIndex >= state.jsonData.length - 1}
            className="toolbar-btn p-1 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right: export */}
      <div className="flex items-center gap-1">
        <button onClick={handleSaveTemplate} className="toolbar-btn" title="Save Template">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={handleLoadTemplate} className="toolbar-btn text-xs px-2" title="Load Template">
          Load
        </button>

        <div className="w-px h-5 bg-border mx-2" />

        <button onClick={handleExportPDF} className="toolbar-btn" title="Export PDF">
          <FileDown className="w-4 h-4" />
        </button>
        <button onClick={handlePrintAll} className="toolbar-btn" title="Print All">
          <Printer className="w-4 h-4" />
        </button>

        {/* Tag size */}
        <div className="w-px h-5 bg-border mx-2" />
        {/* Tag size (мм самого ценника) */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <input
            type="number"
            value={state.template.width}
            onChange={e =>
              dispatch({
                type: 'SET_TEMPLATE_SIZE',
                payload: { width: +e.target.value, height: state.template.height },
              })
            }
            className="property-input w-12 text-center"
          />
          <span>×</span>
          <input
            type="number"
            value={state.template.height}
            onChange={e =>
              dispatch({
                type: 'SET_TEMPLATE_SIZE',
                payload: { width: state.template.width, height: +e.target.value },
              })
            }
            className="property-input w-12 text-center"
          />
          <span>mm</span>
        </div>

        {/* Tag background color */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
          <span>фон</span>
          <input
            type="color"
            value={state.template.backgroundColor || '#ffffff'}
            onChange={e => dispatch({ type: 'SET_TEMPLATE_BACKGROUND', payload: e.target.value })}
            className="property-input h-7 w-8 p-0.5 cursor-pointer"
          />
        </div>

        {/* Paper / layout settings */}
        <div className="w-px h-5 bg-border mx-2" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <select
            value={state.printSettings.layoutMode}
            onChange={e => dispatch({ type: 'SET_PRINT_SETTINGS', payload: { layoutMode: e.target.value as any } })}
            className="property-input h-7 text-xs"
          >
            <option value="single">1 на лист</option>
            <option value="grid">Таблица</option>
          </select>
          <select
            value={`${state.printSettings.paperWidth}x${state.printSettings.paperHeight}`}
            onChange={e => {
              const [w, h] = e.target.value.split('x').map(Number);
              dispatch({ type: 'SET_PRINT_SETTINGS', payload: { paperWidth: w, paperHeight: h } });
            }}
            className="property-input h-7 text-xs"
          >
            <option value="210x297">A4</option>
            <option value="148x210">A5</option>
            <option value="100x150">100×150</option>
          </select>
          <input
            type="number"
            value={state.printSettings.margin}
            onChange={e => dispatch({ type: 'SET_PRINT_SETTINGS', payload: { margin: +e.target.value } })}
            className="property-input w-12 text-center"
          />
          <span>мм отступ</span>
          {state.printSettings.layoutMode === 'grid' && (
            <>
              <input
                type="number"
                value={state.printSettings.columns}
                onChange={e => dispatch({ type: 'SET_PRINT_SETTINGS', payload: { columns: +e.target.value } })}
                className="property-input w-10 text-center"
              />
              <span>×</span>
              <input
                type="number"
                value={state.printSettings.rows}
                onChange={e => dispatch({ type: 'SET_PRINT_SETTINGS', payload: { rows: +e.target.value } })}
                className="property-input w-10 text-center"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

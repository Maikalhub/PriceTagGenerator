import { useDesigner } from '@/contexts/DesignerContext';
import { CanvasElement } from '@/types/designer';
import {
  Type, Square, Minus, Image, Grid3X3, Eye, EyeOff,
  ChevronLeft, ChevronRight, FileDown, Printer, Save
} from 'lucide-react';
import { v4ID } from '@/lib/idgen';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function Toolbar() {
  const { state, dispatch } = useDesigner();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [paperDialogOpen, setPaperDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'jpeg' | 'svg'>('pdf');

  const [paperWidthDraft, setPaperWidthDraft] = useState(state.printSettings.paperWidth);
  const [paperHeightDraft, setPaperHeightDraft] = useState(state.printSettings.paperHeight);
  const [marginDraft, setMarginDraft] = useState(state.printSettings.margin);
  const [spacingDraft, setSpacingDraft] = useState(state.printSettings.spacing);
  const [columnsDraft, setColumnsDraft] = useState(state.printSettings.columns);
  const [rowsDraft, setRowsDraft] = useState(state.printSettings.rows);

  useEffect(() => {
    const existingRaw = localStorage.getItem('tag-templates');
    if (existingRaw) {
      try {
        const list = JSON.parse(existingRaw);
        if (Array.isArray(list)) {
          setTemplates(list);
        }
      } catch {
        // ignore broken storage
      }
    }
  }, []);

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
      color: '#000000',
      content: type === 'text' ? 'Text' : undefined,
      backgroundColor: type === 'rectangle' ? 'transparent' : undefined,
      borderColor: type === 'rectangle' || type === 'line' ? '#475569' : undefined,
      borderWidth: type === 'rectangle' || type === 'line' ? 1 : 0,
      borderRadius: 0,
      layer: 0,
    };
    dispatch({ type: 'ADD_ELEMENT', payload: base });
  };

  const handleExport = async () => {
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

    if (exportFormat === 'pdf') {
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
      return;
    }

    // PNG / JPEG / SVG экспорт: один текущий ценник в файл
    if (exportFormat === 'svg') {
      const pngData = c.toDataURL('image/png');
      const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}">
  <image href="${pngData}" width="${c.width}" height="${c.height}" />
</svg>`;
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'price-tag.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const link = document.createElement('a');
      link.download = `price-tag.${exportFormat}`;
      link.href = c.toDataURL(`image/${exportFormat === 'jpeg' ? 'jpeg' : 'png'}`);
      link.click();
    }
  };

  const handleSaveTemplate = () => {
    const name = window.prompt('Название шаблона', state.template.name || 'Новый шаблон');
    if (!name) return;
    const existingRaw = localStorage.getItem('tag-templates');
    const list: any[] = existingRaw ? JSON.parse(existingRaw) : [];

    // Если есть шаблон с таким именем — перезаписываем его, иначе создаём новый
    const idxByName = list.findIndex(t => t.name === name);
    let tmpl: any = { ...state.template, name };

    if (idxByName >= 0) {
      const existingId = list[idxByName].id;
      tmpl = { ...tmpl, id: existingId };
      list[idxByName] = tmpl;
    } else {
      tmpl = { ...tmpl, id: v4ID() };
      list.push(tmpl);
    }

    localStorage.setItem('tag-templates', JSON.stringify(list));
    localStorage.setItem('tag-template-last', JSON.stringify(tmpl));
    setTemplates(list);
    setSelectedTemplateId(tmpl.id);
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find(t => t.id === id);
    if (!tmpl) return;
    localStorage.setItem('tag-template-last', JSON.stringify(tmpl));
    dispatch({ type: 'LOAD_TEMPLATE', payload: tmpl });
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

    // Simple mode: один ценник на листе.
    // Делаем так же, как в PrintLayoutPreview: ценник по центру листа заданного размера,
    // чтобы превью и итоговый PDF совпадали по расположению.
    if (printSettings.layoutMode === 'single') {
      const { paperWidth, paperHeight } = printSettings;
      const cellW = template.width;
      const cellH = template.height;
      const pdf = createDoc(paperWidth, paperHeight);

      // Центровка на листе, как в PrintLayoutPreview
      const xPos = (paperWidth - cellW) / 2;
      const yPos = (paperHeight - cellH) / 2;

      for (let i = 0; i < jsonData.length; i++) {
        dispatch({ type: 'SET_PREVIEW_INDEX', payload: i });
        await new Promise(r => setTimeout(r, 100));
        const c = await html2canvas(canvas, { backgroundColor: null, scale: 2 });
        const imgData = c.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', xPos, yPos, cellW, cellH);
      }

      const blobUrl = pdf.output('bloburl');
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        alert('Браузер заблокировал открытие PDF. Разрешите всплывающие окна для этого сайта.');
      }
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

    const blobUrl = pdf.output('bloburl');
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      alert('Браузер заблокировал открытие PDF. Разрешите всплывающие окна для этого сайта.');
    }
  };

  const standardSizes = [
    { label: 'A4', value: '210x297' },
    { label: 'A5', value: '148x210' },
    { label: '100×150', value: '100x150' },
    // Специальный вариант: печатать на листе ровно размера текущего ценника
    { label: 'Как ценник', value: 'tag-size' },
  ];

  const currentSizeValue = `${state.printSettings.paperWidth}x${state.printSettings.paperHeight}`;
  const hasCurrentInList = standardSizes.some(s => s.value === currentSizeValue);

  const handleOpenPaperDialog = () => {
    setPaperWidthDraft(state.printSettings.paperWidth);
    setPaperHeightDraft(state.printSettings.paperHeight);
    setMarginDraft(state.printSettings.margin);
    setSpacingDraft(state.printSettings.spacing);
    setColumnsDraft(state.printSettings.columns);
    setRowsDraft(state.printSettings.rows);
    setPaperDialogOpen(true);
  };

  const handleApplyPaperSettings = () => {
    dispatch({
      type: 'SET_PRINT_SETTINGS',
      payload: {
        paperWidth: paperWidthDraft,
        paperHeight: paperHeightDraft,
        margin: marginDraft,
        spacing: spacingDraft,
        columns: columnsDraft,
        rows: rowsDraft,
      },
    });
    setPaperDialogOpen(false);
  };

  return (
    <div className="bg-panel-header border-b border-border px-3 py-1.5 flex items-center justify-between">
      {/* Left: tools */}
      <div className="flex items-center gap-1">
        <button onClick={() => addElement('text')} className="toolbar-btn" title="Add Text">
          <Type className="w-4 h-4" />
        </button>
        <button onClick={() => addElement('rectangle')} className="toolbar-btn" title="Add Shape">
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
        {/* Шаблоны ценников */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
          <button onClick={handleSaveTemplate} className="toolbar-btn" title="Сохранить текущий шаблон">
            <Save className="w-4 h-4" />
          </button>
          <select
            value={selectedTemplateId}
            onChange={e => handleSelectTemplate(e.target.value)}
            className="property-input h-7 text-xs min-w-[140px]"
          >
            <option value="">Шаблоны...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name || t.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <select
            value={exportFormat}
            onChange={e =>
              setExportFormat(e.target.value as 'pdf' | 'png' | 'jpeg' | 'svg')
            }
            className="property-input h-7 text-xs w-20"
            title="Формат экспорта"
          >
            <option value="pdf">PDF</option>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="svg">SVG</option>
          </select>
          <button onClick={handleExport} className="toolbar-btn" title="Экспортировать макет">
            <FileDown className="w-4 h-4" />
          </button>
        </div>
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
            value={hasCurrentInList ? currentSizeValue : 'custom'}
            onChange={e => {
              const val = e.target.value;
              if (val === 'custom') {
                handleOpenPaperDialog();
                return;
              }
              if (val === 'tag-size') {
                // Лист будет ровно размера ценника, чтобы превью и печать совпадали 1:1
                dispatch({
                  type: 'SET_PRINT_SETTINGS',
                  payload: {
                    paperWidth: state.template.width,
                    paperHeight: state.template.height,
                  },
                });
                return;
              }
              const [w, h] = val.split('x').map(Number);
              dispatch({ type: 'SET_PRINT_SETTINGS', payload: { paperWidth: w, paperHeight: h } });
            }}
            className="property-input h-7 text-xs"
          >
            {standardSizes.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
            <option value="custom">Свой размер…</option>
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

      <Dialog open={paperDialogOpen} onOpenChange={setPaperDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Настройки листа для печати</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span>Ширина, мм</span>
                <input
                  type="number"
                  className="property-input h-7 text-center"
                  value={paperWidthDraft}
                  onChange={e => setPaperWidthDraft(+e.target.value || 0)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Высота, мм</span>
                <input
                  type="number"
                  className="property-input h-7 text-center"
                  value={paperHeightDraft}
                  onChange={e => setPaperHeightDraft(+e.target.value || 0)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span>Отступ, мм</span>
                <input
                  type="number"
                  className="property-input h-7 text-center"
                  value={marginDraft}
                  onChange={e => setMarginDraft(+e.target.value || 0)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Расстояние между</span>
                <input
                  type="number"
                  className="property-input h-7 text-center"
                  value={spacingDraft}
                  onChange={e => setSpacingDraft(+e.target.value || 0)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span>Столбцов</span>
                <input
                  type="number"
                  className="property-input h-7 text-center"
                  value={columnsDraft}
                  onChange={e => setColumnsDraft(+e.target.value || 0)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Строк</span>
                <input
                  type="number"
                  className="property-input h-7 text-center"
                  value={rowsDraft}
                  onChange={e => setRowsDraft(+e.target.value || 0)}
                />
              </label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setPaperDialogOpen(false)}
              className="toolbar-btn text-xs px-3 py-1"
            >
              Отмена
            </button>
            <button
              onClick={handleApplyPaperSettings}
              className="toolbar-btn text-xs px-3 py-1 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Применить
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

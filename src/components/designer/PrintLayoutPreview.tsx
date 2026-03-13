import { useDesigner } from '@/contexts/DesignerContext';

export function PrintLayoutPreview() {
  const { state } = useDesigner();
  const { template, printSettings } = state;

  const paperW = printSettings.paperWidth;
  const paperH = printSettings.paperHeight;
  const maxW = 220;
  const maxH = 140;
  const scale = Math.min(maxW / paperW, maxH / paperH);

  const viewW = paperW * scale;
  const viewH = paperH * scale;

  const cellW = template.width;
  const cellH = template.height;
  const { margin, spacing, columns, rows, layoutMode } = printSettings;

  const cells: { x: number; y: number; key: string }[] = [];

  if (layoutMode === 'single') {
    const x = (paperW - cellW) / 2;
    const y = (paperH - cellH) / 2;
    cells.push({ x, y, key: 'single' });
  } else {
    let y = margin;
    for (let r = 0; r < rows; r++) {
      let x = margin;
      for (let c = 0; c < columns; c++) {
        if (x + cellW > paperW - margin || y + cellH > paperH - margin) {
          continue;
        }
        cells.push({ x, y, key: `${r}-${c}` });
        x += cellW + spacing;
      }
      y += cellH + spacing;
    }
  }

  return (
    <div className="bg-panel-bg border-b border-border px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-secondary-foreground">Макет на листе</span>
        <span>
          Лист {paperW}×{paperH} мм, ценник {template.width}×{template.height} мм
        </span>
      </div>
      <div
        className="relative border border-border bg-card/60"
        style={{ width: viewW, height: viewH }}
      >
        {cells.map(cell => (
          <div
            key={cell.key}
            style={{
              position: 'absolute',
              left: (cell.x / paperW) * viewW,
              top: (cell.y / paperH) * viewH,
              width: (cellW / paperW) * viewW,
              height: (cellH / paperH) * viewH,
              border: '1px solid rgba(59,130,246,0.7)',
              backgroundColor: 'rgba(59,130,246,0.08)',
              boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
    </div>
  );
}


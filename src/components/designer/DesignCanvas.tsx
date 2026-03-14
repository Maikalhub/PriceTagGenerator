import { useDesigner } from '@/contexts/DesignerContext';
import { CanvasElement } from '@/types/designer';
import { Rnd } from 'react-rnd';
import { v4ID } from '@/lib/idgen';
import { useEffect, useRef } from 'react';

// Scale: 1mm = 3px for display
const MM_TO_PX = 3;

export function DesignCanvas() {
  const { state, dispatch, snapValue, getFieldValue } = useDesigner();
  const { template, selectedElementId, isPreviewMode } = state;
  const clipboardRef = useRef<CanvasElement | null>(null);

  const canvasW = template.width * MM_TO_PX;
  const canvasH = template.height * MM_TO_PX;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'tag-canvas' || (e.target as HTMLElement).id === 'canvas-wrapper') {
      dispatch({ type: 'SELECT_ELEMENT', payload: null });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('field');
    if (!field) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = snapValue(e.clientX - rect.left);
    const y = snapValue(e.clientY - rect.top);

    const el: CanvasElement = {
      id: v4ID(),
      type: 'field',
      x,
      y,
      width: 100,
      height: 24,
      fieldKey: field,
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: 'Inter',
      textAlign: 'left',
      color: '#000000',
    };
    dispatch({ type: 'ADD_ELEMENT', payload: el });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;

      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (state.isPreviewMode) return;

      const currentId = state.selectedElementId;

      // Copy selected element
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (!currentId) return;
        const el = state.template.elements.find(el => el.id === currentId);
        if (!el) return;
        e.preventDefault();
        clipboardRef.current = { ...el };
        return;
      }

      // Paste element from clipboard
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const src = clipboardRef.current;
        if (!src) return;
        e.preventDefault();

        const offset = 10;
        const newEl: CanvasElement = {
          ...src,
          id: v4ID(),
          x: snapValue(src.x + offset),
          y: snapValue(src.y + offset),
        };

        dispatch({ type: 'ADD_ELEMENT', payload: newEl });
        return;
      }

      if (!currentId) return;

      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        dispatch({ type: 'DELETE_ELEMENT', payload: currentId });
        return;
      }

      // Nudge with arrows (Shift = 10px)
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        e.preventDefault();
        const el = state.template.elements.find(el => el.id === currentId);
        if (!el) return;

        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        const newX = snapValue(el.x + dx);
        const newY = snapValue(el.y + dy);

        dispatch({
          type: 'UPDATE_ELEMENT',
          payload: {
            id: currentId,
            updates: { x: newX, y: newY },
          },
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPreviewMode, state.selectedElementId, state.template.elements, dispatch, snapValue]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const renderContent = (el: CanvasElement, preview: boolean) => {
    const hAlign = el.alignH || el.textAlign || 'left';
    const vAlign = el.alignV || 'center';

    const textStyle: React.CSSProperties = {
      fontSize: el.fontSize,
      fontWeight: el.fontWeight as React.CSSProperties['fontWeight'],
      fontFamily: el.fontFamily,
      textAlign: el.textAlign,
      color: el.color,
      lineHeight: '1.2',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center',
      justifyContent:
        hAlign === 'center' ? 'center' : hAlign === 'right' ? 'flex-end' : 'flex-start',
      padding: '2px 4px',
      boxSizing: 'border-box',
    };

    const rawFieldValue = (fallback?: string) =>
      preview ? getFieldValue(el.fieldKey || '') : fallback || `{${el.fieldKey}}`;

    const formatNumberForElement = (val: string, el: CanvasElement) => {
      const num = Number(val.replace(',', '.'));
      if (Number.isNaN(num)) return val;
      const decimals = el.numberDecimals ?? 2;

      let intPartRaw: string;
      let fracRaw: string;

      if (el.numberRound ?? true) {
        // С округлением
        [intPartRaw, fracRaw = ''] = num.toFixed(decimals).split('.');
      } else {
        // Без округления (усечение)
        const [rawInt, rawFrac = ''] = val.replace(',', '.').split('.');
        intPartRaw = rawInt;
        fracRaw = rawFrac.slice(0, decimals).padEnd(decimals, '0');
      }

      switch (el.numberFormatMode) {
        case 'integer':
          return intPartRaw;
        case 'fraction':
          return fracRaw;
        default:
          return decimals > 0 ? `${intPartRaw},${fracRaw}` : intPartRaw;
      }
    };

    const fieldValue = (fallback?: string) => {
      const v = rawFieldValue(fallback);
      const allowedForNumberFormat = ['price', 'pricePerKg', 'oldPrice'];
      if (
        el.type === 'field' &&
        el.numberFormatMode &&
        preview &&
        allowedForNumberFormat.includes(el.fieldKey || '')
      ) {
        return formatNumberForElement(String(v), el);
      }
      return v;
    };

    switch (el.type) {
      case 'text':
        return <div style={textStyle}>{el.content || 'Text'}</div>;
      case 'field':
        if (el.isBarcode) {
          const value = fieldValue('0000000000000');
          // Генерация последовательности "полоса/пробел" разной толщины
          const digits = String(value).replace(/\D/g, '') || '0000000000000';
          const segments: { key: string; width: number; isBar: boolean }[] = [];
          digits.split('').forEach((d, idx) => {
            const n = parseInt(d, 10);
            const barWidth = 1 + (n % 3); // тонкая/средняя/толстая полоса
            const spaceWidth = 1 + ((9 - n) % 2); // разная ширина пробелов
            segments.push(
              { key: `${idx}-bar`, width: barWidth, isBar: true },
              { key: `${idx}-space`, width: spaceWidth, isBar: false },
            );
          });
          const totalUnits = segments.reduce((sum, s) => sum + s.width, 0);

          const alignH = el.barcodeAlignH || 'center';
          const alignV = el.barcodeAlignV || 'bottom';

          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems:
                  alignH === 'left' ? 'flex-start' : alignH === 'right' ? 'flex-end' : 'center',
                justifyContent:
                  alignV === 'top' ? 'flex-start' : alignV === 'center' ? 'center' : 'flex-end',
                padding: '4px 6px',
                boxSizing: 'border-box',
                backgroundColor: el.barcodeBackground || '#ffffff',
              }}
            >
              <div
                style={{
                  width: '90%',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                }}
              >
                {segments.map(s => (
                  <div
                    key={s.key}
                    style={{
                      flexGrow: s.width,
                      flexBasis: `${(s.width / totalUnits) * 100}%`,
                      backgroundColor: s.isBar ? (el.barcodeColor || '#000000') : 'transparent',
                    }}
                  />
                ))}
              </div>
              {(el.barcodeShowText ?? true) && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: (el.fontSize || 14) * 0.9,
                    fontFamily: el.fontFamily || 'Inter',
                    letterSpacing: 1,
                    color: el.barcodeColor || '#000000',
                  }}
                >
                  {value}
                </div>
              )}
            </div>
          );
        }
        return <div style={textStyle}>{fieldValue()}</div>;
      case 'rectangle':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: el.backgroundColor || 'transparent',
              border: `${el.borderWidth || 1}px solid ${el.borderColor || '#475569'}`,
              borderRadius: el.borderRadius || 0,
            }}
          />
        );
      case 'line':
        return (
          <div
            style={{
              width: '100%',
              height: 0,
              borderTop: `${el.borderWidth || 1}px solid ${el.borderColor || '#475569'}`,
              position: 'absolute',
              top: '50%',
            }}
          />
        );
      case 'image':
        return el.imageUrl ? (
          <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border">
            IMG
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="canvas-wrapper"
      className="relative flex-1 bg-canvas-bg overflow-auto flex items-center justify-center p-8"
      onClick={handleCanvasClick}
    >
      <div
        id="tag-canvas"
        className={`relative ${state.snapToGrid ? 'canvas-grid' : ''}`}
        style={{
          width: canvasW,
          height: canvasH,
          minWidth: canvasW,
          minHeight: canvasH,
          backgroundColor: template.backgroundColor || '#ffffff',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {template.elements
          .slice()
          .sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0))
          .map(el => (
            <Rnd
              key={el.id}
              position={{ x: el.x, y: el.y }}
              size={{ width: el.width, height: el.height }}
              onDragStop={(_e, d) => {
                dispatch({
                  type: 'UPDATE_ELEMENT',
                  payload: {
                    id: el.id,
                    updates: { x: snapValue(d.x), y: snapValue(d.y) },
                  },
                });
              }}
              onResizeStop={(_e, _dir, ref, _delta, pos) => {
                dispatch({
                  type: 'UPDATE_ELEMENT',
                  payload: {
                    id: el.id,
                    updates: {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      x: snapValue(pos.x),
                      y: snapValue(pos.y),
                    },
                  },
                });
              }}
              bounds="parent"
              className={`${selectedElementId === el.id ? 'element-selected' : ''} cursor-move`}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                dispatch({ type: 'SELECT_ELEMENT', payload: el.id });
              }}
              enableResizing={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
              }}
              resizeHandleStyles={{
                topRight: { cursor: 'ne-resize' },
                bottomRight: { cursor: 'se-resize' },
                bottomLeft: { cursor: 'sw-resize' },
                topLeft: { cursor: 'nw-resize' },
              }}
            >
              {renderContent(el, isPreviewMode)}
            </Rnd>
          ))}
      </div>
      {/* Mini print preview in the top-right corner of design area */}
      <div
        className="pointer-events-none absolute right-4 top-4 bg-black/40 rounded-md p-1"
        style={{ zIndex: 50 }}
      >
        <div
          style={{
            width: canvasW * 0.35,
            height: canvasH * 0.35,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: canvasW,
              height: canvasH,
              transform: 'scale(0.35)',
              transformOrigin: 'top left',
              backgroundColor: template.backgroundColor || '#ffffff',
              position: 'relative',
            }}
          >
            {template.elements
              .slice()
              .sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0))
              .map(el => (
                <div
                  key={`preview-${el.id}`}
                  style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                  }}
                >
                  {renderContent(el, true)}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

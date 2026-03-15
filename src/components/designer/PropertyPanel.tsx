import { useDesigner } from '@/contexts/DesignerContext';
import { CanvasElement } from '@/types/designer';
import {
  Settings, Trash2, AlignLeft, AlignCenter, AlignRight,
  Bold, Type
} from 'lucide-react';

export function PropertyPanel() {
  const { state, dispatch } = useDesigner();

  const selectedElement = state.template.elements.find(
    el => el.id === state.selectedElementId
  );

  const update = (updates: Partial<CanvasElement>) => {
    if (!selectedElement) return;
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates } });
  };

  const handleDelete = () => {
    if (!selectedElement) return;
    dispatch({ type: 'DELETE_ELEMENT', payload: selectedElement.id });
  };

  if (!selectedElement) {
    return (
      <div className="w-56 bg-panel-bg border-l border-border flex flex-col h-full">
        <div className="bg-panel-header px-3 py-2 border-b border-border flex items-center gap-2">
          <Settings className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold">Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Select an element on the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const isTextLike = selectedElement.type === 'text' || selectedElement.type === 'field';
  const isBarcodeField =
    selectedElement.type === 'field' &&
    (selectedElement.fieldKey === 'barcode' || selectedElement.isBarcode);
  const isOldPriceField =
    selectedElement.type === 'field' && selectedElement.fieldKey === 'oldPrice';
  const isNumberFormatField =
    selectedElement.type === 'field' &&
    (selectedElement.fieldKey === 'price' ||
      selectedElement.fieldKey === 'pricePerKg' ||
      selectedElement.fieldKey === 'oldPrice');

  return (
    <div className="w-56 bg-panel-bg border-l border-border flex flex-col h-full overflow-hidden">
      <div className="bg-panel-header px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold capitalize">{selectedElement.type}</span>
        </div>
        <button onClick={handleDelete} className="toolbar-btn text-destructive p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Position */}
        <div className="panel-section">
          <div className="panel-label">Position & Size</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              X
              <input type="number" value={Math.round(selectedElement.x)} onChange={e => update({ x: +e.target.value })} className="property-input mt-0.5" />
            </label>
            <label className="text-xs text-muted-foreground">
              Y
              <input type="number" value={Math.round(selectedElement.y)} onChange={e => update({ y: +e.target.value })} className="property-input mt-0.5" />
            </label>
            <label className="text-xs text-muted-foreground">
              W
              <input type="number" value={Math.round(selectedElement.width)} onChange={e => update({ width: +e.target.value })} className="property-input mt-0.5" />
            </label>
            <label className="text-xs text-muted-foreground">
              H
              <input type="number" value={Math.round(selectedElement.height)} onChange={e => update({ height: +e.target.value })} className="property-input mt-0.5" />
            </label>
          </div>
        </div>

        {/* Layer */}
        <div className="panel-section">
          <div className="panel-label">Layer</div>
          <label className="text-xs text-muted-foreground block">
            Z-index
            <input
              type="number"
              value={selectedElement.layer ?? 0}
              onChange={e => update({ layer: +e.target.value })}
              className="property-input mt-0.5"
            />
          </label>
        </div>

        {/* Common alignment for any component */}
        <div className="panel-section">
          <div className="panel-label">Alignment</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              Horizontal
              <select
                value={selectedElement.alignH || 'left'}
                onChange={e => update({ alignH: e.target.value as CanvasElement['alignH'] })}
                className="property-input mt-0.5"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Vertical
              <select
                value={selectedElement.alignV || 'center'}
                onChange={e => update({ alignV: e.target.value as CanvasElement['alignV'] })}
                className="property-input mt-0.5"
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
          </div>
        </div>

        {/* Text properties */}
        {isTextLike && (
          <>
            <div className="panel-section">
              <div className="panel-label">
                <Type className="w-3 h-3 inline mr-1" />
                Typography
              </div>
              {selectedElement.type === 'text' && (
                <label className="text-xs text-muted-foreground block mb-2">
                  Content
                  <input
                    value={selectedElement.content || ''}
                    onChange={e => update({ content: e.target.value })}
                    className="property-input mt-0.5"
                  />
                </label>
              )}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="text-xs text-muted-foreground">
                  Size
                  <input
                    type="number"
                    value={selectedElement.fontSize || 14}
                    onChange={e => update({ fontSize: +e.target.value })}
                    className="property-input mt-0.5"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Color
                  <input
                    type="color"
                    value={selectedElement.color || '#e2e8f0'}
                    onChange={e => update({ color: e.target.value })}
                    className="property-input mt-0.5 h-7 p-0.5 cursor-pointer"
                  />
                </label>
              </div>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => update({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`toolbar-btn p-1 ${selectedElement.fontWeight === 'bold' ? 'toolbar-btn-active' : ''}`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => update({ textAlign: 'left' })}
                  className={`toolbar-btn p-1 ${selectedElement.textAlign === 'left' ? 'toolbar-btn-active' : ''}`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => update({ textAlign: 'center' })}
                  className={`toolbar-btn p-1 ${(selectedElement.textAlign || 'left') === 'center' ? 'toolbar-btn-active' : ''}`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => update({ textAlign: 'right' })}
                  className={`toolbar-btn p-1 ${selectedElement.textAlign === 'right' ? 'toolbar-btn-active' : ''}`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <label className="text-xs text-muted-foreground">
                Font
                <select
                  value={selectedElement.fontFamily || 'Inter'}
                  onChange={e => update({ fontFamily: e.target.value })}
                  className="property-input mt-0.5"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </label>
            </div>

            {/* Number formatting only for price / pricePerKg / oldPrice */}
            {isNumberFormatField && (
              <div className="panel-section">
                <div className="panel-label">Number format</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="text-xs text-muted-foreground">
                    Mode
                    <select
                      value={selectedElement.numberFormatMode || 'default'}
                      onChange={e =>
                        update({
                          numberFormatMode: e.target.value as CanvasElement['numberFormatMode'],
                        })
                      }
                      className="property-input mt-0.5"
                    >
                      <option value="default">Полное число</option>
                      <option value="integer">Только до запятой</option>
                      <option value="fraction">Только после запятой</option>
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Знаков после
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={selectedElement.numberDecimals ?? 2}
                      onChange={e => update({ numberDecimals: +e.target.value })}
                      className="property-input mt-0.5"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Округлять</span>
                  <input
                    type="checkbox"
                    checked={selectedElement.numberRound ?? true}
                    onChange={e => update({ numberRound: e.target.checked })}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Old price strike-through settings */}
            {isOldPriceField && (
              <div className="panel-section">
                <div className="panel-label">Old price style</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="text-xs text-muted-foreground">
                    Strike
                    <select
                      value={selectedElement.strikeThroughMode || 'none'}
                      onChange={e =>
                        update({
                          strikeThroughMode: e.target.value as CanvasElement['strikeThroughMode'],
                        })
                      }
                      className="property-input mt-0.5"
                    >
                      <option value="none">Нет</option>
                      <option value="horizontal">Горизонтальная</option>
                      <option value="diagonalLeft">Диагональ ↙↗</option>
                      <option value="diagonalRight">Диагональ ↗↙</option>
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Толщина
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedElement.strikeThroughWidth ?? 2}
                      onChange={e => update({ strikeThroughWidth: +e.target.value })}
                      className="property-input mt-0.5"
                    />
                  </label>
                </div>
                <label className="text-xs text-muted-foreground block">
                  Цвет линии
                  <input
                    type="color"
                    value={selectedElement.strikeThroughColor || selectedElement.color || '#000000'}
                    onChange={e => update({ strikeThroughColor: e.target.value })}
                    className="property-input mt-0.5 h-7 p-0.5 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Barcode settings for поле barcode */}
            {isBarcodeField && (
              <div className="panel-section mt-2">
                <div className="panel-label">Barcode</div>
                <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                  <span>Отображать как штрихкод</span>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.isBarcode}
                    onChange={e => update({ isBarcode: e.target.checked })}
                    className="cursor-pointer"
                  />
                </div>
                {selectedElement.isBarcode && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground block">
                      Тип штрихкода
                      <select
                        value={selectedElement.barcodeType || 'EAN13'}
                        onChange={e => update({ barcodeType: e.target.value as CanvasElement['barcodeType'] })}
                        className="property-input mt-0.5"
                      >
                        <option value="EAN13">EAN-13</option>
                        <option value="EAN8">EAN-8</option>
                        <option value="CODE128">Code 128</option>
                      </select>
                    </label>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Показывать цифры</span>
                      <input
                        type="checkbox"
                        checked={selectedElement.barcodeShowText ?? true}
                        onChange={e => update({ barcodeShowText: e.target.checked })}
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-muted-foreground">
                        Цвет полос
                        <input
                          type="color"
                          value={selectedElement.barcodeColor || '#000000'}
                          onChange={e => update({ barcodeColor: e.target.value })}
                          className="property-input mt-0.5 h-7 p-0.5 cursor-pointer"
                        />
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Цвет фона
                        <input
                          type="color"
                          value={selectedElement.barcodeBackground || '#ffffff'}
                          onChange={e => update({ barcodeBackground: e.target.value })}
                          className="property-input mt-0.5 h-7 p-0.5 cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-muted-foreground">
                        Гориз. выравн.
                        <select
                          value={selectedElement.barcodeAlignH || 'center'}
                          onChange={e => update({ barcodeAlignH: e.target.value as CanvasElement['barcodeAlignH'] })}
                          className="property-input mt-0.5"
                        >
                          <option value="left">Слева</option>
                          <option value="center">По центру</option>
                          <option value="right">Справа</option>
                        </select>
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Вертик. выравн.
                        <select
                          value={selectedElement.barcodeAlignV || 'bottom'}
                          onChange={e => update({ barcodeAlignV: e.target.value as CanvasElement['barcodeAlignV'] })}
                          className="property-input mt-0.5"
                        >
                          <option value="top">Сверху</option>
                          <option value="center">По центру</option>
                          <option value="bottom">Снизу</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Shape properties */}
        {(selectedElement.type === 'rectangle' || selectedElement.type === 'line') && (
          <div className="panel-section">
            <div className="panel-label">Appearance</div>
            {selectedElement.type === 'rectangle' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="text-xs text-muted-foreground">
                  Shape
                  <select
                    value={selectedElement.shapeKind || 'rect'}
                    onChange={e =>
                      update({ shapeKind: e.target.value as CanvasElement['shapeKind'] })
                    }
                    className="property-input mt-0.5"
                  >
                    <option value="rect">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">
                  Radius
                  <input
                    type="number"
                    value={selectedElement.borderRadius ?? 0}
                    onChange={e => update({ borderRadius: +e.target.value })}
                    className="property-input mt-0.5"
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Fill
                <input
                  type="color"
                  value={selectedElement.backgroundColor || '#1e293b'}
                  onChange={e => update({ backgroundColor: e.target.value })}
                  className="property-input mt-0.5 h-7 p-0.5 cursor-pointer"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Border
                <input
                  type="color"
                  value={selectedElement.borderColor || '#334155'}
                  onChange={e => update({ borderColor: e.target.value })}
                  className="property-input mt-0.5 h-7 p-0.5 cursor-pointer"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Stroke
                <input
                  type="number"
                  value={selectedElement.borderWidth ?? 1}
                  onChange={e => update({ borderWidth: +e.target.value })}
                  className="property-input mt-0.5"
                />
              </label>
            </div>
          </div>
        )}

        {/* Image properties */}
        {selectedElement.type === 'image' && (
          <div className="panel-section">
            <div className="panel-label">Image</div>
            <label className="text-xs text-muted-foreground block mb-2">
              URL
              <input
                value={selectedElement.imageUrl || ''}
                onChange={e => update({ imageUrl: e.target.value })}
                placeholder="https://..."
                className="property-input mt-0.5"
              />
            </label>
            <label className="text-xs text-muted-foreground block">
              Upload
              <input
                type="file"
                accept="image/*"
                className="mt-1 text-xs"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    update({ imageUrl: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

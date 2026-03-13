export interface CanvasElement {
  id: string;
  type: 'text' | 'field' | 'rectangle' | 'line' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  // Text / field props
  content?: string;
  fieldKey?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  // Shape props
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Image props
  imageUrl?: string;
  // Line props
  lineDirection?: 'horizontal' | 'vertical';
  // Barcode props (для поля barcode)
  isBarcode?: boolean;
  barcodeType?: 'EAN13' | 'CODE128' | 'EAN8';
  barcodeShowText?: boolean;
  barcodeColor?: string;
  barcodeBackground?: string;
  barcodeAlignH?: 'left' | 'center' | 'right';
  barcodeAlignV?: 'top' | 'center' | 'bottom';
  // Number formatting for price/amount fields
  numberFormatMode?: 'default' | 'integer' | 'fraction';
  numberDecimals?: number;
  numberRound?: boolean;
  // Layer / z-index
  layer?: number;
}

export interface TagTemplate {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  elements: CanvasElement[];
  backgroundColor?: string;
}

export type PrintLayoutMode = 'single' | 'grid';

export interface PrintSettings {
  // Paper size in mm
  paperWidth: number;
  paperHeight: number;
  // Uniform margin in mm from all sides
  margin: number;
  // Distance between tags in grid mode, mm
  spacing: number;
  // How many tags per row/column in grid mode
  columns: number;
  rows: number;
  // How to place tags on the sheet
  layoutMode: PrintLayoutMode;
}

export interface AppState {
  jsonData: Record<string, unknown>[];
  fields: string[];
  template: TagTemplate;
  selectedElementId: string | null;
  previewIndex: number;
  snapToGrid: boolean;
  gridSize: number;
  isPreviewMode: boolean;
  printSettings: PrintSettings;
}

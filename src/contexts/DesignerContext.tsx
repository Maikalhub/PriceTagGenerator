import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AppState, CanvasElement, TagTemplate, PrintSettings } from '@/types/designer';

// Пример данных в формате, близком к вашему JSON
const SAMPLE_DATA = [
  {
    id: 1,
    barcode: "4600051005478",
    vendorCode: "NSF-200-RB-001",
    supplier: "ЗАО Доброном Минск",
    name: "Кофе Нескафе Голд 200 г",
    manufacturerCountry: "Россия",
    price: 15.99,
    pricePerKg: 79.95,
    currency: "Br",
    isOnSale: true,
    discountPercentage: 20,
    oldPrice: 19.99,
    inStock: true,
    quantity: 47,
    category: "Бакалея",
    subcategory: "Чай, кофе",
    description: "Растворимый кофе, мягкий вкус, 200 г",
    priceSetDate: "2026-03-13T09:15:00",
    priceTagPrintDate: "2026-03-13T10:30:00",
    // Для простоты вложенные объекты/массивы здесь опущены,
    // но реальный JSON, который вы подаете в редактор, может содержать их полностью.
  },
];

const defaultTemplate: TagTemplate = {
  id: 'default',
  name: 'Price Tag 58×40mm',
  width: 58,
  height: 40,
  elements: [],
  backgroundColor: '#ffffff',
};

const defaultPrintSettings: PrintSettings = {
  paperWidth: 210,   // A4 width
  paperHeight: 297,  // A4 height
  margin: 5,
  spacing: 2,
  columns: 3,
  rows: 8,
  layoutMode: 'single',
};

const initialState: AppState = {
  jsonData: SAMPLE_DATA,
  fields: Object.keys(SAMPLE_DATA[0]),
  template: defaultTemplate,
  selectedElementId: null,
  previewIndex: 0,
  snapToGrid: true,
  gridSize: 10,
  isPreviewMode: false,
  printSettings: defaultPrintSettings,
};

type Action =
  | { type: 'SET_JSON_DATA'; payload: Record<string, unknown>[] }
  | { type: 'ADD_ELEMENT'; payload: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<CanvasElement> } }
  | { type: 'DELETE_ELEMENT'; payload: string }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'SET_PREVIEW_INDEX'; payload: number }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'TOGGLE_PREVIEW_MODE' }
  | { type: 'SET_TEMPLATE_SIZE'; payload: { width: number; height: number } }
  | { type: 'SET_TEMPLATE_BACKGROUND'; payload: string }
  | { type: 'LOAD_TEMPLATE'; payload: TagTemplate }
  | { type: 'SET_PRINT_SETTINGS'; payload: Partial<PrintSettings> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_JSON_DATA': {
      const data = action.payload;
      const fields = data.length > 0 ? Object.keys(data[0]) : [];
      return { ...state, jsonData: data, fields, previewIndex: 0 };
    }
    case 'ADD_ELEMENT':
      return {
        ...state,
        template: {
          ...state.template,
          elements: [...state.template.elements, action.payload],
        },
        selectedElementId: action.payload.id,
      };
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        template: {
          ...state.template,
          elements: state.template.elements.map(el =>
            el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
          ),
        },
      };
    case 'DELETE_ELEMENT':
      return {
        ...state,
        template: {
          ...state.template,
          elements: state.template.elements.filter(el => el.id !== action.payload),
        },
        selectedElementId: state.selectedElementId === action.payload ? null : state.selectedElementId,
      };
    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.payload };
    case 'SET_PREVIEW_INDEX':
      return { ...state, previewIndex: action.payload };
    case 'TOGGLE_SNAP':
      return { ...state, snapToGrid: !state.snapToGrid };
    case 'TOGGLE_PREVIEW_MODE':
      return { ...state, isPreviewMode: !state.isPreviewMode, selectedElementId: null };
    case 'SET_TEMPLATE_SIZE':
      return {
        ...state,
        template: { ...state.template, ...action.payload },
      };
    case 'SET_TEMPLATE_BACKGROUND':
      return {
        ...state,
        template: { ...state.template, backgroundColor: action.payload },
      };
    case 'LOAD_TEMPLATE':
      return { ...state, template: action.payload, selectedElementId: null };
    case 'SET_PRINT_SETTINGS':
      return {
        ...state,
        printSettings: {
          ...state.printSettings,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

interface DesignerContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  snapValue: (v: number) => number;
  getFieldValue: (key: string) => string;
}

const DesignerContext = createContext<DesignerContextType | null>(null);

export function DesignerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const snapValue = useCallback(
    (v: number) => {
      if (!state.snapToGrid) return v;
      return Math.round(v / state.gridSize) * state.gridSize;
    },
    [state.snapToGrid, state.gridSize]
  );

  const getFieldValue = useCallback(
    (key: string) => {
      const item = state.jsonData[state.previewIndex];
      if (!item) return `{${key}}`;
      const val = item[key];
      return val !== undefined ? String(val) : `{${key}}`;
    },
    [state.jsonData, state.previewIndex]
  );

  return (
    <DesignerContext.Provider value={{ state, dispatch, snapValue, getFieldValue }}>
      {children}
    </DesignerContext.Provider>
  );
}

export function useDesigner() {
  const ctx = useContext(DesignerContext);
  if (!ctx) throw new Error('useDesigner must be used within DesignerProvider');
  return ctx;
}

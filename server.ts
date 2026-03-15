import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// Простейшее временное хранилище шаблонов в памяти
const templates: any[] = [
  {
    id: 'default',
    name: 'Price tag 58×40',
    width: 58,
    height: 40,
    backgroundColor: '#ffffff',
    elements: [],
  },
  {
    id: 'sale',
    name: 'Sale 80×50',
    width: 80,
    height: 50,
    backgroundColor: '#ff0000',
    elements: [],
  },
];

app.get('/api/templates', (_req, res) => {
  res.json(templates);
});

app.post('/api/templates', (req, res) => {
  const tpl = req.body;
  if (!tpl || !tpl.id) {
    return res.status(400).json({ error: 'template.id is required' });
  }
  const idx = templates.findIndex(t => t.id === tpl.id);
  if (idx >= 0) {
    templates[idx] = tpl;
  } else {
    templates.push(tpl);
  }
  res.json(tpl);
});

// Пример рендера PDF по данным, которые отправляет фронт через кнопку API
app.post('/api/render', (req, res) => {
  const { template, data, layout, exportFormat } = req.body || {};

  if (!template || !data) {
    return res.status(400).json({ error: 'template and data are required' });
  }

  // Пока реализуем только PDF, остальные форматы можно добавить позже
  const fmt = (exportFormat || 'pdf').toLowerCase();
  if (fmt !== 'pdf') {
    return res.status(400).json({ error: 'Only PDF export is implemented on server for now' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=\"price-tags.pdf\"');

  const doc = new PDFDocument({
    size: [
      (layout?.paperWidth || template.width) * 2.835, // mm -> pt примерно
      (layout?.paperHeight || template.height) * 2.835,
    ],
    margin: (layout?.margin || 5) * 2.835,
  });

  doc.pipe(res);

  const items: any[] = Array.isArray(data) ? data : [data];

  doc.fontSize(14).text('PriceTAGenerator server render', { align: 'left' });
  doc.moveDown();

  items.forEach((item, index) => {
    doc.fontSize(12).text(`#${index + 1}: ${item.name || item.title || 'Item'}`);
    if (item.price !== undefined) {
      doc.text(`Price: ${item.price}`);
    }
    if (item.pricePerKg !== undefined) {
      doc.text(`Price/kg: ${item.pricePerKg}`);
    }
    if (item.barcode) {
      doc.text(`Barcode: ${item.barcode}`);
    }
    doc.moveDown();
  });

  doc.end();
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});


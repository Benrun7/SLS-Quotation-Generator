// ========== STL PARSER ==========
// Standalone STL parser (no Three.js needed)

function parseSTL(buffer) {
  function isBinary(data) {
    const reader = new DataView(data);
    const faceCount = reader.getUint32(80, true);
    const expectedSize = 80 + 4 + faceCount * 50;
    if (expectedSize === data.byteLength) return true;
    const header = new Uint8Array(data, 0, 5);
    const str = String.fromCharCode.apply(null, header);
    return str !== 'solid';
  }

  function parseBinary(data) {
    const reader = new DataView(data);
    const faces = reader.getUint32(80, true);
    const vertices = [];
    let offset = 84;

    for (let face = 0; face < faces; face++) {
      offset += 12; // skip normal
      for (let v = 0; v < 3; v++) {
        vertices.push(
          reader.getFloat32(offset, true),
          reader.getFloat32(offset + 4, true),
          reader.getFloat32(offset + 8, true)
        );
        offset += 12;
      }
      offset += 2; // attribute byte count
    }
    return vertices;
  }

  function parseASCII(data) {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(new Uint8Array(data));
    const vertexRegex = /vertex\s+([\-+]?\d*\.?\d+(?:[eE][\-+]?\d+)?)\s+([\-+]?\d*\.?\d+(?:[eE][\-+]?\d+)?)\s+([\-+]?\d*\.?\d+(?:[eE][\-+]?\d+)?)/g;
    const vertices = [];
    let match;

    while ((match = vertexRegex.exec(text)) !== null) {
      vertices.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    }
    return vertices;
  }

  return isBinary(buffer) ? parseBinary(buffer) : parseASCII(buffer);
}

function calculateVolume(vertices) {
  let volume = 0;
  
  // Process triangles (every 9 values = 3 vertices × 3 coords)
  for (let i = 0; i < vertices.length; i += 9) {
    const ax = vertices[i], ay = vertices[i + 1], az = vertices[i + 2];
    const bx = vertices[i + 3], by = vertices[i + 4], bz = vertices[i + 5];
    const cx = vertices[i + 6], cy = vertices[i + 7], cz = vertices[i + 8];

    // Cross product
    const crossx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    const crossy = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    const crossz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

    // Signed volume contribution
    volume += (ax * crossx + ay * crossy + az * crossz) / 6;
  }

  return Math.abs(volume); // mm³
}

// ========== STATE ==========
let models = [];
let modelIdCounter = 0;
let sortState = { column: null, direction: 'asc' };

// ========== DOM REFS ==========
const tariffInput = document.getElementById('tariff');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const modelsBody = document.getElementById('modelsBody');
const modelsFoot = document.getElementById('modelsFoot');
const emptyState = document.getElementById('emptyState');
const grandTotalEl = document.getElementById('grandTotal');
const exportSection = document.getElementById('exportSection');
const exportPreview = document.getElementById('exportPreview');
const copyBtn = document.getElementById('copyBtn');

// Checkboxes
const colCheckboxes = {
  num: document.getElementById('colNum'),
  name: document.getElementById('colName'),
  volume: document.getElementById('colVolume'),
  price: document.getElementById('colPrice'),
  qty: document.getElementById('colQty'),
  total: document.getElementById('colTotal')
};

// Volume unit selector
const volumeUnitSelect = document.getElementById('volumeUnit');

// ========== EVENT LISTENERS ==========

// Prevent browser navigation on drop
['dragover', 'drop'].forEach(evt => {
  window.addEventListener(evt, e => e.preventDefault());
});

// File input
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  if (e.target.files.length) {
    handleFiles(e.target.files);
    fileInput.value = ''; // Reset for same file selection
  }
});

// Drag and drop
['dragenter', 'dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('dragover');
}));

['dragleave', 'drop'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('dragover');
}));

dropzone.addEventListener('drop', e => {
  const files = [...e.dataTransfer.files].filter(f => f.name.toLowerCase().endsWith('.stl'));
  if (files.length) handleFiles(files);
});

// Tariff change
tariffInput.addEventListener('input', () => {
  recalculateAll();
  updateExportPreview();
});

// Clear all
clearAllBtn.addEventListener('click', () => {
  models = [];
  modelIdCounter = 0;
  renderTable();
  updateExportPreview();
});

// Export checkboxes
Object.values(colCheckboxes).forEach(cb => {
  cb.addEventListener('change', updateExportPreview);
});

// Volume unit change
volumeUnitSelect.addEventListener('change', updateExportPreview);

// Sorting
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const column = th.dataset.sort;
    
    if (sortState.column === column) {
      sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortState.column = column;
      sortState.direction = 'asc';
    }
    
    sortModels();
    renderTable();
    updateSortIndicators();
    updateExportPreview();
  });
});

function sortModels() {
  if (!sortState.column) return;
  
  models.sort((a, b) => {
    let valA, valB;
    
    switch (sortState.column) {
      case 'num':
        valA = a.id;
        valB = b.id;
        break;
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'volume':
        valA = a.volumeCm3;
        valB = b.volumeCm3;
        break;
      case 'price':
        valA = a.pricePerUnit;
        valB = b.pricePerUnit;
        break;
      case 'qty':
        valA = a.quantity;
        valB = b.quantity;
        break;
      case 'total':
        valA = a.totalPrice;
        valB = b.totalPrice;
        break;
      default:
        return 0;
    }
    
    if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function updateSortIndicators() {
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortState.column) {
      th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

// Copy button
copyBtn.addEventListener('click', () => {
  const text = generateExportText();
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Скопировано!
    `;
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Скопировать
      `;
    }, 2000);
  });
});

// ========== FILE HANDLING ==========

function handleFiles(files) {
  const fileArray = [...files];
  
  fileArray.forEach(file => {
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const vertices = parseSTL(evt.target.result);
        const volumeMm3 = calculateVolume(vertices);
        const volumeCm3 = volumeMm3 / 1000;
        
        addModel({
          name: file.name.replace(/\.stl$/i, ''),
          volumeCm3: volumeCm3
        });
      } catch (err) {
        console.error('Ошибка парсинга STL:', file.name, err);
        alert(`Не удалось прочитать файл: ${file.name}`);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ========== MODEL MANAGEMENT ==========

function addModel(data) {
  const tariff = parseFloat(tariffInput.value) || 0;
  const model = {
    id: ++modelIdCounter,
    name: data.name,
    volumeCm3: data.volumeCm3,
    quantity: 1,
    pricePerUnit: data.volumeCm3 * tariff,
    totalPrice: data.volumeCm3 * tariff
  };
  
  models.push(model);
  renderTable();
  updateExportPreview();
}

function removeModel(id) {
  models = models.filter(m => m.id !== id);
  // Renumber
  models.forEach((m, i) => m.id = i + 1);
  modelIdCounter = models.length;
  renderTable();
  updateExportPreview();
}

function updateQuantity(id, qty) {
  const model = models.find(m => m.id === id);
  if (model) {
    model.quantity = Math.max(1, parseInt(qty) || 1);
    model.totalPrice = model.pricePerUnit * model.quantity;
    renderTable();
    updateExportPreview();
  }
}

function recalculateAll() {
  const tariff = parseFloat(tariffInput.value) || 0;
  models.forEach(model => {
    model.pricePerUnit = model.volumeCm3 * tariff;
    model.totalPrice = model.pricePerUnit * model.quantity;
  });
  renderTable();
}

// ========== RENDERING ==========

function renderTable() {
  const hasModels = models.length > 0;
  
  // Toggle visibility
  emptyState.classList.toggle('hidden', hasModels);
  modelsFoot.classList.toggle('hidden', !hasModels);
  clearAllBtn.disabled = !hasModels;
  exportSection.classList.toggle('hidden', !hasModels);
  
  // Clear and rebuild body
  modelsBody.innerHTML = '';
  
  models.forEach((model, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td class="col-name">${escapeHtml(model.name)}</td>
      <td class="col-volume">${formatNumber(model.volumeCm3, 2)}</td>
      <td class="col-price">${formatNumber(model.pricePerUnit, 0)}</td>
      <td class="col-qty">
        <input type="number" class="qty-input" value="${model.quantity}" min="1" data-id="${model.id}">
      </td>
      <td class="col-total">${formatNumber(model.totalPrice, 0)}</td>
      <td class="col-actions">
        <button type="button" class="btn-delete" data-id="${model.id}" title="Удалить">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </td>
    `;
    modelsBody.appendChild(tr);
  });
  
  // Update grand total
  const total = models.reduce((sum, m) => sum + m.totalPrice, 0);
  grandTotalEl.textContent = formatNumber(total, 0) + ' ₽';
  
  // Attach event listeners
  modelsBody.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', e => {
      updateQuantity(parseInt(e.target.dataset.id), e.target.value);
    });
  });
  
  modelsBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      removeModel(parseInt(e.currentTarget.dataset.id));
    });
  });
}

// ========== EXPORT ==========

function generateExportText() {
  if (models.length === 0) return '—';
  
  const cols = {
    num: colCheckboxes.num.checked,
    name: colCheckboxes.name.checked,
    volume: colCheckboxes.volume.checked,
    price: colCheckboxes.price.checked,
    qty: colCheckboxes.qty.checked,
    total: colCheckboxes.total.checked
  };
  
  const useMillimeters = volumeUnitSelect.value === 'mm3';
  
  const lines = models.map((model, index) => {
    const parts = [];
    if (cols.num) parts.push(index + 1);
    if (cols.name) parts.push(model.name);
    if (cols.volume) {
      if (useMillimeters) {
        parts.push(formatNumber(model.volumeCm3 * 1000, 0));
      } else {
        parts.push(formatNumber(model.volumeCm3, 2));
      }
    }
    if (cols.price) parts.push(formatNumber(model.pricePerUnit, 0));
    if (cols.qty) parts.push(model.quantity);
    if (cols.total) parts.push(formatNumber(model.totalPrice, 0));
    return parts.join('\t');
  });
  
  return lines.join('\n');
}

function updateExportPreview() {
  exportPreview.textContent = generateExportText();
}

// ========== UTILITIES ==========

function formatNumber(value, decimals = 2) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== INIT ==========
renderTable();

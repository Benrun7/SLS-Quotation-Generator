// ========== MATERIALS DATABASE ==========
const MATERIALS = {
  'AlSi10Mg': { name: 'AlSi10Mg (алюминий)', densitySolid: 2.67, densityPowder: 1.3, price: 8000 },
  '316L': { name: '316L (нержавейка)', densitySolid: 8.0, densityPowder: 4.0, price: 6000 },
  'Ti64': { name: 'Ti6Al4V (титан)', densitySolid: 4.43, densityPowder: 2.2, price: 15000 },
  'custom': { name: 'Свой материал', densitySolid: 4.43, densityPowder: 2.2, price: 10000 }
};

// ========== STATE ==========
let scene, camera, renderer, controls;
let mesh = null;
let geometryStats = null;

// ========== DOM REFS ==========
const viewerEl = document.getElementById('viewer');

// STL upload
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const demoBtn = document.getElementById('demoBtn');
const fileNameEl = document.getElementById('fileName');

// Geometry display
const volumeValue = document.getElementById('volumeValue');
const heightValue = document.getElementById('heightValue');
const bboxValue = document.getElementById('bboxValue');
const areaValue = document.getElementById('areaValue');

// Material
const materialSelect = document.getElementById('materialSelect');
const materialPrice = document.getElementById('materialPrice');
const densitySolid = document.getElementById('densitySolid');
const densityPowder = document.getElementById('densityPowder');
const supportFactor = document.getElementById('supportFactor');

// Machine
const bedX = document.getElementById('bedX');
const bedY = document.getElementById('bedY');
const productivity = document.getElementById('productivity');
const powderLoss = document.getElementById('powderLoss');

// Time
const timeLayout = document.getElementById('timeLayout');
const timeMachinePrep = document.getElementById('timeMachinePrep');
const timeUnpack = document.getElementById('timeUnpack');
const timeHeatTreat = document.getElementById('timeHeatTreat');
const timeEDM = document.getElementById('timeEDM');
const timeMachRough = document.getElementById('timeMachRough');
const timeMachFine = document.getElementById('timeMachFine');
const timeAbrasive = document.getElementById('timeAbrasive');

// Personnel
const numEngineers = document.getElementById('numEngineers');
const rateEngineer = document.getElementById('rateEngineer');
const numTechnicians = document.getElementById('numTechnicians');
const rateTechnician = document.getElementById('rateTechnician');

// Consumables
const costPlatform = document.getElementById('costPlatform');
const costGas = document.getElementById('costGas');
const gasHours = document.getElementById('gasHours');
const costFilter = document.getElementById('costFilter');
const filterHours = document.getElementById('filterHours');

// Pricing
const margin = document.getElementById('margin');
const overhead = document.getElementById('overhead');
const quantity = document.getElementById('quantity');

// Results
const calcBtn = document.getElementById('calcBtn');
const launchCost = document.getElementById('launchCost');
const costPrice = document.getElementById('costPrice');
const sellPrice = document.getElementById('sellPrice');
const batchPrice = document.getElementById('batchPrice');
const breakdown = document.getElementById('breakdown');

// Export
const lineIndex = document.getElementById('lineIndex');
const partName = document.getElementById('partName');
const copyRow = document.getElementById('copyRow');
const downloadCsv = document.getElementById('downloadCsv');
const exportPreview = document.getElementById('exportPreview');

// ========== EVENT LISTENERS ==========

// Prevent browser navigation on drop
['dragover', 'drop'].forEach(evt => {
  window.addEventListener(evt, e => e.preventDefault());
});

// Material select
materialSelect.addEventListener('change', () => {
  const mat = MATERIALS[materialSelect.value];
  if (mat) {
    materialPrice.value = mat.price;
    densitySolid.value = mat.densitySolid;
    densityPowder.value = mat.densityPowder;
  }
});

// STL upload
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadStlFile(file);
});

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
  const file = e.dataTransfer.files[0];
  if (file) loadStlFile(file);
});

// Demo cube
demoBtn.addEventListener('click', () => {
  const demoAscii = `solid cube
facet normal 0 0 1
outer loop
vertex 0 0 10
vertex 10 0 10
vertex 0 10 10
endloop
endfacet
facet normal 0 0 1
outer loop
vertex 10 0 10
vertex 10 10 10
vertex 0 10 10
endloop
endfacet
facet normal 0 0 -1
outer loop
vertex 0 0 0
vertex 0 10 0
vertex 10 0 0
endloop
endfacet
facet normal 0 0 -1
outer loop
vertex 10 0 0
vertex 0 10 0
vertex 10 10 0
endloop
endfacet
facet normal 0 1 0
outer loop
vertex 0 10 0
vertex 0 10 10
vertex 10 10 0
endloop
endfacet
facet normal 0 1 0
outer loop
vertex 10 10 0
vertex 0 10 10
vertex 10 10 10
endloop
endfacet
facet normal 0 -1 0
outer loop
vertex 0 0 0
vertex 10 0 0
vertex 0 0 10
endloop
endfacet
facet normal 0 -1 0
outer loop
vertex 10 0 0
vertex 10 0 10
vertex 0 0 10
endloop
endfacet
facet normal 1 0 0
outer loop
vertex 10 0 0
vertex 10 10 0
vertex 10 0 10
endloop
endfacet
facet normal 1 0 0
outer loop
vertex 10 0 10
vertex 10 10 0
vertex 10 10 10
endloop
endfacet
facet normal -1 0 0
outer loop
vertex 0 0 0
vertex 0 0 10
vertex 0 10 0
endloop
endfacet
facet normal -1 0 0
outer loop
vertex 0 0 10
vertex 0 10 10
vertex 0 10 0
endloop
endfacet
endsolid cube`;
  const blob = new Blob([demoAscii], { type: 'application/vnd.ms-pki.stl' });
  const file = new File([blob], 'demo_cube_10mm.stl');
  loadStlFile(file);
});

// Calculate
calcBtn.addEventListener('click', calculateAll);

// Export
copyRow.addEventListener('click', () => {
  const row = exportPreview.textContent.trim();
  navigator.clipboard.writeText(row).catch(() => {});
});

downloadCsv.addEventListener('click', () => {
  const row = exportPreview.textContent.trim();
  const blob = new Blob([row + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quote.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// ========== STL LOADING ==========

function loadStlFile(file) {
  console.log('Загрузка STL', file.name, file.size);
  fileNameEl.textContent = file.name;
  partName.value = file.name.replace(/\.stl$/i, '') || 'Деталь SLM';

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(evt.target.result);
      handleGeometry(geometry);
    } catch (err) {
      console.error('Ошибка парсинга STL', err);
      alert('Не удалось прочитать STL. Проверьте файл.');
    }
  };
  reader.onerror = () => alert('Ошибка чтения файла.');
  reader.readAsArrayBuffer(file);
}

function handleGeometry(geometry) {
  console.log('Геометрия загружена', geometry);
  geometry.computeVertexNormals();
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9
  });

  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  geometryStats = computeGeometryStats(geometry);
  updateGeometryUI(geometryStats);
  fitCamera(geometryStats.box);
}

function computeGeometryStats(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const pos = g.attributes.position.array;
  let volume = 0;
  let area = 0;

  for (let i = 0; i < pos.length; i += 9) {
    const ax = pos[i], ay = pos[i + 1], az = pos[i + 2];
    const bx = pos[i + 3], by = pos[i + 4], bz = pos[i + 5];
    const cx = pos[i + 6], cy = pos[i + 7], cz = pos[i + 8];

    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;

    const crossx = aby * acz - abz * acy;
    const crossy = abz * acx - abx * acz;
    const crossz = abx * acy - aby * acx;

    area += Math.sqrt(crossx * crossx + crossy * crossy + crossz * crossz) * 0.5;
    volume += (ax * crossx + ay * crossy + az * crossz) / 6;
  }

  const box = new THREE.Box3().setFromBufferAttribute(g.attributes.position);
  return {
    volumeMm3: Math.abs(volume),
    areaMm2: area,
    box
  };
}

function updateGeometryUI(stats) {
  const volumeCm3 = stats.volumeMm3 / 1000;
  const areaCm2 = stats.areaMm2 / 100;
  const size = stats.box.getSize(new THREE.Vector3());

  volumeValue.textContent = `${formatNum(volumeCm3, 2)} см³`;
  heightValue.textContent = `${formatNum(size.z, 1)} мм`;
  bboxValue.textContent = `${formatNum(size.x, 0)}×${formatNum(size.y, 0)}×${formatNum(size.z, 0)} мм`;
  areaValue.textContent = `${formatNum(areaCm2, 1)} см²`;
}

// ========== COST CALCULATION ==========

function calculateAll() {
  if (!geometryStats) {
    alert('Сначала загрузите STL');
    return;
  }

  // --- Inputs ---
  const V_det_cm3 = geometryStats.volumeMm3 / 1000;
  const h_det_mm = geometryStats.box.getSize(new THREE.Vector3()).z;
  
  const rho_solid = parseFloat(densitySolid.value) || 4.43;    // g/cm³
  const rho_powder = parseFloat(densityPowder.value) || 2.2;   // g/cm³
  const price_kg = parseFloat(materialPrice.value) || 15000;   // RUB/kg
  const k_support = 1 + (parseFloat(supportFactor.value) || 15) / 100;  // 1.15
  const loss_pct = (parseFloat(powderLoss.value) || 7) / 100;  // 0.07
  
  const bed_x = parseFloat(bedX.value) || 350;  // mm
  const bed_y = parseFloat(bedY.value) || 350;  // mm
  const prod = parseFloat(productivity.value) || 6.5;  // cm³/h
  
  // --- Material calculations ---
  // Volume with supports
  const V_total_cm3 = V_det_cm3 * k_support;
  
  // Mass fused into part (irretrievable)
  const m_fused_kg = (V_total_cm3 * rho_solid) / 1000;
  
  // Chamber powder volume
  const V_chamber_cm3 = (bed_x * bed_y * h_det_mm) / 1000;  // mm³ to cm³
  
  // Mass of powder for the build
  const m_powder_kg = (V_chamber_cm3 * rho_powder) / 1000;
  
  // Losses (7%)
  const m_loss_kg = m_powder_kg * loss_pct;
  
  // Returnable powder
  const m_return_kg = Math.max(0, m_powder_kg - m_fused_kg - m_loss_kg);
  
  // --- Time calculations ---
  const t_print_h = V_total_cm3 / prod;
  
  const t_prep = (parseFloat(timeLayout.value) || 0) + (parseFloat(timeMachinePrep.value) || 0);
  const t_monitor = t_print_h / 6;  // 1 min per 10 min
  
  const t_postproc = (parseFloat(timeUnpack.value) || 0) 
                   + (parseFloat(timeHeatTreat.value) || 0)
                   + (parseFloat(timeEDM.value) || 0)
                   + (parseFloat(timeMachRough.value) || 0)
                   + (parseFloat(timeMachFine.value) || 0)
                   + (parseFloat(timeAbrasive.value) || 0);
  
  // --- Labor costs ---
  const n_eng = parseInt(numEngineers.value) || 2;
  const rate_eng = parseFloat(rateEngineer.value) || 1500;
  const n_tech = parseInt(numTechnicians.value) || 3;
  const rate_tech = parseFloat(rateTechnician.value) || 600;
  
  const labor_eng = (t_prep + t_monitor) * n_eng * rate_eng;
  const labor_tech = t_postproc * n_tech * rate_tech;
  const labor_total = labor_eng + labor_tech;
  
  // --- Consumables ---
  const c_platform = parseFloat(costPlatform.value) || 3000;
  const c_gas = parseFloat(costGas.value) || 4000;
  const h_gas = parseFloat(gasHours.value) || 30;
  const c_filter = parseFloat(costFilter.value) || 7000;
  const h_filter = parseFloat(filterHours.value) || 48;
  
  const consumables_gas = Math.ceil(t_print_h / h_gas) * c_gas;
  const consumables_filter = Math.ceil(t_print_h / h_filter) * c_filter;
  const consumables_total = c_platform + consumables_gas + consumables_filter;
  
  // --- Costs ---
  const cost_powder_all = m_powder_kg * price_kg;       // all powder for launch
  const cost_fused = m_fused_kg * price_kg;              // fused into part
  const cost_loss = m_loss_kg * price_kg;                // lost powder
  
  // Launch cost = all powder + labor + consumables
  const launch = cost_powder_all + labor_total + consumables_total;
  
  // Cost price = fused + losses + labor + consumables
  const cost = cost_fused + cost_loss + labor_total + consumables_total;
  
  // Sell price = cost + margin + overhead
  const margin_pct = (parseFloat(margin.value) || 20) / 100;
  const overhead_val = parseFloat(overhead.value) || 0;
  const qty = Math.max(1, parseInt(quantity.value) || 1);
  
  const sell = cost * (1 + margin_pct) + overhead_val;
  const batch = sell * qty;
  
  // --- Update UI ---
  launchCost.textContent = formatRub(launch);
  costPrice.textContent = formatRub(cost);
  sellPrice.textContent = formatRub(sell);
  batchPrice.textContent = `${formatRub(batch)} (×${qty})`;
  
  // Breakdown
  breakdown.innerHTML = `
    <div class="breakdown-row section"><span>МАТЕРИАЛ</span></div>
    <div class="breakdown-row"><span class="label">Объём детали</span><span class="value">${formatNum(V_det_cm3, 2)} см³</span></div>
    <div class="breakdown-row"><span class="label">+ поддержки (${formatNum((k_support-1)*100,0)}%)</span><span class="value">${formatNum(V_total_cm3, 2)} см³</span></div>
    <div class="breakdown-row"><span class="label">Масса сплавленного</span><span class="value">${formatNum(m_fused_kg, 3)} кг</span></div>
    <div class="breakdown-row"><span class="label">Объём насыпи в камере</span><span class="value">${formatNum(V_chamber_cm3, 0)} см³</span></div>
    <div class="breakdown-row"><span class="label">Порошок для запуска</span><span class="value">${formatNum(m_powder_kg, 2)} кг</span></div>
    <div class="breakdown-row"><span class="label">Потери (${formatNum(loss_pct*100,0)}%)</span><span class="value">${formatNum(m_loss_kg, 3)} кг</span></div>
    <div class="breakdown-row"><span class="label">Возвратный порошок</span><span class="value">${formatNum(m_return_kg, 2)} кг</span></div>
    
    <div class="breakdown-row section"><span>ВРЕМЯ</span></div>
    <div class="breakdown-row"><span class="label">Печать</span><span class="value">${formatNum(t_print_h, 1)} ч</span></div>
    <div class="breakdown-row"><span class="label">Подготовка</span><span class="value">${formatNum(t_prep, 1)} ч</span></div>
    <div class="breakdown-row"><span class="label">Мониторинг</span><span class="value">${formatNum(t_monitor, 1)} ч</span></div>
    <div class="breakdown-row"><span class="label">Постобработка</span><span class="value">${formatNum(t_postproc, 1)} ч</span></div>
    
    <div class="breakdown-row section"><span>СТОИМОСТИ</span></div>
    <div class="breakdown-row"><span class="label">Порошок (весь)</span><span class="value">${formatRub(cost_powder_all)}</span></div>
    <div class="breakdown-row"><span class="label">Порошок (в детали)</span><span class="value">${formatRub(cost_fused)}</span></div>
    <div class="breakdown-row"><span class="label">Потери материала</span><span class="value">${formatRub(cost_loss)}</span></div>
    <div class="breakdown-row"><span class="label">ФОТ инженеры</span><span class="value">${formatRub(labor_eng)}</span></div>
    <div class="breakdown-row"><span class="label">ФОТ техники</span><span class="value">${formatRub(labor_tech)}</span></div>
    <div class="breakdown-row"><span class="label">Платформа</span><span class="value">${formatRub(c_platform)}</span></div>
    <div class="breakdown-row"><span class="label">Газ</span><span class="value">${formatRub(consumables_gas)}</span></div>
    <div class="breakdown-row"><span class="label">Фильтры</span><span class="value">${formatRub(consumables_filter)}</span></div>
  `;
  
  // Export preview
  const idx = Math.max(1, parseInt(lineIndex.value) || 1);
  const name = partName.value || 'Деталь SLM';
  exportPreview.textContent = `${idx} - ${name} - ${formatRub(sell)} - ${qty} - ${formatRub(batch)}`;
}

// ========== UTILITIES ==========

function formatNum(val, decimals = 2) {
  return Number(val || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatRub(val) {
  return Number(val || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' ₽';
}

// ========== 3D VIEWER ==========

function initViewer() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e17);

  camera = new THREE.PerspectiveCamera(45, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 10000);
  camera.position.set(150, 150, 150);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  viewerEl.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(100, 200, 100);
  scene.add(ambient, dir);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener('resize', onResize);
  animate();
}

function onResize() {
  if (!viewerEl.clientWidth || !viewerEl.clientHeight) return;
  camera.aspect = viewerEl.clientWidth / viewerEl.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
}

function fitCamera(box) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 2.5;

  camera.position.set(center.x + distance, center.y + distance * 0.7, center.z + distance);
  controls.target.copy(center);
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ========== INIT ==========
initViewer();

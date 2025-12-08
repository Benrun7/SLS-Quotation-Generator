// Basic state
let scene, camera, renderer, controls;
let mesh = null;
let geometryStats = null;

const viewerEl = document.getElementById('viewer');

// UI refs
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileNameEl = document.getElementById('fileName');

const volumeValue = document.getElementById('volumeValue');
const areaValue = document.getElementById('areaValue');
const bboxValue = document.getElementById('bboxValue');
const massValue = document.getElementById('massValue');

const materialPrice = document.getElementById('materialPrice');
const density = document.getElementById('density');
const scrap = document.getElementById('scrap');
const machineRate = document.getElementById('machineRate');
const productivity = document.getElementById('productivity');
const manualTime = document.getElementById('manualTime');
const margin = document.getElementById('margin');
const quantity = document.getElementById('quantity');

const calcBtn = document.getElementById('calcBtn');
const formulaText = document.getElementById('formulaText');
const unitCost = document.getElementById('unitCost');
const lineCost = document.getElementById('lineCost');

const lineIndex = document.getElementById('lineIndex');
const partName = document.getElementById('partName');
const exportPreview = document.getElementById('exportPreview');
const copyRow = document.getElementById('copyRow');
const downloadCsv = document.getElementById('downloadCsv');
const demoBtn = document.getElementById('demoBtn');

// Prevent browser navigating away on drop
['dragover', 'drop'].forEach(evt => {
  window.addEventListener(evt, e => {
    e.preventDefault();
  });
});

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileInput);

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

calcBtn.addEventListener('click', () => {
  const result = calculateCost();
  if (result) updateExportRow(result);
});

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

function handleFileInput(e) {
  const file = e.target.files[0];
  if (file) loadStlFile(file);
}

function loadStlFile(file) {
  console.log('Загрузка STL', file.name, file.type, file.size);
  fileNameEl.textContent = file.name;
  partName.value = file.name.replace(/\.stl$/i, '') || 'Деталь STL';

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const arrayBuffer = evt.target.result;
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(arrayBuffer);
      handleGeometry(geometry);
    } catch (err) {
      console.error('Ошибка парсинга STL', err);
      alert('Не удалось прочитать STL. Проверьте файл (ASCII или binary) и попробуйте снова.');
    }
  };
  reader.onerror = () => {
    alert('Ошибка чтения файла. Попробуйте другой STL или переоткройте страницу.');
  };
  reader.readAsArrayBuffer(file);
}

function handleGeometry(geometry) {
  console.log('Геометрия загружена', geometry);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    metalness: 0.2,
    roughness: 0.25,
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

    const triArea = Math.sqrt(crossx * crossx + crossy * crossy + crossz * crossz) * 0.5;
    area += triArea;

    const vol = (ax * crossx + ay * crossy + az * crossz) / 6;
    volume += vol;
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

  volumeValue.textContent = `${formatNumber(volumeCm3, 2)} см³`;
  areaValue.textContent = `${formatNumber(areaCm2, 2)} см²`;
  bboxValue.textContent = `${formatNumber(size.x, 1)} × ${formatNumber(size.y, 1)} × ${formatNumber(size.z, 1)}`;
}

function calculateCost() {
  if (!geometryStats) {
    alert('Сначала загрузите STL');
    return null;
  }

  const volCm3 = geometryStats.volumeMm3 / 1000;
  const dens = parseFloat(density.value) || 0;
  const priceKg = parseFloat(materialPrice.value) || 0;
  const scrapFactor = 1 + (parseFloat(scrap.value) || 0) / 100;
  const machineHour = parseFloat(machineRate.value) || 0;
  const prod = parseFloat(productivity.value) || 0;
  const manualHrs = parseFloat(manualTime.value) || 0;
  const marginFactor = 1 + (parseFloat(margin.value) || 0) / 100;
  const qty = Math.max(1, parseInt(quantity.value, 10) || 1);

  const massKg = (volCm3 * dens) / 1000;
  massValue.textContent = `${formatNumber(massKg, 3)} кг`;

  const materialCost = massKg * priceKg * scrapFactor;
  const machineHours = manualHrs > 0 ? manualHrs : prod > 0 ? volCm3 / prod : 0;
  const machineCost = machineHours * machineHour;
  const base = materialCost + machineCost;
  const unit = base * marginFactor;
  const total = unit * qty;

  unitCost.textContent = `${formatNumber(unit, 2)} руб`;
  lineCost.textContent = `${formatNumber(total, 2)} руб`;

  updateFormula({
    volCm3,
    dens,
    massKg,
    priceKg,
    scrapFactor,
    machineHours,
    machineHour,
    materialCost,
    machineCost,
    unit,
    total,
    qty,
    marginFactor
  });

  return { unit, total, qty };
}

function updateExportRow(result) {
  const idx = Math.max(1, parseInt(lineIndex.value, 10) || 1);
  const name = partName.value || 'Деталь STL';
  const row = `${idx} - ${name} - ${formatNumber(result.unit, 2)} - ${result.qty} - ${formatNumber(result.total, 2)}`;
  exportPreview.textContent = row;
}

function updateFormula(data) {
  const lines = [
    `Материал: V = ${formatNumber(data.volCm3, 2)} см³, ρ = ${formatNumber(data.dens, 2)} г/см³`,
    `m = V × ρ = ${formatNumber(data.massKg, 3)} кг`,
    `Cмат = m × цену × коэф.брака = ${formatNumber(data.materialCost, 2)} руб`,
    `Время: ${data.machineHours > 0 ? `${formatNumber(data.machineHours, 2)} ч` : '0 ч (нет данных)'}; Cмаш = время × ставку = ${formatNumber(data.machineCost, 2)} руб`,
    `Себестоимость = ${formatNumber(data.materialCost, 2)} + ${formatNumber(data.machineCost, 2)} = ${formatNumber(data.materialCost + data.machineCost, 2)} руб`,
    `Надбавка: × ${formatNumber(data.marginFactor, 2)} ⇒ Цена за шт. = ${formatNumber(data.unit, 2)} руб`,
    `Позиция: ${formatNumber(data.unit, 2)} × ${data.qty} = ${formatNumber(data.total, 2)} руб`
  ];
  formulaText.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
}

function formatNumber(value, fractionDigits = 2) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}

function initViewer() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);

  camera = new THREE.PerspectiveCamera(45, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 1000);
  camera.position.set(80, 80, 80);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  viewerEl.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(50, 80, 60);
  scene.add(ambient, dir);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener('resize', onResize);
  animate();
}

function onResize() {
  const { clientWidth, clientHeight } = viewerEl;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

function fitCamera(box) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 2.2;

  camera.position.set(center.x + distance, center.y + distance, center.z + distance);
  controls.target.copy(center);
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

initViewer();

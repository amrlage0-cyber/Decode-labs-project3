/* ==========================================================================
   NO LAG — ELITE PC HARDWARE HUB
   HUD SYSTEM MONITORING (user-dashbord.js)
   ========================================================================== */

/* ----- GLOBAL COMPONENT STATE MAPPING ----- */
let telemetryInterval = null;
let currentSource = 'virtual-cpu'; // 'virtual-cpu', 'virtual-gpu', or 'product-X'
let currentCategory = 'cpu';

// Dynamic hardware base telemetry indices
let baseClock = 6.20;
let baseTemp = 55;
let baseVolt = 1.352;
let baseWatt = 150.4;
let clockUnit = 'GHz';

// Diagnostics active controls
let overclockMultiplier = 0;
let coolingBoostActive = false;
let isBenchmarking = false;

document.addEventListener('DOMContentLoaded', () => {
  renderHistoricalLogs();
  populateSourceSelector();
  renderAcquiredRegistryUI();
  initializeTelemetrySimulator();
});

/* ----- PATH ROUTING RESOLVE BACKUP ----- */
const isDashboardSubPath = window.location.pathname.includes('/pages/');
const dashPrefix = isDashboardSubPath ? '../' : './';

function resolveDashboardImagePath(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const clean = imagePath.replace(/^(\.\.\/|\.\/|.*?assets\/images\/)/, '');
  return dashPrefix + 'assets/images/' + clean;
}

/* ----- MATCH USER ACQUIRED HARDWARE FROM HISTORY ----- */
function getAcquiredProducts() {
  const rawProducts = localStorage.getItem('noLag_products');
  const products = rawProducts ? JSON.parse(rawProducts) : [];

  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];

  const acquired = [];
  const seenIds = new Set();

  orders.forEach(order => {
    // 1. Direct structured match
    if (order.items_raw && Array.isArray(order.items_raw)) {
      order.items_raw.forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const original = products.find(p => p.id === item.id);
          acquired.push(original || item);
        }
      });
    } else if (order.items) {
      // 2. Backward compatibility search using substring match of registered SKUs
      products.forEach(p => {
        if (order.items.toLowerCase().includes(p.name.toLowerCase())) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            acquired.push(p);
          }
        }
      });
    }
  });

  return acquired;
}

/* ----- COMPILING SOURCE SELECTOR CHANNELS ----- */
function populateSourceSelector() {
  const selector = document.getElementById('hardware-core-selector');
  if (!selector) return;

  const acquired = getAcquiredProducts();

  // Anchor virtual simulators first
  let html = `
    <option value="virtual-cpu">VIRTUAL SIMULATOR (i9-14900KS CPU Core)</option>
    <option value="virtual-gpu">VIRTUAL SIMULATOR (RTX 4090 SUPER GPU Acceleration)</option>
  `;

  if (acquired.length > 0) {
    acquired.forEach(p => {
      html += `<option value="product-${p.id}">ACQUIRED CORE: ${p.name}</option>`;
    });
  }

  selector.innerHTML = html;
}

/* ----- RENDERING SILICON LEDGER REGISTRY ----- */
function renderAcquiredRegistryUI() {
  const wrapper = document.getElementById('acquired-registry-wrapper');
  if (!wrapper) return;

  const acquired = getAcquiredProducts();

  if (acquired.length === 0) {
    wrapper.innerHTML = `
      <div class="bento-card registry-empty-card">
        <i data-lucide="cpu" class="registry-empty-icon"></i>
        <h4 class="registry-empty-title">Awaiting Silicon Core Deployments</h4>
        <p class="registry-empty-desc">
          No custom extreme hardware cores have been purchased on this pilot balance yet. Navigate the Component Catalog to deploy permanent physical hardware elements onto your telemetry pipeline.
        </p>
        <a href="products.html" class="category-pill active registry-empty-link">NAVIGATE COMPONENT CATALOG</a>
      </div>
    `;
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 120);
    return;
  }

  let html = '';
  acquired.forEach(p => {
    const serialCode = `SN-HW-${p.id}-${100 + (p.id * 89) % 900}-${p.category.toUpperCase()}`;
    const imgUrl = resolveDashboardImagePath(p.image);

    html += `
      <div class="product-card registry-product-card">
        <div class="registry-product-img-box">
          <img src="${imgUrl}" alt="${p.name}" class="registry-product-img" onerror="this.onerror=null; this.parentNode.innerHTML=renderHardwareSVG()">
          <span class="registry-product-status-tag">ONLINE_LINK</span>
        </div>
        
        <span class="bento-card-title-prefix registry-product-prefix">${p.category.toUpperCase()} CORE TELEMETRY</span>
        <h4 class="registry-product-title" title="${p.name}">${p.name}</h4>
        
        <div class="registry-product-metabox">
          <div>MAPPING_KEY: <span class="registry-product-bold-white">${serialCode}</span></div>
          <div>THERMAL_GATE: <span class="registry-product-status-val">NOMINAL</span></div>
        </div>

        <button onclick="runLocalProductDiagnostic(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.category}')" class="btn-submit registry-product-btn">
          RUN COBALT DIAGNOSTICS
        </button>
      </div>
    `;
  });

  wrapper.innerHTML = html;
  
  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 120);
}

/* ----- LOG TO TERMINAL SCREEN WORKSPACE ----- */
function writeTerminalLog(text, isAlert = false) {
  const feed = document.getElementById('terminal-live-feed');
  if (!feed) return;

  const row = document.createElement('div');
  const timestamp = new Date().toLocaleTimeString();
  row.className = 'terminal-log-row';
  if (isAlert) {
    row.classList.add('terminal-log-alert');
  }
  row.innerHTML = `<span class="terminal-log-timestamp">[${timestamp}]</span> ${text}`;
  
  // Target feed layout supports appending nicely
  feed.appendChild(row);

  // Keep records constrained
  while (feed.childNodes.length > 50) {
    feed.removeChild(feed.firstChild);
  }

  // Auto-scroll to the bottom so that newest output is always visible
  feed.scrollTop = feed.scrollHeight;
}

/* ----- OVERCLOCK SLIDER TUNING SYSTEM ---- */
function updateOverclockFactor(value) {
  overclockMultiplier = Number(value);
  const label = document.getElementById('overclock-multiplier-val');
  if (label) {
    if (overclockMultiplier === 0) {
      label.textContent = '+0% (SAFE MODE)';
      label.classList.add('oc-label-safe');
      label.classList.remove('oc-label-extreme', 'oc-label-active');
    } else {
      label.textContent = `+${overclockMultiplier * 2}% (EXTREME OC)`;
      if (overclockMultiplier >= 18) {
        label.classList.add('oc-label-extreme');
        label.classList.remove('oc-label-safe', 'oc-label-active');
      } else {
        label.classList.add('oc-label-active');
        label.classList.remove('oc-label-safe', 'oc-label-extreme');
      }
    }
  }

  if (overclockMultiplier >= 15) {
    writeTerminalLog(`[TUNING] Warning: elevated clock rates may result in high thermals. Cooling optimization recommended!`, true);
  } else {
    writeTerminalLog(`[TUNING] Clock phase adjusted. Synthesizer clock updated.`, false);
  }

  runTelemetryTick();
}

/* ----- COOLING STATE CONTROLLER ----- */
function toggleCoolingState() {
  coolingBoostActive = !coolingBoostActive;
  const stateLabel = document.getElementById('cooling-state-lbl');
  const btn = document.getElementById('cooling-switch-btn');

  if (stateLabel && btn) {
    if (coolingBoostActive) {
      stateLabel.textContent = 'VAPOR RAD: 100% BOOST';
      stateLabel.classList.add('cooling-label-boost');
      stateLabel.classList.remove('cooling-label-eco');
      btn.textContent = 'DISENGAGE COOLER [ECO MODE]';
      btn.classList.add('cooling-btn-boost');
      btn.classList.remove('cooling-btn-eco');
      writeTerminalLog(`[COOLING] Liquid expander engaged. Fan velocities forced at 100% duty cycles.`);
    } else {
      stateLabel.textContent = 'ECO COOLING';
      stateLabel.classList.add('cooling-label-eco');
      stateLabel.classList.remove('cooling-label-boost');
      btn.textContent = 'ENGAGE VAPOR BOOST [FAN 100%]';
      btn.classList.add('cooling-btn-eco');
      btn.classList.remove('cooling-btn-boost');
      writeTerminalLog(`[COOLING] Dynamic eco profiles recovered. Fans reverted to standard operating curves.`);
    }
  }

  runTelemetryTick();
}

/* ----- SWITCH TELEMETRY PIPELINE CHANNELS ----- */
function switchTelemetrySource() {
  const selector = document.getElementById('hardware-core-selector');
  if (!selector) return;

  currentSource = selector.value;
  const nameDisplay = document.getElementById('active-core-name-display');
  const typePrefix = document.getElementById('active-core-type-prefix');

  const specLabelFreq = document.getElementById('spec-label-freq');
  const specLabelVolt = document.getElementById('spec-label-volt');
  const specLabelWatt = document.getElementById('spec-label-watt');

  writeTerminalLog(`[SOURCE] Routing sensor stream focus to: ${currentSource.toUpperCase()}...`);

  if (currentSource === 'virtual-cpu') {
    currentCategory = 'cpu';
    nameDisplay.textContent = 'Intel Core i9-14900KS';
    typePrefix.textContent = 'ACTIVE SEMICONDUCTOR PIPELINE';
    baseClock = 6.20;
    baseTemp = 55;
    baseVolt = 1.352;
    baseWatt = 150.4;
    clockUnit = 'GHz';

    specLabelFreq.textContent = 'Clock Frequency';
    specLabelVolt.textContent = 'Voltage Phase';
    specLabelWatt.textContent = 'Power Draw';
  } else if (currentSource === 'virtual-gpu') {
    currentCategory = 'gpu';
    nameDisplay.textContent = 'NVIDIA RTX 4090 SUPER';
    typePrefix.textContent = 'ACTIVE SEMICONDUCTOR PIPELINE';
    baseClock = 2.62;
    baseTemp = 65;
    baseVolt = 1.050;
    baseWatt = 450.0;
    clockUnit = 'GHz';

    specLabelFreq.textContent = 'Core GPU Frequency';
    specLabelVolt.textContent = 'Rail Voltage';
    specLabelWatt.textContent = 'Thermal TDP';
  } else if (currentSource.startsWith('product-')) {
    const id = Number(currentSource.replace('product-', ''));
    const rawProducts = localStorage.getItem('noLag_products');
    const products = rawProducts ? JSON.parse(rawProducts) : [];
    const p = products.find(prod => prod.id === id);

    if (p) {
      currentCategory = p.category;
      nameDisplay.textContent = p.name;
      typePrefix.textContent = `ACQUIRED PHYS ${p.category.toUpperCase()} CORE LINK`;

      if (p.category === 'cpu') {
        baseClock = 6.20;
        baseTemp = 55;
        baseVolt = 1.352;
        baseWatt = 150.4;
        clockUnit = 'GHz';
        specLabelFreq.textContent = 'Clock Frequency';
        specLabelVolt.textContent = 'Voltage Phase';
        specLabelWatt.textContent = 'Power Draw';
      } else if (p.category === 'gpu') {
        baseClock = 2.62;
        baseTemp = 65;
        baseVolt = 1.050;
        baseWatt = 450.0;
        clockUnit = 'GHz';
        specLabelFreq.textContent = 'SCLK Frequency';
        specLabelVolt.textContent = 'Rail Voltage';
        specLabelWatt.textContent = 'Thermal TDP';
      } else if (p.category === 'ram') {
        baseClock = 6000;
        baseTemp = 36;
        baseVolt = 1.350;
        baseWatt = 28.5;
        clockUnit = 'MT/s';
        specLabelFreq.textContent = 'DDR5 Channel Rate';
        specLabelVolt.textContent = 'VDD Bus Voltage';
        specLabelWatt.textContent = 'RAM Module Watts';
      } else if (p.category === 'storage') {
        baseClock = 7500;
        baseTemp = 32;
        baseVolt = 3.300;
        baseWatt = 6.5;
        clockUnit = 'MB/s';
        specLabelFreq.textContent = 'Active Read IOPS';
        specLabelVolt.textContent = 'NAND Controller V';
        specLabelWatt.textContent = 'Peak Wattage';
      } else { // pc
        baseClock = 5.80;
        baseTemp = 48;
        baseVolt = 12.05;
        baseWatt = 580.0;
        clockUnit = 'GHz';
        specLabelFreq.textContent = 'Composite Clock';
        specLabelVolt.textContent = '12V Rail Phase';
        specLabelWatt.textContent = 'Workstation Tot Draw';
      }
    }
  }

  runTelemetryTick();
}

/* ----- INITIALIZE CORE SIMULATOR ----- */
function initializeTelemetrySimulator() {
  const barPool = document.getElementById('telemetry-bar-pool');
  if (!barPool) return;

  // Build the 24 P-Cores physical threads bars statically first
  let barsHtml = '';
  for (let i = 0; i < 24; i++) {
    barsHtml += `<div class="matrix-bar-col"></div>`;
  }
  barPool.innerHTML = barsHtml;

  // Activate fluctuating ticks
  runTelemetryTick();
  telemetryInterval = setInterval(runTelemetryTick, 1400);
}

/* ----- SINGLE MONITORING TEMPERATURE & LOAD FLUX TICK ---- */
function runTelemetryTick() {
  if (isBenchmarking) return; // Stress test controls loads dynamically

  const loadLabel = document.getElementById('telemetry-load-val');
  const freqLabel = document.getElementById('telemetry-freq-val');
  const tempLabel = document.getElementById('telemetry-temp-val');
  const voltLabel = document.getElementById('telemetry-volt-val');
  const wattLabel = document.getElementById('telemetry-watt-val');
  const barElements = document.querySelectorAll('.matrix-bar-col');

  if (!loadLabel || !freqLabel || !tempLabel) return;

  // Simulate active load base bounds
  const activeLoad = Math.floor(14 + Math.random() * 18); // 14-32% idle fluctuation

  // Overclock scaling math
  const finalFreqMultiplier = 1 + (overclockMultiplier * 0.015);
  const activeFreq = (baseClock * finalFreqMultiplier).toFixed(2);

  const thermalFactor = 1 + (overclockMultiplier * 0.025);
  let activeTemp = Math.floor(baseTemp * thermalFactor);

  if (coolingBoostActive) {
    activeTemp = Math.max(28, activeTemp - 25);
  }

  const activeVolt = (baseVolt * (1 + overclockMultiplier * 0.007)).toFixed(3);
  const activeWatt = (baseWatt * (1 + overclockMultiplier * 0.035)).toFixed(1);

  // Deploy text bounds
  loadLabel.textContent = `${activeLoad}%`;
  freqLabel.textContent = `${activeFreq} ${clockUnit}`;
  tempLabel.textContent = `${activeTemp}°C`;
  if (voltLabel) voltLabel.textContent = `${activeVolt} V`;
  if (wattLabel) wattLabel.textContent = `${activeWatt} W`;

  // Thermal limit alarm dispatching
  const alarmBanner = document.getElementById('overheat-alarm-banner');
  if (activeTemp >= 80) {
    tempLabel.className = 'temp-alert-hot';
    loadLabel.className = 'load-alert-purple';
    if (alarmBanner) alarmBanner.classList.add('d-block');
  } else if (activeTemp >= 62) {
    tempLabel.className = 'temp-alert-mid';
    loadLabel.className = 'load-alert-yellow';
    if (alarmBanner) alarmBanner.classList.remove('d-block');
  } else {
    tempLabel.className = 'temp-alert-nominal';
    loadLabel.className = 'load-alert-green';
    if (alarmBanner) alarmBanner.classList.remove('d-block');
  }

  // Bar matrix fluctuating updates
  barElements.forEach(bar => {
    // Thread specific load divergence
    const coreLoadBias = Math.max(5, Math.min(100, activeLoad + Math.floor(-10 + Math.random() * 20)));
    bar.style.setProperty('--bar-height', `${coreLoadBias}%`);
    
    bar.className = 'matrix-bar-col';
    if (coreLoadBias >= 75) {
      bar.classList.add('high-load');
    } else if (coreLoadBias >= 45) {
      bar.classList.add('warning-load');
    } else {
      bar.classList.add('normal-load');
    }
  });
}

/* ----- STRESS TEST BENCHMARK FLOW ----- */
function requestPhysicalBenchmark() {
  if (isBenchmarking) return;
  isBenchmarking = true;

  const btn = document.getElementById('benchmark-trigger-btn');
  const badge = document.getElementById('terminal-badge');
  const activeCoreName = document.getElementById('active-core-name-display').textContent;

  if (btn) btn.disabled = true;
  if (badge) {
    badge.textContent = 'STRESS_TESTING';
    badge.className = 'benchmark-badge-stressing';
  }

  writeTerminalLog(`[BENCH] ============================================`);
  writeTerminalLog(`[BENCH] LAUNCHING COMPREHENSIVE SILICON Workload Test...`);
  writeTerminalLog(`[BENCH] Focus target pipeline: ${activeCoreName}`);

  let step = 0;
  const stages = [
    () => {
      writeTerminalLog(`[BENCH] Stage 1/4: Injecting float vector workload threads...`);
      tiltMeterBarHeights(85);
    },
    () => {
      writeTerminalLog(`[BENCH] Stage 2/4: Saturating cache buses and memory registries...`);
      tiltMeterBarHeights(95);
    },
    () => {
      writeTerminalLog(`[BENCH] Stage 3/4: Inspecting timing parameters under +1.48V voltage override...`, true);
      tiltMeterBarHeights(100);
    },
    () => {
      // Calculate final composite score
      let multiplier = currentCategory === 'cpu' ? 45000 : currentCategory === 'gpu' ? 112000 : currentCategory === 'ram' ? 38000 : 18000;
      const ocAdrenaline = Math.floor(overclockMultiplier * 1.5 * (multiplier * 0.01));
      const thermalLoss = coolingBoostActive ? 0 : Math.floor(overclockMultiplier * 0.18 * (multiplier * 0.01));
      const compositeScore = Math.floor(multiplier + ocAdrenaline - thermalLoss);

      writeTerminalLog(`[BENCH] Workload metrics successfully evaluated with zero gate violations.`);
      writeTerminalLog(`[BENCH] STRESS SCORE MATRIX: ${compositeScore.toLocaleString()} GigaOps/Sec compiled.`);
      writeTerminalLog(`[BENCH] BENCHMARK COMPILATION SUCCEEDED WITH STABLE SIGNATURE.`);
    }
  ];

  function runSequences() {
    if (step < stages.length) {
      stages[step]();
      step++;
      
      const loadLabel = document.getElementById('telemetry-load-val');
      if (loadLabel) {
        loadLabel.textContent = `${92 + Math.floor(Math.random() * 9)}%`;
        loadLabel.className = 'temp-alert-hot';
      }
      setTimeout(runSequences, 1000);
    } else {
      isBenchmarking = false;
      if (btn) btn.disabled = false;
      if (badge) {
        badge.textContent = 'SYS IDLE';
        badge.className = 'benchmark-badge-idle';
      }
      writeTerminalLog(`[BENCH] Cores returned to nominal cooling operations.`);
      runTelemetryTick();
    }
  }

  runSequences();
}

function tiltMeterBarHeights(fixedLoad) {
  const barElements = document.querySelectorAll('.matrix-bar-col');
  barElements.forEach(bar => {
    const randomized = Math.min(100, Math.max(80, fixedLoad + Math.floor(-5 + Math.random() * 10)));
    bar.style.setProperty('--bar-height', `${randomized}%`);
    bar.className = 'matrix-bar-col';
    if (randomized >= 90) {
      bar.classList.add('high-load');
    } else {
      bar.classList.add('warning-load');
    }
  });
}

/* ----- RUN SPECIFIC REGISTRY PRODUCT TEST ----- */
function runLocalProductDiagnostic(id, productName, category) {
  writeTerminalLog(`[DIAG] ============================================`);
  writeTerminalLog(`[DIAG] Initiated localized self-test query: ${productName.toUpperCase()}`);
  writeTerminalLog(`[DIAG] Probing address lines on SKU Node #${id}...`);

  setTimeout(() => {
    writeTerminalLog(`[DIAG] Verifying physical micro-clock integrity... STATUS: PEAK NOMINAL`);
  }, 600);

  setTimeout(() => {
    writeTerminalLog(`[DIAG] Running logical cell cache sweeps on category [${category.toUpperCase()}]`);
  }, 1200);

  setTimeout(() => {
    const trackingCode = `SECURE-HW-${id}-${10 + (id * 13) % 89}-${category.toUpperCase()}`;
    writeTerminalLog(`[DIAG] Success: Component firmware verified. Hardware signature: ${trackingCode}`);
    writeTerminalLog(`[DIAG] TELEMETRY DIAGNOSTIC PASS: Component is healthy.`);
  }, 1800);
}

/* ----- RENDERING HISTORIC ORDER LOGS ----- */
function renderHistoricalLogs() {
  const tableBody = document.getElementById('user-order-table');
  if (!tableBody) return;

  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];

  // Update dynamic metric indicator if present on screen
  const statsDispatchEl = document.getElementById('stats-dispatch-count');
  if (statsDispatchEl) {
    statsDispatchEl.textContent = `${orders.length} ${orders.length === 1 ? 'ACTIVE DISPATCH' : 'ACTIVE DISPATCHES'}`;
  }

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="user-order-table-empty">
          Telemetry dispatch logs are clean. No historic allocations found.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  orders.forEach(ord => {
    // Determine status text & class
    const rawStatus = ord.status || 'Completed';
    let statusClass = 'completed';
    let displayStatus = 'Acknowledged';

    if (rawStatus.toLowerCase() === 'pending' || rawStatus.toLowerCase() === 'pending link') {
      statusClass = 'pending';
      displayStatus = 'Pending Link';
    } else if (rawStatus.toLowerCase() === 'shipping' || rawStatus.toLowerCase() === 'out for route') {
      statusClass = 'shipping';
      displayStatus = 'Out for Route';
    }

    html += `
      <tr class="user-order-table-row">
        <td class="user-order-table-id">#${ord.id}</td>
        <td class="user-order-table-items">${ord.items}</td>
        <td class="user-order-table-date">${ord.date}</td>
        <td class="user-order-table-cost">$${parseFloat(ord.cost).toFixed(2)}</td>
        <td class="user-order-table-badge">
          <span class="status-badge ${statusClass}">${displayStatus}</span>
        </td>
        <td class="user-order-table-controls">
          <div class="user-admin-actions-flex">
            <button onclick="editUserOrder('${ord.id}')" class="btn-submit user-order-table-btn-edit" title="Rewrite details">
              Rewrite
            </button>
            <button onclick="deleteUserOrder('${ord.id}')" class="btn-submit user-order-table-btn-delete" title="Wipe telemetry node">
              Wipe
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

/* ----- CREATE: USER CREATES AN ORDER ----- */
function handleUserCreateOrder() {
  const contentsInput = document.getElementById('user-order-contents');
  const costInput = document.getElementById('user-order-cost');
  const statusSelect = document.getElementById('user-order-status');

  if (!contentsInput || !costInput || !statusSelect) return;

  const contents = contentsInput.value.trim();
  const cost = parseFloat(costInput.value);
  const status = statusSelect.value;
  
  if (!contents) return;

  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];

  const newOrder = {
    id: Date.now().toString().slice(-6), // clean 6-digit numeric id
    items: contents,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    cost: cost,
    status: status,
    items_raw: [
      {
        id: Math.floor(Math.random() * 1000) + 500,
        name: contents,
        price: cost,
        category: contents.toLowerCase().includes('gpu') ? 'gpu' : contents.toLowerCase().includes('ram') ? 'ram' : contents.toLowerCase().includes('storage') ? 'storage' : 'cpu',
        image: ''
      }
    ]
  };

  orders.push(newOrder);
  localStorage.setItem('noLag_orders', JSON.stringify(orders));

  // Reset Form inputs
  contentsInput.value = '';
  costInput.value = '450.00';
  
  // Re-trigger re-renders
  renderHistoricalLogs();
  populateSourceSelector();
  renderAcquiredRegistryUI();
  
  writeTerminalLog(`[LEDGER] Created new silicon core order #${newOrder.id} successfully.`);
}

/* ----- DYNAMIC CUSTOM MODALS FOR IFRAME COMPATIBILITY ----- */
function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function openCustomConfirmModal(title, text, confirmBtnText, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'custom-modal-overlay';

  const modalBox = document.createElement('div');
  modalBox.className = 'admin-confirm-modal-box';

  modalBox.innerHTML = `
    <div class="modal-flex-header">
      <div class="modal-danger-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
      </div>
      <div>
        <h4 class="modal-title-confirm">${title}</h4>
        <p class="modal-desc-confirm">${text}</p>
      </div>
    </div>
    <div class="modal-actions-confirm">
      <button id="modal-cancel-btn" class="modal-btn-abort">
        Abort
      </button>
      <button id="modal-confirm-btn" class="modal-btn-confirm">
        ${confirmBtnText}
      </button>
    </div>
  `;

  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.className = 'custom-modal-overlay d-none';
    setTimeout(() => { overlay.remove(); }, 150);
  };

  overlay.querySelector('#modal-cancel-btn').onclick = closeModal;
  overlay.querySelector('#modal-confirm-btn').onclick = () => {
    onConfirm();
    closeModal();
  };
}

function openCustomEditModal(title, initialItems, initialCost, initialStatus, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'custom-modal-overlay';

  const modalBox = document.createElement('div');
  modalBox.className = 'admin-edit-modal-box';

  modalBox.innerHTML = `
    <div class="modal-header-edit">
      <span class="modal-prefix-edit">REWRITE METADATA NODE</span>
      <h4 class="modal-title-edit">${title}</h4>
    </div>
    
    <form id="custom-modal-form" class="modal-form-edit">
      <div>
        <label class="modal-label-edit">Silicon Architecture Contents:</label>
        <input type="text" id="edit-modal-items" class="modal-input-edit" value="${escapeHTML(initialItems)}" required>
      </div>

      <div class="modal-2col-grid-edit">
        <div>
          <label class="modal-label-edit">MSRP Toll ($ USD):</label>
          <input type="number" id="edit-modal-cost" class="modal-input-edit" value="${parseFloat(initialCost).toFixed(2)}" step="0.01" required>
        </div>
        <div>
          <label class="modal-label-edit">Pipeline Status:</label>
          <select id="edit-modal-status" class="modal-select-edit">
            <option value="Completed" ${initialStatus === 'Completed' || initialStatus === 'Acknowledged' ? 'selected' : ''}>Acknowledged</option>
            <option value="Pending" ${initialStatus === 'Pending' || initialStatus === 'Pending Link' ? 'selected' : ''}>Pending Link</option>
            <option value="Shipping" ${initialStatus === 'Shipping' || initialStatus === 'Out for Route' ? 'selected' : ''}>Out for Route</option>
          </select>
        </div>
      </div>

      <div class="modal-actions-edit">
        <button type="button" id="edit-modal-cancel" class="modal-btn-abort-edit">
          Abort
        </button>
        <button type="submit" class="modal-btn-save-edit">
          Save Protocols
        </button>
      </div>
    </form>
  `;

  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.className = 'custom-modal-overlay d-none';
    setTimeout(() => { overlay.remove(); }, 150);
  };

  overlay.querySelector('#edit-modal-cancel').onclick = closeModal;
  overlay.querySelector('#custom-modal-form').onsubmit = (e) => {
    e.preventDefault();
    const newItems = overlay.querySelector('#edit-modal-items').value.trim();
    const newCost = parseFloat(overlay.querySelector('#edit-modal-cost').value);
    const newStatus = overlay.querySelector('#edit-modal-status').value;
    
    if (newItems) {
      onSave(newItems, newCost, newStatus);
    }
    closeModal();
  };
}

/* ----- DELETE: USER DELETES AN ORDER ----- */
function deleteUserOrder(orderId) {
  openCustomConfirmModal(
    'Retract Silicon dispatch',
    `Are you sure you want to retract and completely wipe Dispatch Order #${orderId} from telemetry tracking systems? This operation cannot be undone.`,
    'Retract hardware',
    () => {
      const rawOrders = localStorage.getItem('noLag_orders');
      let orders = rawOrders ? JSON.parse(rawOrders) : [];
      
      orders = orders.filter(o => o.id.toString() !== orderId.toString());
      localStorage.setItem('noLag_orders', JSON.stringify(orders));

      // Re-trigger re-renders
      renderHistoricalLogs();
      populateSourceSelector();
      renderAcquiredRegistryUI();

      writeTerminalLog(`[LEDGER] Retracted Dispatch Order #${orderId} from tracking registers.`);
    }
  );
}

/* ----- UPDATE: USER EDITS AN ORDER ----- */
function editUserOrder(orderId) {
  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];
  
  const ordIndex = orders.findIndex(o => o.id.toString() === orderId.toString());
  if (ordIndex === -1) return;

  const ord = orders[ordIndex];

  openCustomEditModal(
    `Order Details #${orderId}`,
    ord.items,
    ord.cost,
    ord.status || 'Completed',
    (newItems, newCost, newStatus) => {
      // Save updates
      ord.items = newItems;
      ord.cost = isNaN(newCost) ? ord.cost : newCost;
      ord.status = newStatus;

      // Make sure items_raw adapts name and price too!
      if (ord.items_raw && ord.items_raw[0]) {
        ord.items_raw[0].name = ord.items;
        ord.items_raw[0].price = ord.cost;
      } else {
        ord.items_raw = [
          {
            id: Math.floor(Math.random() * 1000) + 500,
            name: ord.items,
            price: ord.cost,
            category: ord.items.toLowerCase().includes('gpu') ? 'gpu' : ord.items.toLowerCase().includes('ram') ? 'ram' : ord.items.toLowerCase().includes('storage') ? 'storage' : 'cpu',
            image: ''
          }
        ];
      }

      orders[ordIndex] = ord;
      localStorage.setItem('noLag_orders', JSON.stringify(orders));

      // Re-trigger re-renders
      renderHistoricalLogs();
      populateSourceSelector();
      renderAcquiredRegistryUI();

      writeTerminalLog(`[LEDGER] Local Core Protocol changes saved on #${orderId}.`);
    }
  );
}

/* ----- LOGOUT SECTOR DISCONNECTION ----- */
function logoutPilot() {
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('role');
  window.location.href = '../index.html';
}

/* ----- SVG FALLBACK ENGINE ----- */
function renderHardwareSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" class="text-cyber-purple" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </svg>
  `;
}

// Clean simulator intervals on tab unload / switches
window.addEventListener('beforeunload', () => {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
  }
});

// Expose user dashboard functions globally for inline HTML event handlers
window.toggleCoolingState = toggleCoolingState;
window.requestPhysicalBenchmark = requestPhysicalBenchmark;
window.handleUserCreateOrder = handleUserCreateOrder;
window.editUserOrder = editUserOrder;
window.deleteUserOrder = deleteUserOrder;
window.logoutPilot = logoutPilot;
window.switchTelemetrySource = switchTelemetrySource;
window.runLocalProductDiagnostic = runLocalProductDiagnostic;
window.updateOverclockFactor = updateOverclockFactor;


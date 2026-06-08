/* ==========================================================================
   NO LAG — ELITE PC HARDWARE HUB
   ADMIN CONTROLLER OPERATIONS (admin.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderAdminInventory();
  renderAdminIntercepts();
  renderAdminOrders();
});

/* ----- RETRIEVE PRODUCT RECORDS SYSTEM ----- */
function getProducts() {
  const rawProducts = localStorage.getItem('noLag_products');
  return rawProducts ? JSON.parse(rawProducts) : [];
}

function saveProducts(prods) {
  localStorage.setItem('noLag_products', JSON.stringify(prods));
  renderAdminInventory();
  
  // Try to re-render products page catalog if we are inside products.html
  if (typeof renderProductsCatalog === 'function') {
    renderProductsCatalog();
  }
}

/* ----- SKU REGISTRATION FORGE (ADD RECORD) ----- */
function handleAdminAddProduct(event) {
  event.preventDefault();
  
  const nameEl = document.getElementById('admin-prod-name');
  const catEl = document.getElementById('admin-prod-category');
  const priceEl = document.getElementById('admin-prod-price');
  const imgEl = document.getElementById('admin-prod-image');
  const spec1Name = document.getElementById('admin-spec1-name');
  const spec1Val = document.getElementById('admin-spec1-val');
  const spec2Name = document.getElementById('admin-spec2-name');
  const spec2Val = document.getElementById('admin-spec2-val');
  
  if (!nameEl || !catEl || !priceEl) return;
  
  const name = nameEl.value.trim();
  const category = catEl.value.trim();
  const price = parseFloat(priceEl.value);
  let image = imgEl ? imgEl.value.trim() : '';

  // Fallback styling / standard images if empty
  if (!image) {
    const lowerCat = category.toLowerCase();
    let imgName = 'PC.png';
    if (lowerCat === 'cpu') imgName = 'CPU.png';
    else if (lowerCat === 'gpu') imgName = 'GPU.png';
    else if (lowerCat === 'ram') imgName = 'Ram.png';
    else if (lowerCat === 'storage') imgName = 'ROM.png';
    else if (lowerCat === 'pc') imgName = 'PC.png';
    image = `assets/images/${imgName}`;
  }

  const products = getProducts();
  const newProduct = {
    id: Date.now(),
    name,
    price,
    category: category.toLowerCase(),
    image,
    specs: {}
  };

  // Add specs if configured
  if (spec1Name && spec1Val) {
    newProduct.specs[spec1Name.value.trim() || "Clock Efficiency"] = `${spec1Val.value} / 6 Rating`;
  }
  if (spec2Name && spec2Val) {
    newProduct.specs[spec2Name.value.trim() || "Thermal Overhead"] = `${spec2Val.value} / 6 Rating`;
  }

  products.push(newProduct);
  saveProducts(products);

  // Clear inputs
  nameEl.value = '';
  priceEl.value = '';
  if (imgEl) imgEl.value = '';

  triggerAdminStatusAlert("SKU record generated and registered in inventory database.", "success");
}

/* ----- DELETE PRODUCT SKU ----- */
function deleteProductAdmin(id) {
  let products = getProducts();
  products = products.filter(p => Number(p.id) !== Number(id));
  saveProducts(products);
  triggerAdminStatusAlert("SKU liquidation complete. Inventory database synchronized.", "success");
  renderAdminInventory();
}

/* ----- RENDER ADMINISTRATIVE DATA TABLE ----- */
function renderAdminInventory() {
  const tableBody = document.getElementById('admin-inventory-table');
  const totalSkuLabel = document.getElementById('admin-sku-total');
  if (!tableBody) return;

  const products = getProducts();

  if (totalSkuLabel) {
    totalSkuLabel.textContent = `${products.length} SKUs`;
  }

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="admin-table-empty">
          No registered assets found inside physical silicon inventory.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  products.forEach(p => {
    html += `
      <tr>
        <td class="admin-table-cell-mono-lg">#${p.id}</td>
        <td class="admin-table-cell-bold-white-lg">${p.name}</td>
        <td class="admin-table-cell-category">${p.category}</td>
        <td class="admin-table-cell-price">$${p.price.toFixed(2)}</td>
        <td class="admin-table-cell-right-lg">
          <button onclick="deleteProductAdmin(${p.id})" class="btn-admin-delete">Liquidate</button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

/* ----- FEED COMMUNICATIONS DISCLOSURES ----- */
function renderAdminIntercepts() {
  const msgContainer = document.getElementById('admin-messages-list');
  if (!msgContainer) return;

  const rawMsgs = localStorage.getItem('noLag_messages');
  const messages = rawMsgs ? JSON.parse(rawMsgs) : [];

  if (messages.length === 0) {
    msgContainer.innerHTML = `
      <div class="admin-dashed-empty-box">
        Secure Uplink communications matrix is clean. No signals intercepted.
      </div>
    `;
    return;
  }

  let html = '';
  messages.forEach((msg, index) => {
    html += `
      <div class="message-node">
        <div class="message-node-header">
          <span>SIGNAL NODE #${index + 1}</span>
          <span>${msg.date || "TIMESTAMP SECURE"}</span>
        </div>
        <div class="admin-meta-info-subtext">
          Call Sign: <b class="message-node-sender">${escapeHTML(msg.name)}</b> 
          (${escapeHTML(msg.email)})
        </div>
        <div class="message-node-subject">Route: ${escapeHTML(msg.type)}</div>
        <div class="message-node-body">"${escapeHTML(msg.message)}"</div>
      </div>
    `;
  });

  msgContainer.innerHTML = html;
}

/* ----- CLEAR ENTIRE MESSAGES QUEUE ----- */
function clearAllMessages() {
  localStorage.setItem('noLag_messages', JSON.stringify([]));
  renderAdminIntercepts();
  triggerAdminStatusAlert("Interception feed cache cleared successfully.", "success");
}

/* ----- STATUS ALERT HANDLERS ----- */
function triggerAdminStatusAlert(message, type) {
  const alertEl = document.getElementById('admin-form-status');
  if (!alertEl) return;

  alertEl.textContent = message;
  alertEl.className = 'admin-status-box'; // reset

  if (type === 'success') {
    alertEl.classList.add('success');
  } else {
    alertEl.classList.add('error');
  }

  alertEl.classList.add('d-block');

  setTimeout(() => {
    alertEl.classList.remove('d-block');
  }, 4000);
}

/* ----- UTILITIES ----- */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/* ----- RENDER ADMIN ORDERS (READ) ----- */
function renderAdminOrders() {
  const tableBody = document.getElementById('admin-orders-table');
  const countLabel = document.getElementById('admin-orders-total');
  if (!tableBody) return;

  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];

  if (countLabel) {
    countLabel.textContent = `${orders.length} Orders`;
  }

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="admin-table-empty-small">
          No active dispatched hardware orders inside tracking registers.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  orders.forEach(ord => {
    const rawStatus = ord.status || 'Completed';
    let statusClass = 'status-color-green';
    let statusText = 'Acknowledged';

    if (rawStatus.toLowerCase() === 'pending' || rawStatus.toLowerCase() === 'pending link') {
      statusClass = 'status-color-yellow';
      statusText = 'Pending Link';
    } else if (rawStatus.toLowerCase() === 'shipping' || rawStatus.toLowerCase() === 'out for route') {
      statusClass = 'status-color-purple';
      statusText = 'Out for Route';
    }

    html += `
      <tr>
        <td class="admin-table-cell-mono">#${ord.id}</td>
        <td class="admin-table-cell-bold-white" title="${escapeHTML(ord.items)}">${escapeHTML(ord.items)}</td>
        <td class="admin-table-cell-mono ${statusClass}">${statusText}</td>
        <td class="admin-table-cell-price-sm">$${parseFloat(ord.cost).toFixed(2)}</td>
        <td class="admin-table-cell-right">
          <div class="admin-flex-end-row">
            <button onclick="editAdminOrder('${ord.id}')" class="btn-admin-delete admin-btn-modify">Modify</button>
            <button onclick="deleteAdminOrder('${ord.id}')" class="btn-admin-delete admin-btn-delete-small">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

/* ----- CREATE ADMIN ORDER ----- */
function handleAdminAddOrder() {
  const itemsEl = document.getElementById('admin-order-items');
  const priceEl = document.getElementById('admin-order-price');
  const statusEl = document.getElementById('admin-order-status');

  if (!itemsEl || !priceEl || !statusEl) return;

  const itemsName = itemsEl.value.trim();
  const price = parseFloat(priceEl.value);
  const status = statusEl.value;

  if (!itemsName) return;

  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];

  const newOrder = {
    id: Date.now().toString().slice(-6), // Clean 6-digit order ID
    items: itemsName,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    cost: price,
    status: status,
    items_raw: [
      {
        id: Math.floor(Math.random() * 1000) + 1000,
        name: itemsName,
        price: price,
        category: itemsName.toLowerCase().includes('gpu') ? 'gpu' : itemsName.toLowerCase().includes('ram') ? 'ram' : itemsName.toLowerCase().includes('storage') ? 'storage' : 'cpu',
        image: ''
      }
    ]
  };

  orders.push(newOrder);
  localStorage.setItem('noLag_orders', JSON.stringify(orders));

  // Reset inputs
  itemsEl.value = '';
  priceEl.value = '450.00';

  renderAdminOrders();
  triggerAdminStatusAlert("Administrative dispatch order was successfully compiled.", "success");
}

/* ----- DYNAMIC CUSTOM MODALS FOR IFRAME COMPATIBILITY ----- */
function openCustomConfirmModal(title, text, confirmBtnText, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'custom-modal-overlay';

  const modalBox = document.createElement('div');
  modalBox.className = 'admin-confirm-modal-box';

  modalBox.innerHTML = `
    <div class="admin-info-box">
      <div class="admin-alert-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
      </div>
      <div>
        <h4 class="admin-modal-title">${title}</h4>
        <p class="admin-modal-desc">${text}</p>
      </div>
    </div>
    <div class="admin-modal-footer">
      <button id="modal-cancel-btn" class="admin-modal-cancel-btn">
        Abort
      </button>
      <button id="modal-confirm-btn" class="admin-modal-confirm-btn">
         ${confirmBtnText}
      </button>
    </div>
  `;

  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.classList.add('hidden-el');
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
    <div class="admin-edit-modal-header">
      <span class="admin-edit-modal-subtitle">REWRITE METADATA NODE (ADMIN)</span>
      <h4 class="admin-edit-modal-title">${title}</h4>
    </div>
    
    <form id="custom-modal-form" class="admin-edit-modal-form">
      <div>
        <label class="admin-edit-modal-label">Silicon Architecture Contents:</label>
        <input type="text" id="edit-modal-items" class="admin-edit-modal-input" value="${escapeHTML(initialItems)}" required>
      </div>

      <div class="admin-edit-modal-grid-cols">
        <div>
          <label class="admin-edit-modal-label">MSRP Toll ($ USD):</label>
          <input type="number" id="edit-modal-cost" class="admin-edit-modal-input" value="${parseFloat(initialCost).toFixed(2)}" step="0.01" required>
        </div>
        <div>
          <label class="admin-edit-modal-label">Pipeline Status:</label>
          <select id="edit-modal-status" class="admin-edit-modal-select">
            <option value="Completed" ${initialStatus === 'Completed' || initialStatus === 'Acknowledged' ? 'selected' : ''}>Acknowledged</option>
            <option value="Pending" ${initialStatus === 'Pending' || initialStatus === 'Pending Link' ? 'selected' : ''}>Pending Link</option>
            <option value="Shipping" ${initialStatus === 'Shipping' || initialStatus === 'Out for Route' ? 'selected' : ''}>Out for Route</option>
          </select>
        </div>
      </div>

      <div class="admin-edit-modal-footer">
        <button type="button" id="edit-modal-cancel" class="admin-edit-modal-cancel">
          Abort
        </button>
        <button type="submit" class="admin-edit-modal-submit">
          Save Protocols
        </button>
      </div>
    </form>
  `;

  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.classList.add('hidden-el');
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

/* ----- UPDATE ADMIN ORDER ----- */
function editAdminOrder(id) {
  const rawOrders = localStorage.getItem('noLag_orders');
  const orders = rawOrders ? JSON.parse(rawOrders) : [];

  const ordIndex = orders.findIndex(o => o.id.toString() === id.toString());
  if (ordIndex === -1) return;

  const ord = orders[ordIndex];

  openCustomEditModal(
    `Order Details #${id}`,
    ord.items,
    ord.cost,
    ord.status || 'Completed',
    (newItems, newCost, newStatus) => {
      // Save changes
      ord.items = newItems;
      ord.cost = isNaN(newCost) ? ord.cost : newCost;
      ord.status = newStatus;

      // Sync to sub-items
      if (ord.items_raw && ord.items_raw[0]) {
        ord.items_raw[0].name = ord.items;
        ord.items_raw[0].price = ord.cost;
      }

      orders[ordIndex] = ord;
      localStorage.setItem('noLag_orders', JSON.stringify(orders));

      renderAdminOrders();
      triggerAdminStatusAlert(`Dispatch Order #${id} configurations rewritten.`, "success");
    }
  );
}

/* ----- DELETE ADMIN ORDER ----- */
function deleteAdminOrder(id) {
  openCustomConfirmModal(
    'Delete Administrative Dispatch',
    `Are you sure you want to permanently delete Dispatch Order #${id} from the central coordination registry? This is irreversible.`,
    'Delete Order',
    () => {
      const rawOrders = localStorage.getItem('noLag_orders');
      let orders = rawOrders ? JSON.parse(rawOrders) : [];

      orders = orders.filter(o => o.id.toString() !== id.toString());
      localStorage.setItem('noLag_orders', JSON.stringify(orders));

      renderAdminOrders();
      triggerAdminStatusAlert(`Dispatch Order #${id} has been wiped.`, "success");
    }
  );
}

// Expose admin interaction functions globally to support inline HTML onclick handlers
window.handleAdminAddProduct = handleAdminAddProduct;
window.deleteProductAdmin = deleteProductAdmin;
window.handleAdminAddOrder = handleAdminAddOrder;
window.editAdminOrder = editAdminOrder;
window.deleteAdminOrder = deleteAdminOrder;
window.clearAllMessages = clearAllMessages;


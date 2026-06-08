/* ==========================================================================
   NO LAG — ELITE PC HARDWARE HUB
   STATE TRANSACTIONAL CORE (cart.js)
   ========================================================================== */

const isCartSubFolder = window.location.pathname.includes('/pages/');
const cartPathPrefix = isCartSubFolder ? '../' : './';

function resolveCartImagePath(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/^(\.\.\/|\.\/|.*?assets\/images\/)/, '');
  return cartPathPrefix + 'assets/images/' + cleanPath;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartDrawer();
  updateHeaderCartBadge();
  
  // If we are on the main dedicated cart screen, render its main body too
  if (document.getElementById('cart-page-body')) {
    renderCartPage();
  }
});

/* ----- RETRIEVE CART OR INITIALIZE ----- */
function getCartState() {
  const rawCart = localStorage.getItem('noLag_cart');
  return rawCart ? JSON.parse(rawCart) : [];
}

function saveCartState(cart) {
  localStorage.setItem('noLag_cart', JSON.stringify(cart));
  updateHeaderCartBadge();
  renderCartDrawer();
  
  if (document.getElementById('cart-page-body')) {
    renderCartPage();
  }
}

/* ----- ADD COMPONENT TO HARDWARE QUEUE ----- */
function addHardwareToCart(productId) {
  const products = JSON.parse(localStorage.getItem('noLag_products') || '[]');
  const matchedProduct = products.find(p => Number(p.id) === Number(productId));

  if (!matchedProduct) return;

  const cart = getCartState();
  const existingItem = cart.find(item => Number(item.id) === Number(productId));

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: matchedProduct.id,
      name: matchedProduct.name,
      price: matchedProduct.price,
      image: matchedProduct.image,
      qty: 1
    });
  }

  saveCartState(cart);
  toggleCartDrawer(true);
}

/* ----- CHANGE COMPONENT QUANTITY ----- */
function updateCartQty(productId, delta) {
  let cart = getCartState();
  const existingItem = cart.find(item => Number(item.id) === Number(productId));

  if (!existingItem) return;

  existingItem.qty += delta;

  if (existingItem.qty <= 0) {
    cart = cart.filter(item => Number(item.id) !== Number(productId));
  }

  saveCartState(cart);
}

/* ----- REMOVE ENTIRE ITEM ----- */
function deleteCartItem(productId) {
  let cart = getCartState();
  cart = cart.filter(item => Number(item.id) !== Number(productId));
  saveCartState(cart);
}

/* ----- PRICE COMPUTATION SYSTEM ----- */
function computePrices(cart) {
  const subtotal = cart.reduce((accum, item) => accum + (item.price * item.qty), 0);
  const taxRate = 0.0825; // 8.25% National Toll
  const tax = subtotal * taxRate;
  
  // Logistics Deliveries - Free over $1000, else $25
  const shipping = (subtotal === 0 || subtotal >= 1000) ? 0 : 25;
  const total = subtotal + tax + shipping;

  return { subtotal, tax, shipping, total };
}

/* ----- UPDATE BADGE INDICATOR ----- */
function updateHeaderCartBadge() {
  const cart = getCartState();
  const totalQty = cart.reduce((accum, item) => accum + item.qty, 0);
  const badge = document.getElementById('header-cart-count');

  if (badge) {
    if (totalQty > 0) {
      badge.textContent = totalQty;
      badge.classList.remove('hidden-el');
    } else {
      badge.classList.add('hidden-el');
    }
  }
}

/* ----- TOGGLE CART DRAWER SLIDE ----- */
function toggleCartDrawer(isOpen) {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (backdrop) {
    if (isOpen) {
      backdrop.classList.add('active');
      document.body.classList.add('lock-scroll');
    } else {
      backdrop.classList.remove('active');
      document.body.classList.remove('lock-scroll');
    }
  }
}

/* ----- RENDER CART DRAWER CONTENTS ----- */
function renderCartDrawer() {
  const wrapper = document.getElementById('cart-items-wrapper');
  if (!wrapper) return;

  const cart = getCartState();

  if (cart.length === 0) {
    wrapper.innerHTML = `
      <div class="cart-empty-msg">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-30"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p>Telemetry Queue is completely empty.</p>
        <p class="font-size-md text-silver-gray">Silicon dispatch systems waiting on targets...</p>
      </div>
    `;
    updatePricingDOM(0, 0, 0, 0);
    return;
  }

  let html = '';
  cart.forEach(item => {
    // Generate clean visual svg fallback if PNG has issues loading
    const resolvedCartImg = resolveCartImagePath(item.image);
    const imageString = resolvedCartImg ? `<img src="${resolvedCartImg}" alt="${item.name}" onerror="this.onerror=null; this.parentNode.innerHTML=renderHardwareSVG()"/>` : renderHardwareSVG();

    html += `
      <div class="cart-item">
        <div class="cart-item-image">
          ${imageString}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            <div class="cart-item-qty">
              <button onclick="updateCartQty(${item.id}, -1)" class="qty-btn">-</button>
              <div class="qty-val">${item.qty}</div>
              <button onclick="updateCartQty(${item.id}, 1)" class="qty-btn">+</button>
            </div>
            <button onclick="deleteCartItem(${item.id})" class="cart-item-remove">Delete</button>
          </div>
        </div>
      </div>
    `;
  });

  wrapper.innerHTML = html;

  const { subtotal, tax, shipping, total } = computePrices(cart);
  updatePricingDOM(subtotal, tax, shipping, total);
}

function updatePricingDOM(sub, tx, sh, tot) {
  const subtotalEl = document.getElementById('cart-subtotal');
  const taxEl = document.getElementById('cart-tax');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = `$${sub.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tx.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = sh === 0 ? 'FREE DISPATCH' : `$${sh.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${tot.toFixed(2)}`;

  // Natively update full page cart indicators if present (prevents temporal or ordering errors)
  const pSub = document.getElementById('cart-page-subtotal');
  const pTax = document.getElementById('cart-page-tax');
  const pShipping = document.getElementById('cart-page-shipping');
  const pTotal = document.getElementById('cart-page-total');

  if (pSub) pSub.textContent = `$${sub.toFixed(2)}`;
  if (pTax) pTax.textContent = `$${tx.toFixed(2)}`;
  if (pShipping) pShipping.textContent = sh === 0 ? 'FREE DISPATCH' : `$${sh.toFixed(2)}`;
  if (pTotal) pTotal.textContent = `$${tot.toFixed(2)}`;
}

/* ----- CLEAR ALL SILICON CART QUEUE ITEMS ----- */
function clearCart() {
  saveCartState([]);
}

/* ----- RENDER FULL PAGE VIEW SYSTEM ----- */
function renderCartPage() {
  const pageBody = document.getElementById('cart-page-body');
  if (!pageBody) return;

  const cart = getCartState();

  if (cart.length === 0) {
    pageBody.innerHTML = `
      <div class="cart-empty-msg cart-empty-msg-padded">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon-purple-color mb-12"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p class="font-size-5xl font-weight-bold text-white">No Silicon Assets Configured</p>
        <p class="cart-empty-subtitle">Your engineering procurement logs are clean. Traverse the catalogue to link devices to telemetry pipelines.</p>
        <a href="products.html" class="category-pill active d-inline-block no-underline mt-20">Navigate Component Catalogue</a>
      </div>
    `;
    return;
  }

  let html = '';
  cart.forEach(item => {
    const resolvedCartImg = resolveCartImagePath(item.image);
    const imageHTML = resolvedCartImg ? `<img src="${resolvedCartImg}" alt="${item.name}" onerror="this.onerror=null; this.parentNode.innerHTML=renderHardwareSVG()"/>` : renderHardwareSVG();

    html += `
      <div class="cart-page-item">
        <div class="cart-page-item-info">
          <div class="cart-page-item-img">
            ${imageHTML}
          </div>
          <div class="cart-page-item-details">
            <span class="cart-page-item-tag">CHASSIS CORE MODULE</span>
            <span class="cart-page-item-title">${item.name}</span>
            <span class="font-size-lg text-silver-gray">MSRP Unit price: $${item.price.toFixed(2)}</span>
          </div>
        </div>
        <div class="cart-page-item-controls">
          <div class="cart-item-qty cart-page-item-qty">
            <button onclick="updateCartQty(${item.id}, -1)" class="qty-btn cart-page-qty-btn">-</button>
            <div class="qty-val cart-page-qty-val">${item.qty}</div>
            <button onclick="updateCartQty(${item.id}, 1)" class="qty-btn cart-page-qty-btn">+</button>
          </div>
          <div class="cart-price-sum">$${(item.price * item.qty).toFixed(2)}</div>
          <button onclick="deleteCartItem(${item.id})" class="btn-admin-delete cart-page-item-erase-btn">Erase SKU</button>
        </div>
      </div>
    `;
  });

  pageBody.innerHTML = html;
}

/* ----- INITIALISE TRANSACTIONAL CHECKOUT PROTOCOL ----- */
function triggerCheckout() {
  const cart = getCartState();
  if (cart.length === 0) return;

  const { subtotal, tax, shipping, total } = computePrices(cart);
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  // Log inside database orders
  const orders = JSON.parse(localStorage.getItem('noLag_orders') || '[]');
  const orderRecord = {
    id: orderId,
    items: cart.map(item => `${item.name} (x${item.qty})`).join(', '),
    items_raw: cart,
    date: new Date().toISOString().split('T')[0],
    cost: total.toFixed(2),
    status: 'completed'
  };

  orders.unshift(orderRecord);
  localStorage.setItem('noLag_orders', JSON.stringify(orders));

  // Clear local cart
  localStorage.setItem('noLag_cart', JSON.stringify([]));
  updateHeaderCartBadge();
  renderCartDrawer();
  if (document.getElementById('cart-page-body')) {
    renderCartPage();
  }

  // Double trigger visual model overlays
  openCheckoutSuccessModal(orderId, total);
}

function openCheckoutSuccessModal(id, totalCost) {
  const modal = document.getElementById('checkout-success-modal');
  const receiptEl = document.getElementById('sc-receipt-id');
  const totalValEl = document.getElementById('sc-total-val');

  if (modal && receiptEl && totalValEl) {
    receiptEl.textContent = id;
    totalValEl.textContent = `$${totalCost.toFixed(2)}`;
    modal.classList.remove('hidden-by-privacy');
    modal.classList.add('active');
    modal.classList.remove('hidden-el');
    modal.classList.remove('d-none');
  } else {
    // If not in standard page layout, log safely (avoid browser blocking alert inside iframes)
    console.info(`[CHECKOUT] SILICON DEPLOYED SUCCESSFULLY! Receipt: ${id}, Amount: $${totalCost.toFixed(2)}`);
  }
}

function closeCheckoutSuccess() {
  const modal = document.getElementById('checkout-success-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden-el');
    modal.classList.add('d-none');
  }
  // Redirect back to system monitor
  window.location.href = 'user-dashboard.html';
}

/* ----- SVG RENDER BACKUP GAUGE ----- */
function renderHardwareSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" class="text-cyber-purple" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </svg>
  `;
}

// Expose cart operations globally to support inline HTML events
window.addHardwareToCart = addHardwareToCart;
window.updateCartQty = updateCartQty;
window.deleteCartItem = deleteCartItem;
window.toggleCartDrawer = toggleCartDrawer;
window.clearCart = clearCart;
window.triggerCheckout = triggerCheckout;
window.closeCheckoutSuccess = closeCheckoutSuccess;


/* ==========================================================================
   NO LAG — ELITE PC HARDWARE HUB
   GLOBAL ARCHITECT JS (script.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPrimaryDatabase();
  verifySecureSession();
  renderPilotCredentials();
  renderProductsCatalog();
  initializeGlobalIcons();
});

/* ----- PATH ROUTING RESOLUTION ----- */
const isSubFolder = window.location.pathname.includes('/pages/');
const pathPrefix = isSubFolder ? '../' : './';

/* ----- DYNAMIC IMAGE RESOLVER ----- */
function resolveImagePath(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // Strip relative prefixes or previous hardcoded folder locations to get clean path
  const cleanPath = imagePath.replace(/^(\.\.\/|\.\/|.*?assets\/images\/)/, '');
  return pathPrefix + 'assets/images/' + cleanPath;
}

/* ----- INITIALIZE HARDWARE DATABASE ----- */
function initPrimaryDatabase() {
  const existingProductsRaw = localStorage.getItem('noLag_products');
  let existingProducts = existingProductsRaw ? JSON.parse(existingProductsRaw) : [];

  const defaultProducts = [
    {
      id: 1,
      name: "Intel Core i9-14900KS",
      price: 699,
      category: "cpu",
      image: pathPrefix + "assets/images/CPU.png",
      specs: { "Core Count": "24 Cores", "Clock Speed": "6.2 GHz", "TDP Draw": "150W" }
    },
    {
      id: 2,
      name: "NVIDIA RTX 4090 SUPER",
      price: 1999,
      category: "gpu",
      image: pathPrefix + "assets/images/GPU.png",
      specs: { "CUDA Cores": "16384", "Memory": "24GB GDDR6X", "Thermal Draw": "450W" }
    },
    {
      id: 3,
      name: "Trident Z5 Neo RGB 64GB",
      price: 250,
      category: "ram",
      image: pathPrefix + "assets/images/Ram.png",
      specs: { "Memory Speed": "DDR5 6000", "Latency": "CL30", "Capacity": "64GB Kits" }
    },
    {
      id: 4,
      name: "Cyber-Core NVMe 2TB",
      price: 180,
      category: "storage",
      image: pathPrefix + "assets/images/ROM.png",
      specs: { "Read Rate": "7500 MB/s", "Write Rate": "6900 MB/s", "Drive NAND": "TLC 3D" }
    },
    {
      id: 5,
      name: "No Lag Ultimate PC",
      price: 3500,
      category: "pc",
      image: pathPrefix + "assets/images/PC.png",
      specs: { "CPU Core": "i9-14900KS", "GPU Accelerator": "RTX 4090", "Total RAM": "64GB DDR5" }
    },
    {
      id: 6,
      name: "AMD Ryzen 9 7950X3D",
      price: 599,
      category: "cpu",
      image: pathPrefix + "assets/images/CPU.png",
      specs: { "Core Count": "16 Cores", "Clock Speed": "5.7 GHz", "TDP Draw": "120W" }
    },
    {
      id: 7,
      name: "ASUS ROG Matrix RTX 4090 Platinum",
      price: 3200,
      category: "gpu",
      image: pathPrefix + "assets/images/GPU.png",
      specs: { "CUDA Cores": "16384", "Memory": "24GB GDDR6X", "Thermal Draw": "500W" }
    },
    {
      id: 8,
      name: "Corsair Dominator Titanium 32GB",
      price: 190,
      category: "ram",
      image: pathPrefix + "assets/images/Ram.png",
      specs: { "Memory Speed": "DDR5 7200", "Latency": "CL34", "Capacity": "32GB Kits" }
    },
    {
      id: 9,
      name: "Crucial T700 Gen5 NVMe 4TB",
      price: 399,
      category: "storage",
      image: pathPrefix + "assets/images/ROM.png",
      specs: { "Read Rate": "12400 MB/s", "Write Rate": "11800 MB/s", "Drive NAND": "TLC 3D" }
    },
    {
      id: 10,
      name: "No Lag Overclocked Elite Rig",
      price: 4800,
      category: "pc",
      image: pathPrefix + "assets/images/PC.png",
      specs: { "CPU Core": "Ryzen 9 7950X3D", "GPU Accelerator": "RTX 4090 Platinum", "Total RAM": "64GB DDR5" }
    }
  ];

  // If database is non-existent, or if it hasn't been explicitly seeded yet, reset and populate expanded catalog
  const databaseSeeded = localStorage.getItem('noLag_db_seeded');
  if (!existingProductsRaw || !databaseSeeded) {
    localStorage.setItem('noLag_products', JSON.stringify(defaultProducts));
    localStorage.setItem('noLag_db_seeded', 'true');
  }

  // Initialize empty orders list if missing
  if (!localStorage.getItem('noLag_orders')) {
    localStorage.setItem('noLag_orders', JSON.stringify([]));
  }
}

/* ----- AUTHENTICATION REDIRECTION MECHANICS ----- */
function handlePilotLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('input-username');
  if (!usernameInput) return;

  const username = usernameInput.value.trim();
  if (!username) return;

  sessionStorage.setItem('username', username);

  if (username === "amrlage001") {
    sessionStorage.setItem('role', 'admin');
    window.location.href = isSubFolder ? 'admin.html' : 'pages/admin.html';
  } else {
    sessionStorage.setItem('role', 'user');
    window.location.href = isSubFolder ? 'products.html' : 'pages/products.html';
  }
}

/* ----- SECURE EXCLUSIONARY SESSION CHECK ----- */
function verifySecureSession() {
  const currentPath = window.location.pathname;
  const username = sessionStorage.getItem('username');
  const role = sessionStorage.getItem('role');

  // Strict Protection rules for Admin UI
  if (currentPath.includes('admin.html')) {
    if (!username || role !== 'admin') {
      window.location.href = pathPrefix + 'index.html';
      return;
    }
  }

  // Locked paths for generic guests (requires any established session)
  const isPrivatePage = currentPath.includes('products.html') || 
                        currentPath.includes('cart.html') || 
                        currentPath.includes('user-dashboard.html');

  if (isPrivatePage && !username) {
    window.location.href = pathPrefix + 'index.html';
  }
}

/* ----- LOGIN BYPASS METHOD FOR FOOTER LINKS ----- */
function guestAccess(targetView) {
  sessionStorage.setItem('username', 'GuestPilot');
  sessionStorage.setItem('role', 'user');
  window.location.href = pathPrefix + `pages/${targetView}.html`;
}

/* ----- RENDER VISUAL CREDENTIALS & PRIVACY FLAGS ----- */
function renderPilotCredentials() {
  const username = sessionStorage.getItem('username');
  const role = sessionStorage.getItem('role');

  const nameDisplay = document.getElementById('pilot-name-display');
  const roleLed = document.getElementById('pilot-role-led');
  const adminBtn = document.getElementById('admin-bypass-btn');

  if (username) {
    if (nameDisplay) {
      nameDisplay.textContent = username;
    }
    if (roleLed) {
      if (role === 'admin') {
        roleLed.classList.add('pilot-led-admin');
        roleLed.classList.remove('pilot-led-user');
      } else {
        roleLed.classList.add('pilot-led-user');
        roleLed.classList.remove('pilot-led-admin');
      }
    }
    
    // STRICT ADMIN PRIVACY COMPLIANCE: Must show absolutely no traces or links to regular users.
    if (adminBtn) {
      if (role === 'admin') {
        adminBtn.classList.remove('hidden-by-privacy');
        adminBtn.classList.remove('hidden-el');
        adminBtn.classList.remove('d-none');
        adminBtn.style.setProperty('display', 'flex', 'important');
      } else {
        adminBtn.classList.add('hidden-by-privacy');
        adminBtn.classList.add('hidden-el');
        adminBtn.classList.add('d-none');
        adminBtn.style.setProperty('display', 'none', 'important');
      }
    }
  } else {
    // Hide active badge headers for non-established visitors
    const pilotBadgeElement = document.querySelector('.pilot-badge');
    if (pilotBadgeElement) {
      pilotBadgeElement.classList.add('hidden-el');
      pilotBadgeElement.classList.add('d-none');
    }
    if (adminBtn) {
      adminBtn.classList.add('hidden-by-privacy');
      adminBtn.classList.add('hidden-el');
      adminBtn.classList.add('d-none');
      adminBtn.style.setProperty('display', 'none', 'important');
    }
  }
}

/* ----- TERMINATE CONTROL CENTER SESSION ----- */
function logoutPilot() {
  sessionStorage.clear();
  window.location.href = pathPrefix + 'index.html';
}

/* ----- DYNAMIC BRAND HOME ROUTER ----- */
function goToBrandHome() {
  const role = sessionStorage.getItem('role');
  if (role === 'admin') {
    window.location.href = isSubFolder ? 'admin.html' : 'pages/admin.html';
  } else {
    window.location.href = isSubFolder ? 'products.html' : 'pages/products.html';
  }
}

/* ----- DYNAMIC ICON GENERATION UTILITY ----- */
function initializeGlobalIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ----- MOBILE MENU RESPONSIVE TOGGLE ----- */
function toggleMobileMenu() {
  const nav = document.getElementById('global-nav-bar');
  if (nav) {
    nav.classList.toggle('nav-open');
  }
}

/* ----- DYNAMIC PRODUCTS CATALOG CONTROLS ----- */
let activeCategoryFilter = 'all';

function renderProductsCatalog() {
  const grid = document.getElementById('products-visual-grid');
  if (!grid) return;

  const productsList = JSON.parse(localStorage.getItem('noLag_products') || '[]');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const sortType = sortSelect ? sortSelect.value : 'none';

  // Filter products by searching strings & active categories
  let filtered = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    const matchesCategory = activeCategoryFilter === 'all' || p.category.toLowerCase() === activeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort products
  if (sortType === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortType === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products-matched">
        No high-performance hardware matched your search parameters.
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(p => {
    let specsHtml = '';
    if (p.specs) {
      Object.entries(p.specs).forEach(([key, val]) => {
        const dotsCount = parseInt(val) || 5;
        let dotsHtml = '';
        for (let idx = 1; idx <= 6; idx++) {
          dotsHtml += `<span class="spec-dot ${idx <= dotsCount ? 'filled' : ''}"></span>`;
        }
        specsHtml += `
          <div class="spec-rating-row">
            <span>${key}</span>
            <div class="spec-rating-dots">${dotsHtml}</div>
          </div>
        `;
      });
    }

    const resolvedImg = resolveImagePath(p.image);
    const imgString = resolvedImg ? `<img src="${resolvedImg}" alt="${p.name}" onerror="this.onerror=null; this.parentNode.innerHTML=renderHardwareSVG()"/>` : renderHardwareSVG();

    html += `
      <div class="product-card">
        <span class="product-category-tag">${p.category}</span>
        <span class="product-stock-tag in-stock">Operational</span>
        <div class="product-img-wrapper">
          ${imgString}
        </div>
        <div class="product-body">
          <h3 class="product-title">${p.name}</h3>
          <p class="product-desc">Custom factory silicon. Hand-binned and security certified for peak thermal capabilities and latency limits.</p>
          <div class="product-specs-list">
            ${specsHtml || `
              <div class="spec-rating-row">
                <span>Voltage Tolerance</span>
                <div class="spec-rating-dots">
                  <span class="spec-dot filled"></span>
                  <span class="spec-dot filled"></span>
                  <span class="spec-dot filled"></span>
                  <span class="spec-dot filled"></span>
                  <span class="spec-dot filled"></span>
                  <span class="spec-dot"></span>
                </div>
              </div>
            `}
          </div>
          <div class="product-footer">
            <div class="product-price-box">
              <span class="price-msrp-label">MSRP Unit cost</span>
              <span class="price-msrp-val">$${parseFloat(p.price).toFixed(2)}</span>
            </div>
            <button onclick="addHardwareToCart(${p.id})" class="btn-buy-trigger">
              <i data-lucide="zap" class="icon-14"></i>
              <span>Acquire</span>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateCategoryFilter(cat) {
  activeCategoryFilter = cat.toLowerCase();
  
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === activeCategoryFilter) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderProductsCatalog();
}

function performFilter() {
  renderProductsCatalog();
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  const categories = ['all', 'gpu', 'cpu', 'ram', 'storage', 'pc'];
  let html = '';
  categories.forEach(cat => {
    html += `
      <button 
        onclick="updateCategoryFilter('${cat}')" 
        class="category-pill ${cat === activeCategoryFilter ? 'active' : ''}" 
        data-category="${cat}"
      >
        ${cat}
      </button>
    `;
  });
  container.innerHTML = html;
}

function renderHardwareSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" class="text-cyber-purple" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </svg>
  `;
}

// Bind Category pill loader
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryPills();
});

// Expose navigation and core system functions globally for inline HTML links & events
window.handlePilotLogin = handlePilotLogin;
window.guestAccess = guestAccess;
window.logoutPilot = logoutPilot;
window.goToBrandHome = goToBrandHome;
window.toggleMobileMenu = toggleMobileMenu;
window.updateCategoryFilter = updateCategoryFilter;
window.performFilter = performFilter;
window.renderProductsCatalog = renderProductsCatalog;

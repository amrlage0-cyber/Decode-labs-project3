/* ==========================================================================
   NO LAG — ELITE PC HARDWARE HUB
   TECHNICAL BLOG RECORDS (blogs.js)
   ========================================================================== */

const BLOG_DATABASE = [
  {
    id: 1,
    title: "Vcore Electromigration: Under-Volt Calibrations on i9-14900KS Series",
    category: "Overclocking Labs",
    author: "Overseer-01",
    date: "2026-05-18",
    excerpt: "An structural investigation of Silicon degradation risks when carrying peak 6.4GHz thresholds on standard industrial boards. Discover our precise -85mV offset formulas.",
    content: `
      <h3>Silicon Protection Protocols and Under-Volt Guidelines</h3>
      <p>The core voltage thresholds of modern high-bin processors require intensive monitoring to avoid irreparable physical degradation. When operating standard high-silicon processors at peak clocks, thermal thermal throttling often triggers safety locks. Our overclocking research division has mapped perfect offsets.</p>
      
      <h4>The Under-Volt Formula Matrices</h4>
      <p>We ran rigorous synthetic loading routines over 72 continuous hours using customized motherboard architectures. We verified the following optimal configurations:</p>
      <table class="telemetry-table telemetry-table-margin">
        <thead>
          <tr>
            <th>Motherboard Model</th>
            <th>Target Clock Speed</th>
            <th>Perfect Stable Offset Vcore</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ASUS ROG Maximus Apex</td>
            <td>6.2 GHz (All P-Cores)</td>
            <td>-0.085 V Adaptive</td>
          </tr>
          <tr>
            <td>MSI Z790 Meg Godlike</td>
            <td>6.1 GHz (All P-Cores)</td>
            <td>-0.075 V Override</td>
          </tr>
          <tr>
            <td>Gigabyte Z790 Tachyon</td>
            <td>6.2 GHz (All P-Cores)</td>
            <td>-0.090 V Sine Mode</td>
          </tr>
        </tbody>
      </table>

      <h4>System Thermal Outputs Comparison</h4>
      <p>By dropping the vcore load adaptive margin, the thermal load on physical capacitors decremented by an average of 14°C, completely bypassing internal CPU safety throttling registers during full-thread rendering processes.</p>
    `
  },
  {
    id: 2,
    title: "Vapor Chamber Sub-Atmospheric Thermal Calibration Strategies",
    category: "Thermal Testing",
    author: "Engineer-04",
    date: "2026-04-30",
    excerpt: "Mapping structural vapor fluid expansion and thermal dispersion coefficients under continuous GPU stress rendering operations.",
    content: `
      <h3>Vapor Chamber Mechanics Under High-Flux Heat Loads</h3>
      <p>Conventional cooling sinks fail when thermal heat flux density surpasses 100 watts per square centimeter. No Lag's specialized Ultimate PC incorporates vacuum-sealed chamber structures packed with high-velocity internal wick filaments.</p>
      
      <h4>Fluid Expansion Dynamics</h4>
      <p>Inside the chambers, high-grade water vapor particles evaporate instantly from copper surface contact points, traversing vacuum corridors to cooler aluminum fins where heat dissipates through dynamic high-flow fans.</p>
      
      <blockquote>
        "Our sub-atmospheric tests demonstrate that standard atmospheric sinks hit heat-dissipation ceilings 42% faster than custom pressure-sealed vapor wick designs."
      </blockquote>

      <h4>Performance Gains Output</h4>
      <p>By implementing sub-atmospheric chambers, GPU core heat signatures remained locked below 58°C, ensuring a absolute zero frame variance rate over standard 8K Ray Tracing test cycles.</p>
    `
  },
  {
    id: 3,
    title: "DDR5 Memory Secondary Timings: Unleashing Sub-Nanosecond Latency",
    category: "Memory Architecture",
    author: "Controller-09",
    date: "2026-03-12",
    excerpt: "An exhaustive calibration tutorial analyzing tREFI, tRFC, and tWR register parameters inside unified DDR5 high-latency memory kits.",
    content: `
      <h3>DDR5 Memory Sub-Timing Calibration Frameworks</h3>
      <p>While primary XMP parameters configure basic operation speeds, they leave underlying secondary and tertiary latency sub-registers heavily generic to fit lower-quality silicon. Tuning these registers yields exceptional throughput increases.</p>

      <h4>Target Memory Sub-Registers Tunings</h4>
      <ul>
        <li><strong>tREFI (Refresh Interval):</strong> Standard auto-settings lock this at roughly 16,384 cycles. Raising this to 65,535 cycles reduces execution stall delays by preventing needless memory refresh sweeps.</li>
        <li><strong>tRFC (Row Refresh Cycle):</strong> Lowering tRFC from 480ns to 320ns reduces internal memory recovery delays during sequential compute access operations.</li>
        <li><strong>tWR (Write Recovery):</strong> Lowering tWR to 48 cycles improves structural pipeline clearing latency.</li>
      </ul>

      <p>Caution is advised. Sub-registers modifications must be incremented slowly. Ensure active airflow cooling fans are aimed over memory slots to keep DIMM temperatures consistently below 45°C under intensive tasks.</p>
    `
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderBlogsFeed();
});

/* ----- RENDER BLOGS FEED ----- */
function renderBlogsFeed() {
  const container = document.getElementById('blogs-container');
  if (!container) return;

  let html = '';
  BLOG_DATABASE.forEach(b => {
    html += `
      <div class="blog-record-card">
        <div class="blog-record-header">
          <span class="blog-record-author">AUTHOR CORRIDOR: ${b.author}</span>
          <span>DISPATCH DATE: ${b.date}</span>
        </div>
        <h2 class="blog-record-title">${b.title}</h2>
        <div class="product-category-tag pos-static d-inline-block mb-12">
          ${b.category}
        </div>
        <p class="blog-record-excerpt">${b.excerpt}</p>
        <button onclick="openDecryptionBlog(${b.id})" class="btn-read-blog">Decrypt Records →</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ----- OPEN LAB BLOG DECRYPTION PANEL ----- */
function openDecryptionBlog(blogId) {
  const modal = document.getElementById('blog-modal');
  const modalContent = document.getElementById('blog-modal-content');

  if (!modal || !modalContent) return;

  const blog = BLOG_DATABASE.find(b => b.id === Number(blogId));
  if (!blog) return;

  modalContent.innerHTML = `
    <span class="ribbon-title-prefix font-size-md">${blog.category} // DECRYPTED SECURE LOG</span>
    <h1 class="ribbon-title-main modal-ribbon-title-main">
      ${blog.title}
    </h1>
    <div class="modal-ribbon-signature-bar">
      INTELLIGENCE SIGNATURE: <b class="text-cyber-purple">${blog.author}</b> | SECURE LINK DATE: ${blog.date}
    </div>
    <div class="decryption-body-content">
      ${blog.content}
    </div>
  `;

  modal.classList.add('active');
}

/* ----- CLOSE BLOG DECRYPTION MODAL ----- */
function closeBlogModal() {
  const modal = document.getElementById('blog-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Expose blogs view handlers globally to support inline onclick bindings
window.openDecryptionBlog = openDecryptionBlog;
window.closeBlogModal = closeBlogModal;


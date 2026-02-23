/* GrapiX LK - simple store + admin (LocalStorage) */

const STORAGE_KEY = "grapixlk_products_v1";
const ADMIN_KEY = "grapixlk_admin_authed_v1";

/** Default products (first time only) */
const DEFAULT_PRODUCTS = [
  {
    id: cryptoRandom(),
    title: "Business Page Boosting Package Mini",
    category: "Social Media",
    price: 5990,
    image: "assets/images/sample1.jpg",
    desc: "Logo + Banner + 2K followers boost + 100 likes + 3 posts."
  },
  {
    id: cryptoRandom(),
    title: "YouTube Thumbnail Design",
    category: "YouTube",
    price: 800,
    image: "assets/images/sample2.jpg",
    desc: "High CTR thumbnail, clean and bold. Delivery fast."
  },
  {
    id: cryptoRandom(),
    title: "Logo Design (Premium)",
    category: "Branding",
    price: 4500,
    image: "assets/images/sample3.jpg",
    desc: "Modern brand logo with files for social + print."
  }
];

function cryptoRandom(){
  // simple random id (works without secure backend)
  return "p_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return [...DEFAULT_PRODUCTS];
  }
  try{
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }catch{
    return [];
  }
}
function saveProducts(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function moneyLKR(n){
  const num = Number(n || 0);
  return "Rs " + num.toLocaleString("en-LK");
}

/* -------- Store Page -------- */
function initStorePage(){
  const grid = document.querySelector("#productGrid");
  const q = document.querySelector("#q");
  const cat = document.querySelector("#cat");

  const products = loadProducts();

  // build categories
  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  cat.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  function render(){
    const query = (q.value || "").toLowerCase().trim();
    const category = cat.value;

    const filtered = products.filter(p => {
      const okCat = category === "All" ? true : (p.category === category);
      const okQ = !query ? true : (
        (p.title || "").toLowerCase().includes(query) ||
        (p.desc || "").toLowerCase().includes(query)
      );
      return okCat && okQ;
    });

    grid.innerHTML = filtered.map(p => cardHtml(p)).join("") || emptyHtml();
  }

  q.addEventListener("input", render);
  cat.addEventListener("change", render);
  render();
}

function cardHtml(p){
  const img = p.image || "";
  const waText = encodeURIComponent(`Hi GrapiX LK - I want to order: ${p.title} (${moneyLKR(p.price)})`);
  const waLink = `https://wa.me/94723562484?text=${waText}`;

  return `
    <article class="card">
      <div class="thumb">
        ${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(p.title)}" loading="lazy">` : ""}
        <div class="badge">${escapeHtml(p.category || "Service")}</div>
      </div>
      <div class="body">
        <h3 class="title">${escapeHtml(p.title)}</h3>
        <p class="desc">${escapeHtml(p.desc || "")}</p>
        <div class="priceRow">
          <div>
            <div class="price">${moneyLKR(p.price)}</div>
            <div class="small">Tap order via WhatsApp</div>
          </div>
          <a class="btn good" href="${waLink}" target="_blank" rel="noopener">Order</a>
        </div>
      </div>
    </article>
  `;
}

function emptyHtml(){
  return `
    <div class="card" style="padding:14px;">
      <b>No products found</b>
      <div class="small" style="margin-top:6px;">Try another search or category.</div>
    </div>
  `;
}

/* -------- Admin Page -------- */
function initAdminPage(){
  // simple passcode gate (not secure, but ok for GitHub Pages)
  const gate = document.querySelector("#adminGate");
  const panel = document.querySelector("#adminPanel");
  const pass = document.querySelector("#adminPass");
  const loginBtn = document.querySelector("#adminLoginBtn");
  const logoutBtn = document.querySelector("#adminLogoutBtn");

  const listWrap = document.querySelector("#adminList");
  const addBtn = document.querySelector("#addBtn");

  const modalWrap = document.querySelector("#modalWrap");
  const modalTitle = document.querySelector("#modalTitle");
  const f_id = document.querySelector("#f_id");
  const f_title = document.querySelector("#f_title");
  const f_category = document.querySelector("#f_category");
  const f_price = document.querySelector("#f_price");
  const f_image = document.querySelector("#f_image");
  const f_desc = document.querySelector("#f_desc");

  const saveBtn = document.querySelector("#saveBtn");
  const cancelBtn = document.querySelector("#cancelBtn");
  const deleteBtn = document.querySelector("#deleteBtn");

  const ADMIN_PASSCODE = "1234"; // 🔴 change this

  let products = loadProducts();
  let currentId = null;

  function setAuthed(val){
    localStorage.setItem(ADMIN_KEY, val ? "1" : "0");
  }
  function isAuthed(){
    return localStorage.getItem(ADMIN_KEY) === "1";
  }
  function showAuthedUI(){
    gate.style.display = "none";
    panel.style.display = "block";
    renderList();
  }
  function showGateUI(){
    gate.style.display = "block";
    panel.style.display = "none";
  }

  function login(){
    if((pass.value || "").trim() === ADMIN_PASSCODE){
      setAuthed(true);
      showAuthedUI();
      pass.value = "";
    }else{
      alert("Wrong passcode");
    }
  }
  function logout(){
    setAuthed(false);
    showGateUI();
  }

  loginBtn.addEventListener("click", login);
  pass.addEventListener("keydown", (e)=>{ if(e.key==="Enter") login(); });
  logoutBtn.addEventListener("click", logout);

  function openModal(mode, p){
    modalWrap.style.display = "flex";
    if(mode === "add"){
      modalTitle.textContent = "Add Product";
      currentId = null;
      f_id.value = "";
      f_title.value = "";
      f_category.value = "";
      f_price.value = "";
      f_image.value = "";
      f_desc.value = "";
      deleteBtn.style.display = "none";
    }else{
      modalTitle.textContent = "Edit Product";
      currentId = p.id;
      f_id.value = p.id;
      f_title.value = p.title || "";
      f_category.value = p.category || "";
      f_price.value = p.price ?? "";
      f_image.value = p.image || "";
      f_desc.value = p.desc || "";
      deleteBtn.style.display = "inline-flex";
    }
  }
  function closeModal(){
    modalWrap.style.display = "none";
  }

  addBtn.addEventListener("click", ()=> openModal("add"));
  cancelBtn.addEventListener("click", closeModal);
  modalWrap.addEventListener("click", (e)=>{ if(e.target === modalWrap) closeModal(); });

  function save(){
    const title = f_title.value.trim();
    const category = f_category.value.trim() || "Service";
    const price = Number(f_price.value || 0);
    const image = f_image.value.trim(); // e.g. assets/images/your.png
    const desc = f_desc.value.trim();

    if(!title){
      alert("Title is required");
      return;
    }

    if(currentId){
      products = products.map(p => p.id === currentId ? { ...p, title, category, price, image, desc } : p);
    }else{
      products.unshift({
        id: cryptoRandom(),
        title, category, price, image, desc
      });
    }

    saveProducts(products);
    renderList();
    closeModal();
  }

  function del(){
    if(!currentId) return;
    if(!confirm("Delete this product?")) return;
    products = products.filter(p => p.id !== currentId);
    saveProducts(products);
    renderList();
    closeModal();
  }

  saveBtn.addEventListener("click", save);
  deleteBtn.addEventListener("click", del);

  function renderList(){
    // reload (in case)
    products = loadProducts();

    listWrap.innerHTML = products.map(p => `
      <div class="card" style="padding:12px; display:flex; gap:12px; align-items:flex-start;">
        <div style="width:80px; height:56px; border-radius:12px; overflow:hidden; background:#0a0c10; border:1px solid rgba(255,255,255,.10); flex:0 0 auto;">
          ${p.image ? `<img src="${escapeAttr(p.image)}" alt="" style="width:100%;height:100%;object-fit:cover;">` : ""}
        </div>
        <div style="flex:1 1 auto;">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
            <b>${escapeHtml(p.title)}</b>
            <button class="btn primary" data-edit="${escapeAttr(p.id)}">Edit</button>
          </div>
          <div class="small" style="margin-top:6px;">
            ${escapeHtml(p.category || "Service")} • ${moneyLKR(p.price)}
          </div>
          <div class="small" style="margin-top:4px; opacity:.85;">
            Image: ${escapeHtml(p.image || "(none)")}
          </div>
        </div>
      </div>
    `).join("") || `<div class="card" style="padding:14px;"><b>No products yet</b></div>`;

    // bind edit
    listWrap.querySelectorAll("[data-edit]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-edit");
        const p = products.find(x => x.id === id);
        if(p) openModal("edit", p);
      });
    });
  }

  // start
  if(isAuthed()) showAuthedUI();
  else showGateUI();
}

/* helpers */
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeAttr(s){ return escapeHtml(s); }

/* Auto init based on page */
document.addEventListener("DOMContentLoaded", ()=>{
  if(document.body.dataset.page === "store") initStorePage();
  if(document.body.dataset.page === "admin") initAdminPage();
});

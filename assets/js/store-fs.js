import {
  collection, addDoc, doc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "./firebase.js";

const productsCol = collection(db, "products");

const moneyLKR = (n) => "Rs " + Number(n || 0).toLocaleString("en-LK");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));

function waLink(title, price){
  const text = encodeURIComponent(`Hi GrapiX LK - I want to order: ${title} (${moneyLKR(price)})`);
  return `https://wa.me/94723562484?text=${text}`;
}

/* ---------------- STORE PAGE ---------------- */
function initStore(){
  const grid = document.getElementById("productGrid");
  const qEl = document.getElementById("q");
  const catEl = document.getElementById("cat");

  let all = [];

  function buildCats(){
    const cats = ["All", ...new Set(all.map(p => p.category).filter(Boolean))];
    catEl.innerHTML = cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
  }

  function render(){
    const q = (qEl.value || "").toLowerCase().trim();
    const cat = catEl.value || "All";

    const filtered = all.filter(p=>{
      const okCat = (cat === "All") ? true : (p.category === cat);
      const okQ = !q ? true : (
        (p.title || "").toLowerCase().includes(q) ||
        (p.desc || "").toLowerCase().includes(q)
      );
      return okCat && okQ;
    });

    grid.innerHTML = filtered.map(p => `
      <article class="card">
        <div class="thumb" onclick="openImgPreview('${esc(p.image||"")}')">
          ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">` : ""}
          <div class="badge">${esc(p.category || "Service")}</div>
        </div>
        <div class="body">
          <h3 class="title">${esc(p.title)}</h3>
          <p class="desc">${esc(p.desc || "")}</p>
          <div class="priceRow">
            <div>
              <div class="price">${moneyLKR(p.price)}</div>
              <div class="small">Tap order via WhatsApp</div>
            </div>
            <a class="btn good" href="${waLink(p.title, p.price)}" target="_blank" rel="noopener">Order</a>
          </div>
        </div>
      </article>
    `).join("") || `
      <div class="card" style="padding:14px;">
        <b>No products found</b>
        <div class="small" style="margin-top:6px;">Try another search or category.</div>
      </div>
    `;
  }

  // live updates
  const qy = query(productsCol, orderBy("createdAt", "desc"));
  onSnapshot(qy, (snap)=>{
    all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    buildCats();
    render();
  });

  qEl.addEventListener("input", render);
  catEl.addEventListener("change", render);
}

/* ---------------- ADMIN PAGE ---------------- */
function initAdmin(){
  const gate = document.getElementById("adminGate");
  const panel = document.getElementById("adminPanel");
  const pass = document.getElementById("adminPass");
  const loginBtn = document.getElementById("adminLoginBtn");
  const logoutBtn = document.getElementById("adminLogoutBtn");

  const listWrap = document.getElementById("adminList");
  const addBtn = document.getElementById("addBtn");

  const modalWrap = document.getElementById("modalWrap");
  const modalTitle = document.getElementById("modalTitle");
  const f_title = document.getElementById("f_title");
  const f_category = document.getElementById("f_category");
  const f_price = document.getElementById("f_price");
  const f_image = document.getElementById("f_image");
  const f_desc = document.getElementById("f_desc");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  const ADMIN_PASSCODE = "1234"; // 🔴 CHANGE THIS
  const ADMIN_KEY = "grapixlk_admin_authed_v2";

  let currentId = null;
  let items = [];

  const setAuthed = (v)=>localStorage.setItem(ADMIN_KEY, v ? "1" : "0");
  const isAuthed = ()=>localStorage.getItem(ADMIN_KEY)==="1";

  function showAuthed(){ gate.style.display="none"; panel.style.display="block"; }
  function showGate(){ gate.style.display="block"; panel.style.display="none"; }

  function login(){
    if((pass.value||"").trim()===ADMIN_PASSCODE){
      setAuthed(true);
      showAuthed();
      pass.value="";
    }else alert("Wrong passcode");
  }
  function logout(){ setAuthed(false); showGate(); }

  loginBtn?.addEventListener("click", login);
  pass?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") login(); });
  logoutBtn?.addEventListener("click", logout);

  function openModal(mode, p){
    modalWrap.style.display="flex";
    if(mode==="add"){
      modalTitle.textContent="Add Product";
      currentId=null;
      f_title.value=""; f_category.value=""; f_price.value="";
      f_image.value=""; f_desc.value="";
      deleteBtn.style.display="none";
    }else{
      modalTitle.textContent="Edit Product";
      currentId=p.id;
      f_title.value=p.title||"";
      f_category.value=p.category||"";
      f_price.value=p.price ?? "";
      f_image.value=p.image||"";
      f_desc.value=p.desc||"";
      deleteBtn.style.display="inline-flex";
    }
  }
  function closeModal(){ modalWrap.style.display="none"; }

  addBtn?.addEventListener("click", ()=>openModal("add"));
  cancelBtn?.addEventListener("click", closeModal);
  modalWrap?.addEventListener("click", (e)=>{ if(e.target===modalWrap) closeModal(); });

  async function save(){
    const title = f_title.value.trim();
    const category = f_category.value.trim() || "Service";
    const price = Number(f_price.value || 0);
    const image = f_image.value.trim(); // assets/images/xxx.jpg or full URL
    const desc = f_desc.value.trim();

    if(!title) return alert("Title is required");

    const data = { title, category, price, image, desc, createdAt: Date.now() };

    if(currentId){
      await updateDoc(doc(db, "products", currentId), { title, category, price, image, desc });
    }else{
      await addDoc(productsCol, data);
    }
    closeModal();
  }

  async function del(){
    if(!currentId) return;
    if(!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", currentId));
    closeModal();
  }

  saveBtn?.addEventListener("click", save);
  deleteBtn?.addEventListener("click", del);

  function renderList(){
    listWrap.innerHTML = items.map(p => `
      <div class="card" style="padding:12px; display:flex; gap:12px; align-items:flex-start;">
        <div style="width:84px; aspect-ratio:1/1; border-radius:12px; overflow:hidden; background:#0a0c10; border:1px solid rgba(255,255,255,.10); flex:0 0 auto; display:grid; place-items:center;">
          ${p.image ? `<img src="${esc(p.image)}" alt="" style="width:100%;height:100%;object-fit:contain;padding:6px;">` : ""}
        </div>
        <div style="flex:1 1 auto;">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
            <b>${esc(p.title)}</b>
            <button class="btn primary" data-edit="${esc(p.id)}">Edit</button>
          </div>
          <div class="small" style="margin-top:6px;">${esc(p.category||"Service")} • ${moneyLKR(p.price)}</div>
          <div class="small" style="margin-top:4px; opacity:.85;">Image: ${esc(p.image || "(none)")}</div>
        </div>
      </div>
    `).join("") || `<div class="card" style="padding:14px;"><b>No products yet</b></div>`;

    listWrap.querySelectorAll("[data-edit]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-edit");
        const p = items.find(x=>x.id===id);
        if(p) openModal("edit", p);
      });
    });
  }

  // Live list
  const qy = query(productsCol, orderBy("createdAt", "desc"));
  onSnapshot(qy, (snap)=>{
    items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if(isAuthed()) renderList();
  });

  if(isAuthed()) showAuthed();
  else showGate();
}

/* -------- Image Preview (Store) -------- */
window.openImgPreview = function(src){
  const modal = document.getElementById("imgModal");
  const img = document.getElementById("imgModalSrc");
  const closeBtn = document.getElementById("imgCloseBtn");
  if(!modal || !img || !src) return;

  img.src = src;
  modal.style.display = "flex";

  const close = ()=>{ modal.style.display="none"; img.src=""; };
  closeBtn?.addEventListener("click", close, { once:true });
  modal.addEventListener("click", (e)=>{ if(e.target===modal) close(); }, { once:true });
};

document.addEventListener("DOMContentLoaded", ()=>{
  if(document.body.dataset.page === "store") initStore();
  if(document.body.dataset.page === "admin") initAdmin();
});

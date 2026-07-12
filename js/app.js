/* ============================================================
   NOTIVA — app.js
   Lightweight "fake backend" for a training website: no real
   payments, no real accounts. Everything lives in localStorage
   so the site can be hosted as static files (e.g. GitHub Pages)
   and used to practise a real GTM + GA4 implementation.

   IMPORTANT FOR THE STUDENT:
   This file already pushes events to window.dataLayer at the
   right moments (view_item_list, view_item, add_to_cart,
   view_cart, begin_checkout, purchase, sign_up, login,
   generate_lead, contacto_whatsapp...). Your job in GTM is to
   READ these dataLayer pushes with Data Layer Variables and
   send them on to GA4 — you do NOT need to edit this file.
   ============================================================ */

window.dataLayer = window.dataLayer || [];
function pushDL(obj){ window.dataLayer.push(obj); console.log('%c[dataLayer.push]','color:#6C5CE7;font-weight:bold;', obj); }

/* ---------------- Catálogo de servicios y paquetes ---------------- */
const NOTIVA_CATALOG = {
  email: {
    name: 'Email Certificado',
    color: 'purple',
    icon: '✉️',
    desc: 'Envío de comunicaciones con validez probatoria: acuse de recibo, contenido y fecha.',
    packages: [
      { id: 'EMAIL-100', name: 'Starter · 100 créditos', credits: 100, price: 49 },
      { id: 'EMAIL-500', name: 'Business · 500 créditos', credits: 500, price: 199, featured: true },
      { id: 'EMAIL-2000', name: 'Enterprise · 2.000 créditos', credits: 2000, price: 699 },
    ]
  },
  sms: {
    name: 'SMS Certificado',
    color: 'yellow',
    icon: '💬',
    desc: 'Notificaciones SMS con constancia fehaciente de envío, entrega y contenido.',
    packages: [
      { id: 'SMS-200', name: 'Starter · 200 créditos', credits: 200, price: 39 },
      { id: 'SMS-1000', name: 'Business · 1.000 créditos', credits: 1000, price: 169, featured: true },
      { id: 'SMS-5000', name: 'Enterprise · 5.000 créditos', credits: 5000, price: 699 },
    ]
  },
  firma: {
    name: 'Firma Electrónica',
    color: 'green',
    icon: '✍️',
    desc: 'Firma de contratos y documentos con distintos niveles de identificación del firmante.',
    packages: [
      { id: 'FIRMA-50', name: 'Starter · 50 firmas', credits: 50, price: 59 },
      { id: 'FIRMA-250', name: 'Business · 250 firmas', credits: 250, price: 249, featured: true },
      { id: 'FIRMA-1000', name: 'Enterprise · 1.000 firmas', credits: 1000, price: 799 },
    ]
  },
  ekyc: {
    name: 'Verificación eKYC',
    color: 'coral',
    icon: '🪪',
    desc: 'Verificación de identidad remota para altas de clientes y procesos regulados.',
    packages: [
      { id: 'EKYC-50', name: 'Starter · 50 verificaciones', credits: 50, price: 79 },
      { id: 'EKYC-250', name: 'Business · 250 verificaciones', credits: 250, price: 329, featured: true },
      { id: 'EKYC-1000', name: 'Enterprise · 1.000 verificaciones', credits: 1000, price: 999 },
    ]
  }
};

function findPackage(pkgId){
  for(const svc of Object.values(NOTIVA_CATALOG)){
    const found = svc.packages.find(p => p.id === pkgId);
    if(found) return { ...found, category: svc.name };
  }
  return null;
}

function toItem(pkg, quantity){
  return {
    item_id: pkg.id,
    item_name: pkg.name,
    item_category: pkg.category,
    price: pkg.price,
    quantity: quantity || 1,
    currency: 'EUR'
  };
}

/* ---------------- Sesión falsa (registro / login) ---------------- */
const AUTH_KEY = 'notiva_session';
function getSession(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY)); }catch(e){ return null; } }
function setSession(user){ localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
function clearSession(){ localStorage.removeItem(AUTH_KEY); }
function isLoggedIn(){ return !!getSession(); }

/* ---------------- Carrito ---------------- */
const CART_KEY = 'notiva_cart';
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; } }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }
function cartCount(){ return getCart().reduce((n,i)=>n+i.quantity,0); }
function cartTotal(){ return getCart().reduce((n,i)=>n + i.price*i.quantity, 0); }

function addToCart(pkgId, qty){
  qty = qty || 1;
  const pkg = findPackage(pkgId);
  if(!pkg) return;
  const cart = getCart();
  const existing = cart.find(i => i.item_id === pkgId);
  if(existing){ existing.quantity += qty; }
  else{ cart.push(toItem(pkg, qty)); }
  saveCart(cart);

  pushDL({ ecommerce: null }); // limpia el objeto ecommerce anterior (buena práctica GA4)
  pushDL({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'EUR',
      value: pkg.price * qty,
      items: [ toItem(pkg, qty) ]
    }
  });
  showToast(`Añadido al carrito: ${pkg.name}`);
}

function removeFromCart(pkgId){
  const cart = getCart();
  const item = cart.find(i => i.item_id === pkgId);
  const next = cart.filter(i => i.item_id !== pkgId);
  saveCart(next);
  if(item){
    pushDL({ ecommerce: null });
    pushDL({ event:'remove_from_cart', ecommerce:{ currency:'EUR', value:item.price*item.quantity, items:[item] } });
  }
  if(typeof renderCart === 'function') renderCart();
}

function changeQty(pkgId, delta){
  const cart = getCart();
  const item = cart.find(i => i.item_id === pkgId);
  if(!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart(cart);
  if(typeof renderCart === 'function') renderCart();
}

function clearCart(){ saveCart([]); }

function updateCartBadge(){
  document.querySelectorAll('[data-cart-badge]').forEach(el=>{
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

/* ---------------- Toast ---------------- */
let toastTimer;
function showToast(msg){
  let el = document.getElementById('notiva-toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'notiva-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove('show'), 2600);
}

/* ---------------- Cabecera de cuenta ---------------- */
function renderAccountArea(){
  const area = document.querySelector('[data-account-area]');
  if(!area) return;
  const session = getSession();
  if(session){
    area.innerHTML = `
      <a href="cuenta.html" class="account-pill">
        <span class="av">${session.nombre.charAt(0).toUpperCase()}</span>
        ${session.nombre.split(' ')[0]}
      </a>`;
  } else {
    area.innerHTML = `<a href="login.html" class="btn btn-outline btn-sm">Iniciar sesión</a>
      <a href="registro.html" class="btn btn-primary btn-sm">Crear cuenta</a>`;
  }
}

/* ---------------- Clic en WhatsApp (evento personalizado) ---------------- */
document.addEventListener('click', function(e){
  const wa = e.target.closest('[data-wa-click]');
  if(wa){
    pushDL({
      event: 'contacto_whatsapp',
      metodo_contacto: 'whatsapp',
      pagina: window.location.pathname
    });
  }
});

/* ---------------- Init común a todas las páginas ---------------- */
document.addEventListener('DOMContentLoaded', function(){
  updateCartBadge();
  renderAccountArea();

  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
});

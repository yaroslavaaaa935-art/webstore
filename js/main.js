document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEYS = { PRODUCTS: 'sp_products_v1', CART: 'sp_cart_v1' }
  
  // Модальные окна
  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmOk = document.getElementById('confirmOk');
  const confirmCancel = document.getElementById('confirmCancel');
  
  const alertModal = document.getElementById('alertModal');
  const alertMessage = document.getElementById('alertMessage');
  const alertOk = document.getElementById('alertOk');

  const DEFAULT_PRODUCTS = [
    {id: genId(), name: 'Колье "Лунный свет"', price: 1490, image: 'images/elegant-silver-necklace-with-pearls.jpg', desc:'Элегантное колье с жемчугом'},
    {id: genId(), name: 'Кольцо "Роза"', price: 790, image: 'images/rose-gold-ring-with-ruby.jpg', desc:'Романтичное кольцо с рубином'},
    {id: genId(), name: 'Серьги "Звездная ночь"', price: 3490, image: 'images/elegant-diamond-earrings.jpg', desc:'Сверкающие серьги с бриллиантами'}
  ];

  const PROMOS = {
    'SALE10': {type:'percent', value:10, description:'Скидка 10%'},
    'HALF50': {type:'percent', value:50, description:'50% — тестовый код'},
    'FLAT300': {type:'fixed', value:300, description:'Скидка 300 ₽'}
  };

  // DOM элементы
  const catalogEl = document.getElementById('catalog');
  const productCountEl = document.getElementById('productCount');
  const cartCountEl = document.getElementById('cartCount');
  const summaryItemsEl = document.getElementById('summaryItems');
  const summarySumEl = document.getElementById('summarySum');
  const cartModal = document.getElementById('cartModal');
  const cartListEl = document.getElementById('cartList');
  const modalCountEl = document.getElementById('modalCount');
  const subTotalEl = document.getElementById('subTotal');
  const discountAmountEl = document.getElementById('discountAmount');
  const shippingEl = document.getElementById('shipping');
  const grandTotalEl = document.getElementById('grandTotal');

  // Admin controls
  const pName = document.getElementById('pName');
  const pPrice = document.getElementById('pPrice');
  const pImage = document.getElementById('pImage');
  const pDesc = document.getElementById('pDesc');
  const addProductBtn = document.getElementById('addProduct');
  const resetDemoBtn = document.getElementById('resetDemo');

  // Promo
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromo');
  const promoMessage = document.getElementById('promoMessage');

  // Кноки корзины
  document.getElementById('openCart').addEventListener('click', ()=>{cartModal.style.display='flex'; renderCart()});
  document.getElementById('closeCart').addEventListener('click', ()=>{cartModal.style.display='none'});
  document.getElementById('clearCart').addEventListener('click', ()=>{ 
    showConfirm('Очистить корзину?', (confirmed) => {
      if(confirmed) {
        saveCart({}); 
        renderCart();
      }
    });
  });
  
  document.getElementById('checkout').addEventListener('click', ()=>{
    showAlert('Спасибо за заказ!'); 
    saveCart({}); 
    renderCart(); 
    cartModal.style.display='none';
  });

  addProductBtn.addEventListener('click', ()=> {
    const name = pName.value.trim();
    const price = Number(pPrice.value);
    const image = pImage.value.trim();
    const desc = pDesc.value.trim();
    if(!name || !price || price<=0){
      showAlert('Введите название и корректную цену'); 
      return;
    }
    const product = {id: genId(), name, price, image: image||placeholderFor(name), desc};
    const products = loadProducts(); products.unshift(product); saveProducts(products); renderCatalog(); clearAdminForm();
  });

  resetDemoBtn.addEventListener('click', ()=> {
    showConfirm('Загрузить демо-продукты? Текущие товары будут заменены.', (confirmed) => {
      if(confirmed) {
        saveProducts(DEFAULT_PRODUCTS); 
        saveCart({}); 
        promoClear(); 
        renderCatalog(); 
        renderCart();
      }
    });
  });

  applyPromoBtn.addEventListener('click', ()=> {
    const code = promoInput.value.trim().toUpperCase(); 
    applyPromo(code);
  });

  // Функции модальных окон
  function showConfirm(message, callback) {
    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex';
    
    function handleConfirm() {
      confirmModal.style.display = 'none';
      callback(true);
      cleanup();
    }
    
    function handleCancel() {
      confirmModal.style.display = 'none';
      callback(false);
      cleanup();
    }
    
    function cleanup() {
      confirmOk.removeEventListener('click', handleConfirm);
      confirmCancel.removeEventListener('click', handleCancel);
    }
    
    confirmOk.addEventListener('click', handleConfirm);
    confirmCancel.addEventListener('click', handleCancel);
  }

  function showAlert(message) {
    alertMessage.textContent = message;
    alertModal.style.display = 'flex';
    
    function handleOk() {
      alertModal.style.display = 'none';
      alertOk.removeEventListener('click', handleOk);
    }
    
    alertOk.addEventListener('click', handleOk);
  }

  function loadProducts(){ const raw=localStorage.getItem(STORAGE_KEYS.PRODUCTS); return raw? JSON.parse(raw): DEFAULT_PRODUCTS.slice(); }
  function saveProducts(arr){ localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(arr)); }

  function loadCart(){ const raw=localStorage.getItem(STORAGE_KEYS.CART); return raw? JSON.parse(raw): {items:{}, promo:null}; }
  function saveCart(cart){ localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); updateSummary(); }

  function savePromoToCart(code){ const cart = loadCart(); cart.promo = code; saveCart(cart); }
  function promoClear(){ promoInput.value=''; promoMessage.textContent=''; savePromoToCart(null); }

  function renderCatalog(){ const products = loadProducts(); catalogEl.innerHTML=''; products.forEach(p=>{catalogEl.appendChild(createProductCard(p))}); productCountEl.textContent = products.length; }

  function createProductCard(p) {
    const wrap = document.createElement('div');
    wrap.className = 'product';
    wrap.style.position = 'relative';

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '✕';
    delBtn.title = 'Удалить товар';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirm(`Удалить «${p.name}» из каталога?`, (confirmed) => {
        if (confirmed) {
          const products = loadProducts().filter(x => x.id !== p.id);
          saveProducts(products);
          renderCatalog();
        }
      });
    });

    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.name;

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = p.name;

    const desc = document.createElement('div');
    desc.className = 'muted';
    desc.textContent = p.desc || '';

    const row = document.createElement('div');
    row.className = 'row';

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = formatMoney(p.price) + ' ₽';

    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Заказать';
    buyBtn.addEventListener('click', () => addToCart(p.id));

    row.append(price, buyBtn);
    wrap.append(delBtn, img, title, desc, row);
    return wrap;
  }

  function renderCart(){ const cart = loadCart(); const products = loadProducts(); cartListEl.innerHTML=''; let count=0;
    for(const pid in cart.items){ const qty=cart.items[pid]; if(qty<=0) continue; const p=products.find(x=>x.id===pid); if(!p) continue; count+=qty; cartListEl.appendChild(createCartItemNode(p,qty)); }
    modalCountEl.textContent=count+' поз.'; cartCountEl.textContent=count; summaryItemsEl.textContent=count; updateTotals();
  }

  function createCartItemNode(p,qty){
    const item=document.createElement('div'); item.className='cart-item';
    const img=document.createElement('img'); img.src=p.image;
    const info=document.createElement('div'); info.style.flex='1';
    const title=document.createElement('div'); title.textContent=p.name; title.style.fontWeight='600';
    const price=document.createElement('div'); price.className='muted'; price.textContent=formatMoney(p.price)+' ₽';
    const controls=document.createElement('div'); controls.style.display='flex'; controls.style.justifyContent='space-between'; controls.style.gap='12px';
    const qtyControls=document.createElement('div'); qtyControls.className='qty-controls';
    const dec=document.createElement('button'); dec.textContent='−'; dec.addEventListener('click',()=>{ changeQty(p.id,-1) });
    const qel=document.createElement('span'); qel.textContent=qty; qel.style.minWidth='22px'; qel.style.textAlign='center';
    const inc=document.createElement('button'); inc.textContent='+'; inc.addEventListener('click',()=>{ changeQty(p.id,+1) });
    qtyControls.append(dec,qel,inc);
    const remove=document.createElement('button'); remove.textContent='Удалить'; remove.className='secondary'; remove.addEventListener('click',()=>{ removeFromCart(p.id) });
    controls.append(qtyControls,remove);
    info.append(title,price,controls);
    const right=document.createElement('div'); right.style.textAlign='right'; right.innerHTML=`<div style="font-weight:700">${formatMoney(p.price*qty)} ₽</div><div class="muted" style="font-size:13px">${formatMoney(p.price)} ₽ / шт</div>`;
    item.append(img,info,right); return item;
  }

  function updateSummary(){ const cart=loadCart(); const products=loadProducts(); let items=0, sum=0; for(const pid in cart.items){ const qty=cart.items[pid]; const p=products.find(x=>x.id===pid); if(!p) continue; items+=qty; sum+=p.price*qty; } cartCountEl.textContent=items; summaryItemsEl.textContent=items; summarySumEl.textContent=formatMoney(sum)+' ₽'; }

  function updateTotals(){ const cart=loadCart(); const products=loadProducts(); let subtotal=0, items=0; for(const pid in cart.items){ const qty=cart.items[pid]; const p=products.find(x=>x.id===pid); if(!p) continue; items+=qty; subtotal+=p.price*qty; }
    const promoCode = cart.promo; let discount=0; let promoText=''; if(promoCode && PROMOS[promoCode]){ const p=PROMOS[promoCode]; discount = p.type==='percent'? Math.round(subtotal*p.value/100) : p.value; promoText=p.description;} else if(promoCode){ promoText='Неверный промокод'; }
    const shipping = subtotal>0? 199:0;
    const total = Math.max(0,subtotal-discount+shipping);
    subTotalEl.textContent=formatMoney(subtotal)+' ₽'; discountAmountEl.textContent='- '+formatMoney(discount)+' ₽';
    shippingEl.textContent=formatMoney(shipping)+' ₽'; grandTotalEl.textContent=formatMoney(total)+' ₽';
    promoMessage.textContent=promoText || (promoCode?'Код не найден':'');
    modalCountEl.textContent=items+' поз.'; cartCountEl.textContent=items; summaryItemsEl.textContent=items;
  }

  function addToCart(id,q=1){ const cart=loadCart(); cart.items=cart.items||{}; cart.items[id]=(cart.items[id]||0)+q; saveCart(cart); renderCart(); }
  function changeQty(id,delta){ const cart=loadCart(); cart.items=cart.items||{}; cart.items[id]=(cart.items[id]||0)+delta; if(cart.items[id]<=0) delete cart.items[id]; saveCart(cart); renderCart(); }
  function removeFromCart(id){ const cart=loadCart(); if(!cart.items) return; delete cart.items[id]; saveCart(cart); renderCart(); }

  function applyPromo(code){ if(!code){ promoMessage.textContent='Введите код'; return;} code=code.toUpperCase(); const cart=loadCart(); if(!PROMOS[code]){ cart.promo=code; saveCart(cart); promoMessage.textContent='Код не найден'; renderCart(); return;} cart.promo=code; saveCart(cart); promoMessage.textContent='Промокод применён: '+PROMOS[code].description; renderCart(); }

  function clearAdminForm(){ pName.value=''; pPrice.value=''; pImage.value=''; pDesc.value=''; }

  // Закрытие модальных окон
  function setupModalClose() {
    // Закрытие по клику на фон
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.style.display = 'none';
        }
      });
    });
    
    // Закрытие по Escape
    window.addEventListener('keydown', e => {
      if(e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
          modal.style.display = 'none';
        });
      }
    });
  }

  if(!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) saveProducts(DEFAULT_PRODUCTS);
  if(!localStorage.getItem(STORAGE_KEYS.CART)) saveCart({items:{}, promo:null});
  renderCatalog(); 
  renderCart(); 
  updateSummary();
  setupModalClose();
});
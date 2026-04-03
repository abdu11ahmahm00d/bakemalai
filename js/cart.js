// Cart logic for Bakemalai
let cart = JSON.parse(localStorage.getItem('bakemalai_cart')) || [];

function saveCart() {
    localStorage.setItem('bakemalai_cart', JSON.stringify(cart));
    renderCart();
}

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    saveCart();
    
    // Auto-open offcanvas on add
    const offcanvasEl = document.getElementById('cartOffcanvas');
    if (offcanvasEl && typeof bootstrap !== "undefined") {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
        bsOffcanvas.show();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
        }
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function clearCart() {
    cart = [];
    saveCart();
}

function confirmOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    console.log('Confirming Order...', cart);
    alert('Thank you! Your order has been placed. We will start preparing your sweets soon!');
    clearCart();
    
    const offcanvasEl = document.getElementById('cartOffcanvas');
    if (offcanvasEl && typeof bootstrap !== "undefined") {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) bsOffcanvas.hide();
    }
}

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const badge = document.getElementById('cartBadge');
    const totalEl = document.getElementById('cartTotal');

    if (!container || !badge || !totalEl) return;

    badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    totalEl.innerText = getCartTotal();

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center mt-4 pt-4">Your sweet cart is empty.</p>';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item d-flex justify-content-between align-items-center mb-3 p-3 bg-white border rounded shadow-sm';
        div.innerHTML = `
            <div>
                <h6 class="mb-1 text-chocolate fw-bold">${item.name}</h6>
                <div class="text-muted small">৳${item.price} x ${item.quantity} = <span class="fw-bold">৳${item.price * item.quantity}</span></div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button onclick="updateQuantity('${item.id}', -1)" class="btn btn-sm btn-outline-chocolate py-0 px-2 fw-bold fs-5">-</button>
                <span class="fw-bold fs-5 text-chocolate">${item.quantity}</span>
                <button onclick="updateQuantity('${item.id}', 1)" class="btn btn-sm btn-outline-chocolate py-0 px-2 fw-bold fs-5">+</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

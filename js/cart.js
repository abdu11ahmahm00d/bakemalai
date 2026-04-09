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

    if (window.event) {
        const e = window.event;
        const rect = e.target.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        
        const colors = ['#C8860A', '#E84393', '#4CAF82', '#3B1A08', '#FFF8F0'];
        for (let i = 0; i < 6; i++) {
            const confetti = document.createElement('span');
            confetti.classList.add('confetti');
            confetti.style.left = startX + 'px';
            confetti.style.top = startY + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const tx = (Math.random() - 0.5) * 100 + 'px';
            const ty = (Math.random() - 1) * 80 + 'px';
            confetti.style.setProperty('--tx', tx);
            confetti.style.setProperty('--ty', ty);
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 700);
        }
    }

    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.classList.add('pulse-ring-active');
        setTimeout(() => badge.classList.remove('pulse-ring-active'), 800);
    }
    
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

function handleCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    window.location.href = 'checkout.html';
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

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

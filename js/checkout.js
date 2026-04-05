const cartItems = JSON.parse(localStorage.getItem('bakemalai_cart')) || [];
const form = document.getElementById('checkoutForm');
const confirmBtn = document.getElementById('confirmOrderBtn');
const helpText = document.getElementById('formHelpText');
const bkashRadios = document.getElementsByName('paymentMethod');
const bkashSection = document.getElementById('bkashSection');
const txnIdInput = document.getElementById('txnId');

function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummaryContainer');
    const totalEl = document.getElementById('checkoutGrandTotal');
    const bkashDisplay = document.getElementById('bkashTotalDisplay');
    
    if (cartItems.length === 0) {
        container.innerHTML = '<p class="text-muted fst-italic">Your cart is completely empty!</p>';
        return;
    }

    let total = 0;
    container.innerHTML = '';

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'd-flex justify-content-between align-items-center mb-3 pb-2 border-bottom';
        div.innerHTML = `
            <div>
                <h6 class="mb-0 fw-bold text-dark">${item.name} <span class="badge bg-secondary ms-1">x${item.quantity}</span></h6>
                <small class="text-muted">৳${item.price} each</small>
            </div>
            <div class="fw-bold text-chocolate">
                ৳${itemTotal}
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = total;
    if(bkashDisplay) bkashDisplay.textContent = total;
}

function checkFormValidity() {
    let isValid = form.checkValidity();
    
    const bkashSelected = document.querySelector('input[name="paymentMethod"][value="bkash"]').checked;
    if (bkashSelected) {
        if (!txnIdInput.value.trim()) {
            isValid = false;
        }
    }

    if (isValid && cartItems.length > 0) {
        confirmBtn.style.display = 'block';
        helpText.style.display = 'none';
    } else {
        confirmBtn.style.display = 'none';
        helpText.style.display = 'block';
    }
}

function handlePaymentToggle() {
    const bkashSelected = document.querySelector('input[name="paymentMethod"][value="bkash"]').checked;
    if (bkashSelected) {
        bkashSection.classList.add('expanded');
        txnIdInput.required = true;
    } else {
        bkashSection.classList.remove('expanded');
        txnIdInput.required = false;
    }
    checkFormValidity();
}

form.addEventListener('input', checkFormValidity);
bkashRadios.forEach(radio => radio.addEventListener('change', handlePaymentToggle));

function clearCart() {
    localStorage.removeItem('bakemalai_cart');
}

async function submitOrder() {
    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';

    const payload = {
        name: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        bkashTxnId: document.getElementById('txnId').value || '',
        items: cartItems.map(item => ({ name: item.name, qty: item.quantity, price: item.price })),
        total: cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    };

    try {
        const response = await fetch('/.netlify/functions/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            clearCart();
            window.location.href = 'thankyou.html';
        } else {
            throw new Error('Notify failed');
        }
    } catch (error) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Order';

        let toastContainer = document.getElementById('toastWrapper');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastWrapper';
            toastContainer.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
            toastContainer.style.zIndex = '1060';
            document.body.appendChild(toastContainer);
        }

        toastContainer.innerHTML = `
            <div class="toast align-items-center border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="background-color: var(--color-candy-pink); color: white;">
                <div class="d-flex">
                    <div class="toast-body fw-bold fs-6">
                        Something went wrong. Please call us at 01310-834233 🍫
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        if (typeof bootstrap !== "undefined") {
            const toastEl = toastContainer.querySelector('.toast');
            const bsToast = new bootstrap.Toast(toastEl, { delay: 6000 });
            bsToast.show();
        }
    }
}

document.addEventListener('DOMContentLoaded', renderCheckoutSummary);

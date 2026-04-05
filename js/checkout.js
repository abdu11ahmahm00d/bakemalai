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

function submitOrder() {
    alert("Order Submitted Stub!");
    localStorage.removeItem('bakemalai_cart');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', renderCheckoutSummary);

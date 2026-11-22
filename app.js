// PrintCrafter Main Logic

let orders = JSON.parse(localStorage.getItem('tshirt_orders')) || [
    {
        id: 'ORD-1001',
        customerName: 'Alex Morgan',
        email: 'alex@example.com',
        address: '742 Evergreen Terrace, Springfield',
        material: '100% Cotton',
        size: 'L',
        qty: 2,
        total: 49.98,
        color: '#1e293b',
        designImg: 'https://via.placeholder.com/150/1e293b/ffffff?text=Sample+Design',
        status: 'Printing',
        paymentStatus: 'Paid (Demo Card)',
        date: '2026-10-28'
    }
];

let currentOrderData = null;
let selectedShirtColor = '#ffffff';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updatePrice();
    saveOrdersToStorage();
});

function saveOrdersToStorage() {
    localStorage.setItem('tshirt_orders', JSON.stringify(orders));
}

// Color Selection
function setShirtColor(colorHex, textColor) {
    selectedShirtColor = colorHex;
    const shirtIcon = document.getElementById('shirtIcon');
    shirtIcon.style.color = colorHex;
    
    // Update active state
    document.querySelectorAll('.color-dot').forEach(dot => dot.classList.remove('active'));
    event.target.classList.add('active');
}

// Preview Uploaded Image
function previewUserDesign(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('userDesignPreview');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            document.getElementById('uploadPlaceholder').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// Dynamic Price Calculation
function updatePrice() {
    const qty = parseInt(document.getElementById('shirtQty').value) || 1;
    const material = document.getElementById('shirtMaterial').value;
    
    let basePrice = 24.99;
    if (material === 'Organic Cotton') basePrice = 29.99;
    if (material === 'Poly-Cotton Blend') basePrice = 19.99;

    const total = (basePrice * qty).toFixed(2);
    document.getElementById('totalPriceDisplay').innerText = `$${total}`;
}

// Handle Order Form Submit
function handleCustomerSubmit(e) {
    e.preventDefault();

    const designInput = document.getElementById('designInput');
    if (!designInput.files[0]) {
        showToast('Please upload an artwork file.');
        return;
    }

    const previewImg = document.getElementById('userDesignPreview').src;
    const qty = parseInt(document.getElementById('shirtQty').value);
    const material = document.getElementById('shirtMaterial').value;
    const size = document.getElementById('shirtSize').value;
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const address = document.getElementById('custAddress').value;
    const priceText = document.getElementById('totalPriceDisplay').innerText.replace('$', '');

    currentOrderData = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customerName: name,
        email: email,
        address: address,
        material: material,
        size: size,
        qty: qty,
        total: parseFloat(priceText),
        color: selectedShirtColor,
        designImg: previewImg,
        status: 'Paid',
        paymentStatus: 'Paid (Demo)',
        date: new Date().toISOString().split('T')[0]
    };

    // Open Payment Modal
    document.getElementById('payAmount').innerText = `$${currentOrderData.total.toFixed(2)}`;
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function completeDemoPayment() {
    if (!currentOrderData) return;

    orders.unshift(currentOrderData);
    saveOrdersToStorage();

    closePaymentModal();
    showToast(`Order Placed Successfully! ID: ${currentOrderData.id}`);

    // Reset Form
    document.getElementById('orderForm').reset();
    document.getElementById('userDesignPreview').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    updatePrice();
    
    // Auto fill tracking lookup
    document.getElementById('trackInput').value = currentOrderData.id;
    trackOrder();
    
    currentOrderData = null;
}

// Tracking Order Function
function trackOrder() {
    const query = document.getElementById('trackInput').value.trim().toLowerCase();
    const container = document.getElementById('trackResult');

    if (!query) {
        container.innerHTML = '<p style="color:var(--danger)">Please enter an Order ID or Email.</p>';
        return;
    }

    const matches = orders.filter(o => o.id.toLowerCase() === query || o.email.toLowerCase() === query);

    if (matches.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No orders found with provided details.</p>';
        return;
    }

    let html = '';
    matches.forEach(o => {
        html += `
            <div class="status-card" style="margin-bottom: 1rem;">
                <h4>Order ${o.id} - <span class="status-badge status-${o.status}">${o.status}</span></h4>
                <p><strong>Item:</strong> ${o.qty}x ${o.material} (${o.size}) - Color: <span style="display:inline-block;width:12px;height:12px;background:${o.color};border-radius:50%;border:1px solid #ccc;"></span></p>
                <p><strong>Total Paid:</strong> $${o.total.toFixed(2)} (${o.paymentStatus})</p>
                <p><strong>Deliver To:</strong> ${o.customerName}, ${o.address}</p>
                <p><small>Order Date: ${o.date}</small></p>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Admin Operations
function openAdminModal() {
    document.getElementById('adminLoginModal').classList.add('active');
}

function closeAdminModal() {
    document.getElementById('adminLoginModal').classList.remove('active');
}

function loginAdmin() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;

    if (u === 'admin' && p === 'admin123') {
        closeAdminModal();
        document.getElementById('adminPanel').classList.add('active');
        renderAdminOrders();
    } else {
        showToast('Invalid Admin Credentials!');
    }
}

function logoutAdmin() {
    document.getElementById('adminPanel').classList.remove('active');
}

function renderAdminOrders() {
    const filter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('adminOrderTableBody');
    tbody.innerHTML = '';

    let totalRev = 0;
    let countPrinting = 0;
    let countDelivered = 0;

    const filtered = orders.filter(o => {
        if (o.status === 'Printing') countPrinting++;
        if (o.status === 'Delivered') countDelivered++;
        totalRev += o.total;

        if (filter === 'ALL') return true;
        return o.status === filter;
    });

    // Update Stats
    document.getElementById('statTotal').innerText = orders.length;
    document.getElementById('statPrinting').innerText = countPrinting;
    document.getElementById('statDelivered').innerText = countDelivered;
    document.getElementById('statRevenue').innerText = `$${totalRev.toFixed(2)}`;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching orders found</td></tr>';
        return;
    }

    filtered.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${o.id}</strong><br><small>${o.date}</small></td>
            <td><img src="${o.designImg}" class="img-thumb" alt="Design"></td>
            <td>
                <strong>${o.customerName}</strong><br>
                <small>${o.email}</small><br>
                <small>${o.address}</small>
            </td>
            <td>
                Size: ${o.size}<br>
                Mat: ${o.material}<br>
                Qty: ${o.qty}
            </td>
            <td>
                <strong>$${o.total.toFixed(2)}</strong><br>
                <small class="badge-demo">${o.paymentStatus}</small>
            </td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td>
                <select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:0.3rem;">
                    <option value="Paid" ${o.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Printing" ${o.status === 'Printing' ? 'selected' : ''}>Printing</option>
                    <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        saveOrdersToStorage();
        renderAdminOrders();
        showToast(`Order ${orderId} updated to ${newStatus}`);
    }
}

// Toast Notification
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

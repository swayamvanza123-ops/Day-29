let saleItems = [];
let dailyChart = null;
let topProductsChart = null;
let paymentChart = null;

function getSales() {
  return DB.read().sales || [];
}

function getProducts() {
  return DB.read().products || [];
}

function generateSaleId() {
  return "INV-" + new Date().getFullYear() + "-" +
    String(getSales().length + 1).padStart(4, "0") + "-" +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

function roundMoney(number) {
  return Math.round((Number(number) + Number.EPSILON) * 100) / 100;
}

function populateProductSelect() {
  const select = document.getElementById("productSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Select product</option>` +
    getProducts().map(p => `
      <option value="${p.id}">${DB.escape(p.name)} — ${p.stock} available</option>
    `).join("");
}

function updateSelectedProduct() {
  const id = document.getElementById("productSelect").value;
  const product = getProducts().find(p => p.id === id);

  document.getElementById("availableStock").value = product ? product.stock : "";
  document.getElementById("unitPrice").value = product ? product.price : "";
  document.getElementById("itemQuantity").value = 1;
}

function addSaleItem() {
  const id = document.getElementById("productSelect").value;
  const quantity = Number(document.getElementById("itemQuantity").value);
  const product = getProducts().find(p => p.id === id);

  if (!product) {
    alert("Please select a product.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    alert("Enter a valid whole-number quantity.");
    return;
  }

  const existing = saleItems.find(item => item.productId === id);
  const requested = quantity + (existing ? existing.quantity : 0);

  if (requested > product.stock) {
    alert(`Only ${product.stock} units of ${product.name} are available.`);
    return;
  }

  if (existing) existing.quantity += quantity;
  else {
    saleItems.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      cost: Number(product.cost || 0),
      quantity
    });
  }

  renderSaleItems();
  calculateSale();
}

function removeSaleItem(id) {
  saleItems = saleItems.filter(item => item.productId !== id);
  renderSaleItems();
  calculateSale();
}

function renderSaleItems() {
  const table = document.getElementById("saleItemsTable");
  if (!table) return;

  table.innerHTML = saleItems.length ? saleItems.map(item => `
    <tr>
      <td>${DB.escape(item.name)}</td>
      <td>${DB.money(item.price)}</td>
      <td>${item.quantity}</td>
      <td>${DB.money(item.price * item.quantity)}</td>
      <td><button type="button" class="action-btn danger" onclick="removeSaleItem('${item.productId}')">Remove</button></td>
    </tr>
  `).join("") : `<tr><td colspan="5" class="empty">No products added yet.</td></tr>`;
}

function calculateSale() {
  const subtotal = roundMoney(saleItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  ));

  const discountType = document.getElementById("discountType")?.value || "fixed";
  const discountInput = Math.max(0, Number(document.getElementById("discountValue")?.value || 0));
  const taxRate = Math.max(0, Math.min(100, Number(document.getElementById("taxRate")?.value || 0)));

  let discount = discountType === "percent"
    ? subtotal * Math.min(discountInput, 100) / 100
    : Math.min(discountInput, subtotal);

  discount = roundMoney(discount);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = roundMoney(taxableAmount * taxRate / 100);
  const total = roundMoney(taxableAmount + tax);

  const paymentInput = document.getElementById("paymentAmount");
  if (paymentInput) {
    paymentInput.max = total;
    if (Number(paymentInput.value) > total) paymentInput.value = total;
  }

  const paid = Math.max(0, Number(paymentInput?.value || 0));
  const remaining = roundMoney(Math.max(0, total - paid));

  document.getElementById("subtotalDisplay").textContent = DB.money(subtotal);
  document.getElementById("discountDisplay").textContent = DB.money(discount);
  document.getElementById("taxDisplay").textContent = DB.money(tax);
  document.getElementById("grandTotalDisplay").textContent = DB.money(total);
  document.getElementById("remainingDisplay").textContent = DB.money(remaining);

  return { subtotal, discount, tax, total, paid, remaining, taxRate };
}

function resetSaleForm() {
  saleItems = [];
  document.getElementById("saleForm").reset();
  document.getElementById("saleId").value = generateSaleId();
  document.getElementById("saleDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("paymentAmount").value = 0;
  document.getElementById("discountValue").value = 0;
  document.getElementById("taxRate").value = 0;
  renderSaleItems();
  calculateSale();
  updateSelectedProduct();
}

function finalizeSale(event) {
  event.preventDefault();

  const customerId = document.getElementById("saleCustomer").value;
  const customer = (DB.read().customers || []).find(c => c.id === customerId);

  if (!customer) {
    alert("Please add and select a customer.");
    return;
  }

  if (!saleItems.length) {
    alert("Please add at least one product to the sale.");
    return;
  }

  const date = document.getElementById("saleDate").value;
  if (!date) {
    alert("Please select a sale date.");
    return;
  }

  // Validate every product before changing any stock.
  const data = DB.read();

  for (const item of saleItems) {
    const current = data.products.find(p => p.id === item.productId);
    if (!current || current.stock < item.quantity) {
      alert(`Insufficient stock for ${item.name}. Please refresh the sale.`);
      populateProductSelect();
      return;
    }
  }

  const totals = calculateSale();
  if (totals.total <= 0) {
    alert("Sale total must be greater than zero.");
    return;
  }

  if (totals.paid > totals.total) {
    alert("Amount received cannot be greater than the grand total.");
    return;
  }

  const paymentMethod = document.getElementById("paymentMethod").value;
  const invoiceNo = document.getElementById("saleId").value || generateSaleId();

  const sale = {
    id: DB.id("SAL"),
    invoiceNo,
    customerId: customer.id,
    customer: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address
    },
    date,
    createdAt: new Date().toISOString(),
    items: saleItems.map(item => ({ ...item })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    taxRate: totals.taxRate,
    total: totals.total,
    paid: totals.paid,
    remaining: totals.remaining,
    paymentMethod,
    status: "Finalized",
    paymentStatus: totals.remaining <= 0 ? "Paid" :
      totals.paid > 0 ? "Partially Paid" : "Pending",
    stockDeducted: true,
    stockRestored: false
  };

  // Sale and stock changes are saved together.
  DB.update(db => {
    db.products ??= [];
    db.sales ??= [];
    db.movements ??= [];

    for (const item of sale.items) {
      const product = db.products.find(p => p.id === item.productId);
      const previousStock = Number(product.stock);
      product.stock = previousStock - item.quantity;

      db.movements.unshift({
        id: DB.id("MOV"),
        productId: product.id,
        productName: product.name,
        change: -item.quantity,
        previousStock,
        updatedStock: product.stock,
        reason: `Sale ${sale.invoiceNo}`,
        date: new Date().toISOString()
      });
    }

    db.sales.unshift(sale);
  });

  addActivity("Sale completed", `${sale.invoiceNo} — ${customer.name}`);
  addNotification(`Sale ${sale.invoiceNo} completed successfully.`, "info");

  sale.items.forEach(item => {
    const updated = getProducts().find(p => p.id === item.productId);
    if (updated && updated.stock <= updated.minimum) {
      addNotification(`${updated.name} has low stock (${updated.stock} left).`, "warning");
    }
    if (updated && updated.stock === 0) {
      addNotification(`${updated.name} is out of stock.`, "danger");
    }
  });

  renderSales();
  updateSalesSummary();
  renderStockMovements();
  populateProductSelect();
  refreshSalesCharts();
  viewInvoice(sale.id);
  resetSaleForm();
}

function renderSales() {
  const table = document.getElementById("salesTable");
  if (!table) return;

  const search = (document.getElementById("salesSearch")?.value || "").toLowerCase();
  const status = document.getElementById("statusFilter")?.value || "";
  const from = document.getElementById("filterFrom")?.value || "";
  const to = document.getElementById("filterTo")?.value || "";

  const sales = getSales().filter(sale => {
    const matchesSearch = `${sale.invoiceNo} ${sale.customer?.name || ""}`.toLowerCase().includes(search);
    const matchesStatus = !status || (status === "Cancelled"
      ? sale.status === "Cancelled"
      : sale.paymentStatus === status && sale.status !== "Cancelled");
    const matchesFrom = !from || sale.date >= from;
    const matchesTo = !to || sale.date <= to;
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  table.innerHTML = sales.length ? sales.map(sale => `
    <tr>
      <td><strong>${DB.escape(sale.invoiceNo)}</strong></td>
      <td>${DB.escape(sale.customer?.name || "Customer")}</td>
      <td>${DB.escape(sale.date)}</td>
      <td>${DB.money(sale.total)}</td>
      <td>${DB.money(sale.paid)}</td>
      <td><span class="badge ${sale.status === "Cancelled" ? "bad" : sale.paymentStatus === "Paid" ? "good" : "warn"}">${DB.escape(sale.status === "Cancelled" ? "Cancelled" : sale.paymentStatus)}</span></td>
      <td>
        <button class="action-btn" onclick="viewInvoice('${sale.id}')">Invoice</button>
        ${sale.status !== "Cancelled" && sale.remaining > 0 ? `<button class="action-btn" onclick="recordPayment('${sale.id}')">Payment</button>` : ""}
        ${sale.status !== "Cancelled" ? `<button class="action-btn danger" onclick="cancelSale('${sale.id}')">Cancel</button>` : ""}
      </td>
    </tr>
  `).join("") : `<tr><td colspan="7" class="empty">No sales found.</td></tr>`;
}

function clearSalesFilters() {
  ["salesSearch", "statusFilter", "filterFrom", "filterTo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderSales();
}

function updateSalesSummary() {
  const valid = getSales().filter(s => s.status !== "Cancelled");
  const revenue = valid.reduce((sum, s) => sum + Number(s.total), 0);
  const paid = valid.reduce((sum, s) => sum + Number(s.paid), 0);
  const pending = valid.reduce((sum, s) => sum + Number(s.remaining), 0);
  const units = valid.reduce((sum, s) => sum +
    s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  document.getElementById("totalSales").textContent = valid.length;
  document.getElementById("totalRevenue").textContent = DB.money(revenue);
  document.getElementById("totalPaid").textContent = DB.money(paid);
  document.getElementById("totalPending").textContent = DB.money(pending);
  document.getElementById("productsSold").textContent = units;
  document.getElementById("averageOrder").textContent = DB.money(valid.length ? revenue / valid.length : 0);
}

function recordPayment(id) {
  const sale = getSales().find(s => s.id === id);
  if (!sale || sale.status === "Cancelled" || sale.remaining <= 0) return;

  const amount = Number(prompt(`Remaining amount: ${DB.money(sale.remaining)}\nEnter payment received:`));
  if (!Number.isFinite(amount) || amount <= 0 || amount > sale.remaining) {
    alert("Enter a valid payment amount not greater than the remaining balance.");
    return;
  }

  DB.update(data => {
    const current = data.sales.find(s => s.id === id);
    current.paid = roundMoney(current.paid + amount);
    current.remaining = roundMoney(current.total - current.paid);
    current.paymentStatus = current.remaining <= 0 ? "Paid" : "Partially Paid";
    current.payments ??= [];
    current.payments.push({
      amount,
      date: new Date().toISOString(),
      method: current.paymentMethod
    });
  });

  addActivity("Payment received", `${sale.invoiceNo}: ${DB.money(amount)}`);
  addNotification(`Payment received for ${sale.invoiceNo}.`, "info");
  renderSales();
  updateSalesSummary();
  refreshSalesCharts();
}

function cancelSale(id) {
  const sale = getSales().find(s => s.id === id);
  if (!sale || sale.status === "Cancelled") return;

  if (!confirm(`Cancel ${sale.invoiceNo}? The sold stock will be returned.`)) return;

  DB.update(data => {
    const current = data.sales.find(s => s.id === id);
    if (!current || current.status === "Cancelled") return;

    if (current.stockDeducted && !current.stockRestored) {
      for (const item of current.items) {
        const product = data.products.find(p => p.id === item.productId);
        if (product) {
          const previousStock = product.stock;
          product.stock += item.quantity;
          data.movements.unshift({
            id: DB.id("MOV"),
            productId: product.id,
            productName: product.name,
            change: item.quantity,
            previousStock,
            updatedStock: product.stock,
            reason: `Cancelled sale ${current.invoiceNo}`,
            date: new Date().toISOString()
          });
        }
      }
      current.stockRestored = true;
    }

    current.status = "Cancelled";
    current.cancelledAt = new Date().toISOString();
  });

  addActivity("Sale cancelled", sale.invoiceNo);
  addNotification(`${sale.invoiceNo} was cancelled and stock restored.`, "warning");
  renderSales();
  updateSalesSummary();
  populateProductSelect();
  renderStockMovements();
  refreshSalesCharts();
}

function exportSalesCSV() {
  const rows = [["Invoice", "Customer", "Date", "Subtotal", "Discount", "Tax", "Total", "Paid", "Remaining", "Payment Status"]];
  getSales().forEach(s => rows.push([
    s.invoiceNo, s.customer?.name || "", s.date, s.subtotal,
    s.discount, s.tax, s.total, s.paid, s.remaining, s.paymentStatus
  ]));

  downloadCSV(rows, "sales-report.csv");
}

function downloadCSV(rows, filename) {
  const csv = rows.map(row => row.map(value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`
  ).join(",")).join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function refreshSalesCharts() {
  if (typeof Chart === "undefined") return;

  const sales = getSales().filter(s => s.status !== "Cancelled");
  const dailyCanvas = document.getElementById("dailySalesChart");
  const productCanvas = document.getElementById("topProductsChart");
  const paymentCanvas = document.getElementById("paymentChart");

  if (!dailyCanvas || !productCanvas || !paymentCanvas) return;

  const daily = {};
  sales.forEach(s => daily[s.date] = (daily[s.date] || 0) + s.total);
  const dailyLabels = Object.keys(daily).sort().slice(-7);

  const productTotals = {};
  sales.forEach(s => s.items.forEach(item => {
    productTotals[item.name] = (productTotals[item.name] || 0) + item.quantity;
  }));
  const top = Object.entries(productTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const counts = {
    Paid: sales.filter(s => s.paymentStatus === "Paid").length,
    Partially: sales.filter(s => s.paymentStatus === "Partially Paid").length,
    Pending: sales.filter(s => s.paymentStatus === "Pending").length
  };

  [dailyChart, topProductsChart, paymentChart].forEach(chart => {
    if (chart) chart.destroy();
  });

  dailyChart = new Chart(dailyCanvas, {
    type: "line",
    data: {
      labels: dailyLabels,
      datasets: [{
        label: "Sales revenue (₹)",
        data: dailyLabels.map(label => daily[label]),
        borderColor: "#6558d3",
        backgroundColor: "#6558d322",
        fill: true,
        tension: .35
      }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });

  topProductsChart = new Chart(productCanvas, {
    type: "bar",
    data: {
      labels: top.map(item => item[0]),
      datasets: [{
        label: "Units sold",
        data: top.map(item => item[1]),
        backgroundColor: "#8b80e8"
      }]
    },
    options: { responsive: true, indexAxis: "y" }
  });

  paymentChart = new Chart(paymentCanvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ["#13865f", "#e5a23c", "#d7475b"]
      }]
    },
    options: { responsive: true }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("saleForm");
  if (!form) return;

  document.getElementById("saleId").value = generateSaleId();
  document.getElementById("saleDate").value = new Date().toISOString().slice(0, 10);

  populateProductSelect();
  renderSaleItems();
  renderSales();
  updateSalesSummary();
  renderStockMovements();
  renderActivity();
  renderNotifications();
  refreshSalesCharts();

  document.getElementById("productSelect").addEventListener("change", updateSelectedProduct);
  document.getElementById("paymentAmount").addEventListener("input", calculateSale);
  document.getElementById("discountType").addEventListener("change", calculateSale);
  document.getElementById("discountValue").addEventListener("input", calculateSale);
  document.getElementById("taxRate").addEventListener("input", calculateSale);
  form.addEventListener("submit", finalizeSale);

  calculateSale();
});

window.addEventListener("inventoryUpdated", () => {
  if (!document.getElementById("saleForm")) return;
  renderSales();
  updateSalesSummary();
  populateProductSelect();
  refreshSalesCharts();
});
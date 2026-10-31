function loadDashboard() {
  const data = DB.read();
  const products = data.products || [];
  const sales = (data.sales || []).filter(s => s.status !== "Cancelled");

  const stock = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const value = products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);
  const low = products.filter(p => p.stock <= p.minimum).length;
  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

  setText("dashProducts", products.length);
  setText("dashStock", stock);
  setText("dashValue", DB.money(value));
  setText("dashLow", low);
  setText("dashSales", sales.length);
  setText("dashRevenue", DB.money(revenue));

  const recent = document.getElementById("recentSales");
  if (recent) {
    recent.innerHTML = sales.length ? sales.slice(0, 5).map(s => `
      <tr>
        <td>${DB.escape(s.invoiceNo)}</td>
        <td>${DB.escape(s.customer?.name || "")}</td>
        <td>${DB.escape(s.date)}</td>
        <td>${DB.money(s.total)}</td>
        <td><span class="badge ${s.paymentStatus === "Paid" ? "good" : "warn"}">${DB.escape(s.paymentStatus)}</span></td>
      </tr>
    `).join("") : `<tr><td colspan="5" class="empty">No sales recorded yet.</td></tr>`;
  }

  const date = document.getElementById("todayDate");
  if (date) date.textContent = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function loadReports() {
  const data = DB.read();
  const products = data.products || [];
  const sales = (data.sales || []).filter(s => s.status !== "Cancelled");

  const stock = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const value = products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);
  const low = products.filter(p => p.stock > 0 && p.stock <= p.minimum);
  const out = products.filter(p => p.stock === 0);
  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

  setText("reportProducts", products.length);
  setText("reportStock", stock);
  setText("reportValue", DB.money(value));
  setText("reportLow", low.length);
  setText("reportOut", out.length);
  setText("reportRevenue", DB.money(revenue));

  const table = document.getElementById("reportTable");
  if (table) {
    table.innerHTML = products.length ? products.map(p => {
      const status = p.stock <= 0 ? "Out of Stock" :
        p.stock <= p.minimum ? "Low Stock" : "In Stock";
      return `<tr>
        <td>${DB.escape(p.name)}</td>
        <td>${DB.escape(p.category)}</td>
        <td>${DB.money(p.price)}</td>
        <td>${p.stock}</td>
        <td>${DB.money(p.price * p.stock)}</td>
        <td>${status}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" class="empty">No products available.</td></tr>`;
  }

  const lowList = document.getElementById("lowStockList");
  if (lowList) {
    const alerts = products.filter(p => p.stock <= p.minimum);
    lowList.innerHTML = alerts.length ? alerts.map(p => `
      <li><strong>${DB.escape(p.name)}</strong> — ${p.stock} units remaining</li>
    `).join("") : "<li>All products have sufficient stock.</li>";
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function exportInventoryCSV() {
  const products = DB.read().products || [];
  const rows = [["Product", "Category", "Price", "Cost", "Stock", "Value", "Status"]];

  products.forEach(p => rows.push([
    p.name, p.category, p.price, p.cost, p.stock,
    p.price * p.stock,
    p.stock <= 0 ? "Out of Stock" : p.stock <= p.minimum ? "Low Stock" : "In Stock"
  ]));

  const csv = rows.map(row => row.map(value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`
  ).join(",")).join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadReports();
});

window.addEventListener("inventoryUpdated", () => {
  loadDashboard();
  loadReports();
});
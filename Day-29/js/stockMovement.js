function addStockMovement(productId, productName, change, reason) {
  DB.update(data => {
    data.movements ??= [];
    data.movements.unshift({
      id: DB.id("MOV"),
      productId,
      productName,
      change,
      reason,
      date: new Date().toISOString()
    });
    data.movements = data.movements.slice(0, 500);
  });
  renderStockMovements();
}

function renderStockMovements() {
  const table = document.getElementById("movementTable");
  if (!table) return;

  const movements = DB.read().movements || [];
  table.innerHTML = movements.length ? movements.slice(0, 30).map(m => `
    <tr>
      <td>${DB.escape(m.productName)}</td>
      <td>${m.change > 0 ? "+" : ""}${m.change}</td>
      <td>${DB.escape(m.reason)}</td>
      <td>${new Date(m.date).toLocaleString("en-IN")}</td>
    </tr>
  `).join("") : `<tr><td colspan="4" class="empty">No stock movements recorded.</td></tr>`;
}

document.addEventListener("DOMContentLoaded", renderStockMovements);
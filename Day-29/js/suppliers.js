function renderSuppliers() {
  const list = document.getElementById("supplierList");
  if (!list) return;

  const suppliers = DB.read().suppliers || [];
  list.innerHTML = suppliers.length ? suppliers.map(s => `
    <li><strong>${DB.escape(s.name)}</strong><br>
      ${DB.escape(s.phone || "")} · ${DB.escape(s.email || "")}
      <button class="action-btn danger" onclick="deleteSupplier('${s.id}')">Delete</button>
    </li>
  `).join("") : "<li>No suppliers added.</li>";
}

function deleteSupplier(id) {
  const supplier = (DB.read().suppliers || []).find(s => s.id === id);
  if (!supplier || !confirm(`Delete supplier ${supplier.name}?`)) return;

  DB.update(data => {
    data.suppliers = data.suppliers.filter(s => s.id !== id);
  });
  renderSuppliers();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("supplierForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const supplier = {
      id: DB.id("SUP"),
      name: document.getElementById("supplierName").value.trim(),
      phone: document.getElementById("supplierPhone").value.trim(),
      email: document.getElementById("supplierEmail").value.trim()
    };

    if (!supplier.name) return;

    DB.update(data => {
      data.suppliers.push(supplier);
    });

    form.reset();
    renderSuppliers();
    addActivity("Supplier added", supplier.name);
  });

  renderSuppliers();
});
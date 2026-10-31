function openProductForm(product = null) {
  const form = document.getElementById("productForm");
  if (!form) return;

  form.classList.remove("hidden");
  document.getElementById("productEditId").value = product?.id || "";
  document.getElementById("productName").value = product?.name || "";
  document.getElementById("productCategory").value = product?.category || "";
  document.getElementById("productPrice").value = product?.price ?? "";
  document.getElementById("productCost").value = product?.cost ?? 0;
  document.getElementById("productStock").value = product?.stock ?? "";
  document.getElementById("productMinimum").value = product?.minimum ?? 10;
}

function closeProductForm() {
  const form = document.getElementById("productForm");
  if (form) {
    form.reset();
    form.classList.add("hidden");
  }
}

function renderProducts() {
  const table = document.getElementById("productTable");
  if (!table) return;

  const products = DB.read().products || [];
  table.innerHTML = products.length ? products.map(p => {
    const status = p.stock <= 0 ? "Out of Stock" :
      p.stock <= p.minimum ? "Low Stock" : "In Stock";
    const cls = p.stock <= 0 ? "bad" : p.stock <= p.minimum ? "warn" : "good";

    return `<tr>
      <td><strong>${DB.escape(p.name)}</strong><br><small>${DB.escape(p.id)}</small></td>
      <td>${DB.escape(p.category)}</td>
      <td>${DB.money(p.price)}</td>
      <td>${DB.money(p.cost)}</td>
      <td>${p.stock}</td>
      <td><span class="badge ${cls}">${status}</span></td>
      <td><button class="action-btn" onclick="editProduct('${p.id}')">Edit</button>
      <button class="action-btn danger" onclick="deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="7" class="empty">No products available.</td></tr>`;
}

function editProduct(id) {
  const product = (DB.read().products || []).find(p => p.id === id);
  if (product) openProductForm(product);
}

function deleteProduct(id) {
  const data = DB.read();
  const product = data.products.find(p => p.id === id);
  if (!product) return;

  if (!confirm(`Delete ${product.name}?`)) return;

  DB.update(db => {
    db.products = db.products.filter(p => p.id !== id);
  });

  addActivity("Product deleted", product.name);
  addNotification(`Product ${product.name} was deleted.`, "warning");
  renderProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("productEditId").value;
    const product = {
      id: id || DB.id("PRD"),
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      cost: Number(document.getElementById("productCost").value),
      stock: Number(document.getElementById("productStock").value),
      minimum: Number(document.getElementById("productMinimum").value)
    };

    if (!product.name || !product.category || product.price <= 0 ||
        product.cost < 0 || product.stock < 0 || product.minimum < 0) {
      alert("Please enter valid product details.");
      return;
    }

    DB.update(data => {
      const index = data.products.findIndex(p => p.id === id);
      if (index >= 0) data.products[index] = product;
      else data.products.push(product);
    });

    addActivity(id ? "Product updated" : "Product added", product.name);
    addNotification(`${product.name} ${id ? "was updated" : "was added"}.`, "info");
    closeProductForm();
    renderProducts();
    if (typeof loadDashboard === "function") loadDashboard();
  });

  renderProducts();
});
function renderCustomers() {
  const table = document.getElementById("customerTable");
  if (!table) return;

  const search = (document.getElementById("customerSearch")?.value || "").toLowerCase();
  const customers = (DB.read().customers || []).filter(c =>
    `${c.name} ${c.phone} ${c.email} ${c.id}`.toLowerCase().includes(search)
  );

  table.innerHTML = customers.length ? customers.map(c => `
    <tr>
      <td>${DB.escape(c.id)}</td>
      <td>${DB.escape(c.name)}</td>
      <td>${DB.escape(c.phone)}</td>
      <td>${DB.escape(c.email || "-")}</td>
      <td><button class="action-btn" onclick="editCustomer('${c.id}')">Edit</button>
      <button class="action-btn danger" onclick="deleteCustomer('${c.id}')">Delete</button></td>
    </tr>
  `).join("") : `<tr><td colspan="5" class="empty">No customers found.</td></tr>`;

  populateCustomerSelect();
}

function populateCustomerSelect() {
  const select = document.getElementById("saleCustomer");
  if (!select) return;

  const previous = select.value;
  const customers = DB.read().customers || [];
  select.innerHTML = `<option value="">Select customer</option>` +
    customers.map(c => `<option value="${c.id}">${DB.escape(c.name)} — ${DB.escape(c.phone)}</option>`).join("");

  if (customers.some(c => c.id === previous)) select.value = previous;
}

function resetCustomerForm() {
  const form = document.getElementById("customerForm");
  if (form) form.reset();
  document.getElementById("customerEditId").value = "";
}

function editCustomer(id) {
  const c = (DB.read().customers || []).find(x => x.id === id);
  if (!c) return;

  document.getElementById("customerEditId").value = c.id;
  document.getElementById("customerName").value = c.name;
  document.getElementById("customerPhone").value = c.phone;
  document.getElementById("customerEmail").value = c.email || "";
  document.getElementById("customerAddress").value = c.address || "";
  document.getElementById("customerName").focus();
}

function deleteCustomer(id) {
  const data = DB.read();
  const customer = data.customers.find(c => c.id === id);
  if (!customer) return;

  if (data.sales.some(s => s.customerId === id && s.status !== "Cancelled")) {
    alert("This customer has sales history and cannot be deleted.");
    return;
  }

  if (!confirm(`Delete ${customer.name}?`)) return;

  DB.update(db => {
    db.customers = db.customers.filter(c => c.id !== id);
  });
  renderCustomers();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("customerForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("customerEditId").value;
    const customer = {
      id: id || DB.id("CUS"),
      name: document.getElementById("customerName").value.trim(),
      phone: document.getElementById("customerPhone").value.trim(),
      email: document.getElementById("customerEmail").value.trim(),
      address: document.getElementById("customerAddress").value.trim()
    };

    if (!customer.name || !/^[6-9]\d{9}$/.test(customer.phone)) {
      alert("Enter a customer name and a valid 10-digit Indian mobile number.");
      return;
    }

    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      alert("Enter a valid email address.");
      return;
    }

    DB.update(data => {
      const index = data.customers.findIndex(c => c.id === id);
      if (index >= 0) data.customers[index] = customer;
      else data.customers.push(customer);
    });

    addActivity(id ? "Customer updated" : "Customer added", customer.name);
    resetCustomerForm();
    renderCustomers();
  });

  renderCustomers();
});
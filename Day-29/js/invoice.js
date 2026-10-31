function viewInvoice(id) {
  const sale = (DB.read().sales || []).find(s => s.id === id);
  if (!sale) {
    alert("Invoice not found.");
    return;
  }

  const customer = sale.customer || {};
  const content = document.getElementById("invoiceContent");
  if (!content) return;

  content.innerHTML = `
    <div class="invoice-header">
      <div>
        <h1>✦ STOCKIFY</h1>
        <p>Inventory & Sales Management</p>
        <p>India</p>
      </div>
      <div>
        <h2>INVOICE</h2>
        <strong>${DB.escape(sale.invoiceNo)}</strong>
        <p>Date: ${DB.escape(sale.date)}</p>
        <p>Status: ${DB.escape(sale.status)}</p>
      </div>
    </div>

    <div class="invoice-info">
      <div>
        <strong>Bill To</strong>
        <h3>${DB.escape(customer.name || "Customer")}</h3>
        <p>${DB.escape(customer.phone || "")}</p>
        <p>${DB.escape(customer.email || "")}</p>
        <p>${DB.escape(customer.address || "")}</p>
      </div>
      <div>
        <strong>Payment Details</strong>
        <p>Method: ${DB.escape(sale.paymentMethod)}</p>
        <p>Payment: ${DB.escape(sale.paymentStatus)}</p>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Amount</th></tr></thead>
        <tbody>
          ${sale.items.map(item => `
            <tr>
              <td>${DB.escape(item.name)}</td>
              <td>${DB.money(item.price)}</td>
              <td>${item.quantity}</td>
              <td>${DB.money(item.price * item.quantity)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="invoice-total">
      <p>Subtotal <strong>${DB.money(sale.subtotal)}</strong></p>
      <p>Discount <strong>${DB.money(sale.discount)}</strong></p>
      <p>Tax <strong>${DB.money(sale.tax)}</strong></p>
      <p class="invoice-grand">Grand Total <strong>${DB.money(sale.total)}</strong></p>
      <p>Amount Received <strong>${DB.money(sale.paid)}</strong></p>
      <p>Balance Due <strong>${DB.money(sale.remaining)}</strong></p>
    </div>

    ${sale.status === "Cancelled" ? "<h3>THIS INVOICE HAS BEEN CANCELLED</h3>" : ""}
    <p style="text-align:center;margin-top:35px">Thank you for your business!</p>
  `;

  document.getElementById("invoiceModal").classList.remove("hidden");
}

function printInvoice() {
  window.print();
}

function closeInvoice() {
  document.getElementById("invoiceModal")?.classList.add("hidden");
}
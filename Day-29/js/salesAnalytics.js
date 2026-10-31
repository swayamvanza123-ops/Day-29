
let dailyChart = null;
let productChart = null;
let paymentStatusChart = null;

function getFilteredAnalyticsSales() {
    const data = DB.read();

    const customer = document.getElementById("analyticsCustomer")?.value || "";
    const from = document.getElementById("filterFrom")?.value || "";
    const to = document.getElementById("filterTo")?.value || "";

    return data.sales.filter(s =>
        s.status !== "Cancelled" &&
        (!customer || s.customerId === customer) &&
        (!from || s.saleDate >= from) &&
        (!to || s.saleDate <= to)
    );
}

function refreshSalesAnalytics() {
    if (typeof Chart === "undefined") return;

    const sales = getFilteredAnalyticsSales();

    // Daily sales chart
    const daily = {};

    sales.forEach(s => {
        daily[s.saleDate] = (daily[s.saleDate] || 0) + s.grandTotal;
    });

    const dates = Object.keys(daily).sort();

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(document.getElementById("dailySalesChart"), {
        type: "line",
        data: {
            labels: dates,
            datasets: [{
                label: "Sales Revenue (₹)",
                data: dates.map(date => Math.round(daily[date] * 100) / 100),
                borderColor: "#6558d3",
                backgroundColor: "rgba(101,88,211,.13)",
                fill: true,
                tension: .35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {y: {beginAtZero: true}}
        }
    });

    // Top five products
    const products = {};

    sales.forEach(s => s.items.forEach(item => {
        products[item.productName] =
            (products[item.productName] || 0) + item.quantity;
    }));

    const top = Object.entries(products)
        .sort((a,b) => b[1] - a[1])
        .slice(0,5);

    if (productChart) productChart.destroy();

    productChart = new Chart(document.getElementById("topProductsChart"), {
        type: "bar",
        data: {
            labels: top.map(x => x[0]),
            datasets: [{
                label: "Quantity Sold",
                data: top.map(x => x[1]),
                backgroundColor: ["#6558d3","#8b7fea","#a99ff1","#bcb5f5","#d1ccfa"],
                borderRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {y: {beginAtZero: true}}
        }
    });

    // Payment status chart
    const statuses = {
        Paid: 0,
        Pending: 0,
        "Partially Paid": 0
    };

    sales.forEach(s => {
        if (statuses[s.paymentStatus] !== undefined) {
            statuses[s.paymentStatus]++;
        }
    });

    if (paymentStatusChart) paymentStatusChart.destroy();

    paymentStatusChart = new Chart(document.getElementById("paymentChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(statuses),
            datasets: [{
                data: Object.values(statuses),
                backgroundColor: ["#13865f","#e5a23c","#6558d3"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {legend: {position:"bottom"}}
        }
    });
}

function populateAnalyticsCustomer() {
    const select = document.getElementById("analyticsCustomer");
    if (!select) return;

    const current = select.value;

    select.innerHTML = '<option value="">All Customers</option>';

    DB.read().customers.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        select.appendChild(option);
    });

    select.value = current;
}

function clearAnalyticsFilters() {
    document.getElementById("analyticsCustomer").value = "";
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";

    renderSales();
    refreshSalesAnalytics();
}

document.addEventListener("DOMContentLoaded", () => {
    populateAnalyticsCustomer();
    refreshSalesAnalytics();
});

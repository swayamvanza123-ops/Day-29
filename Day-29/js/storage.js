const DB_KEY = "day30_inventory_system";

const DB = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY)) || {};
    } catch (error) {
      console.error("Could not read saved data:", error);
      return {};
    }
  },

  write(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("inventoryUpdated"));
  },

  update(callback) {
    const data = this.read();
    callback(data);
    this.write(data);
  },

  id(prefix = "ID") {
    return prefix + "-" + Date.now().toString(36).toUpperCase() +
      "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  },

  money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(Number(value) || 0);
  },

  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;"
    })[char]);
  },

  seed() {
    const data = this.read();
    data.products ??= [];
    data.categories ??= ["Electronics", "Accessories", "Furniture", "Other"];
    data.suppliers ??= [];
    data.customers ??= [];
    data.sales ??= [];
    data.movements ??= [];
    data.activities ??= [];
    data.notifications ??= [];

    if (data.products.length === 0) {
      data.products = [
        { id: this.id("PRD"), name: "Laptop", category: "Electronics", price: 50000, cost: 40000, stock: 20, minimum: 5 },
        { id: this.id("PRD"), name: "Mouse", category: "Accessories", price: 800, cost: 400, stock: 50, minimum: 10 },
        { id: this.id("PRD"), name: "Keyboard", category: "Accessories", price: 1500, cost: 900, stock: 35, minimum: 10 },
        { id: this.id("PRD"), name: "Monitor", category: "Electronics", price: 12000, cost: 9500, stock: 10, minimum: 5 },
        { id: this.id("PRD"), name: "Printer", category: "Electronics", price: 15000, cost: 11000, stock: 5, minimum: 5 }
      ];
    }

    this.write(data);
  }
};

DB.seed();
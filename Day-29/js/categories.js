function renderCategories() {
  const list = document.getElementById("categoryList");
  if (!list) return;

  const categories = DB.read().categories || [];
  list.innerHTML = categories.length
    ? categories.map(category => `
      <li>${DB.escape(category)}
      <button class="action-btn danger" onclick="deleteCategory('${encodeURIComponent(category)}')">Delete</button></li>
    `).join("")
    : "<li>No categories added.</li>";
}

function deleteCategory(encoded) {
  const category = decodeURIComponent(encoded);
  const data = DB.read();

  if (data.products.some(p => p.category === category)) {
    alert("This category is assigned to products. Change those products first.");
    return;
  }

  if (!confirm(`Delete category ${category}?`)) return;

  DB.update(db => {
    db.categories = db.categories.filter(c => c !== category);
  });
  renderCategories();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("categoryForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("categoryName");
    const name = input.value.trim();

    if (!name) return;

    DB.update(data => {
      data.categories ??= [];
      if (!data.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
        data.categories.push(name);
      }
    });

    input.value = "";
    renderCategories();
  });

  renderCategories();
});
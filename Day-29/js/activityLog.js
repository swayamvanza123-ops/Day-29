function addActivity(action, details = "") {
  DB.update(data => {
    data.activities ??= [];
    data.activities.unshift({
      id: DB.id("ACT"),
      action,
      details,
      date: new Date().toISOString()
    });
    data.activities = data.activities.slice(0, 300);
  });
  renderActivity();
}

function renderActivity() {
  const list = document.getElementById("activityList");
  if (!list) return;

  const activities = DB.read().activities || [];
  list.innerHTML = activities.length
    ? activities.slice(0, 12).map(item => `
      <li><strong>${DB.escape(item.action)}</strong>
      — ${DB.escape(item.details)}
      <small>${new Date(item.date).toLocaleString("en-IN")}</small></li>
    `).join("")
    : "<li>No activity recorded yet.</li>";
}

document.addEventListener("DOMContentLoaded", renderActivity);
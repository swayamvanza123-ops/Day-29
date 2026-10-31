function addNotification(message, type = "info") {
  DB.update(data => {
    data.notifications ??= [];
    data.notifications.unshift({
      id: DB.id("NOT"),
      message,
      type,
      read: false,
      date: new Date().toISOString()
    });
    data.notifications = data.notifications.slice(0, 200);
  });
  renderNotifications();
}

function markNotificationRead(id) {
  DB.update(data => {
    const item = (data.notifications || []).find(n => n.id === id);
    if (item) item.read = true;
  });
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById("notificationList");
  if (!list) return;

  const notifications = DB.read().notifications || [];
  list.innerHTML = notifications.length
    ? notifications.slice(0, 15).map(item => `
      <li>
        <span class="badge ${item.type === "warning" ? "warn" : item.type === "danger" ? "bad" : "good"}">${item.type}</span>
        ${DB.escape(item.message)}
        ${item.read ? "" : `<button class="action-btn" onclick="markNotificationRead('${item.id}')">Mark read</button>`}
      </li>
    `).join("")
    : "<li>No notifications.</li>";
}

document.addEventListener("DOMContentLoaded", renderNotifications);
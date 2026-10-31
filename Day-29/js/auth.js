function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const error = document.getElementById("loginError");

  if (email === "admin@gmail.com" && password === "admin123") {
    sessionStorage.setItem("day30_logged_in", "true");
    window.location.href = "index.html";
  } else {
    error.textContent = "Incorrect email or password. Please try again.";
  }
}

function logout() {
  sessionStorage.removeItem("day30_logged_in");
  window.location.href = "login.html";
}

function protectPage() {
  const onLoginPage = Boolean(document.getElementById("loginForm"));

  if (onLoginPage) {
    document.getElementById("loginForm").addEventListener("submit", login);

    if (sessionStorage.getItem("day30_logged_in") === "true") {
      window.location.href = "index.html";
    }
  } else if (sessionStorage.getItem("day30_logged_in") !== "true") {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", protectPage);
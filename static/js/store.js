document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://127.0.0.1:5000/api";
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    const toast = document.getElementById("toast");
    const logoutBtn = document.getElementById("logout-btn");

    function showMessage(msg, error = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = error ? "#b91c1c" : "#065f46";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    });
});


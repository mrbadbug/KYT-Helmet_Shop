document.addEventListener("DOMContentLoaded", () => {
    const cartSidebar = document.getElementById("cart-sidebar");
    const openCartBtn = document.getElementById("open-cart");
    const closeCartBtn = document.getElementById("close-cart");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    const cartCountEl = document.getElementById("cart-count");
    const logoutBtn = document.getElementById("logout-btn");
    const checkoutBtn = document.getElementById("sidebar-checkout");
    const toast = document.getElementById("toast");

    let cart = [];

    // --------------- Toast ----------------
    function showMessage(msg, error = false) {
        toast.textContent = msg;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.padding = "10px 20px";
        toast.style.backgroundColor = error ? "#b91c1c" : "#065f46";
        toast.style.color = "#fff";
        toast.style.borderRadius = "5px";
        toast.style.zIndex = "1000";
        toast.style.opacity = "1";
        setTimeout(() => toast.style.opacity = "0", 2500);
    }

    // --------------- Logout ----------------
    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    });

    // --------------- Cart Sidebar ----------------
    openCartBtn?.addEventListener("click", () => cartSidebar.classList.remove("translate-x-full"));
    closeCartBtn?.addEventListener("click", () => cartSidebar.classList.add("translate-x-full"));

    // Click outside cart to close
    document.addEventListener("click", (e) => {
        if (!cartSidebar.contains(e.target) && !openCartBtn.contains(e.target)) {
            cartSidebar.classList.add("translate-x-full");
        }
    });

    // --------------- Update Cart ----------------
    function updateCartSidebar() {
        cartItemsContainer.innerHTML = "";
        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * (item.quantity || 1);

            const div = document.createElement("div");
            div.className = "flex justify-between items-center p-2 border rounded shadow-sm";

            div.innerHTML = `
                <div>
                    <h3 class="font-bold">${item.name}</h3>
                    <p>$${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="text-red-600 font-bold remove-btn">&times;</button>
                    <input type="number" min="1" value="${item.quantity || 1}" class="w-12 p-1 border rounded text-center">
                </div>
            `;

            div.querySelector(".remove-btn").addEventListener("click", () => {
                cart.splice(index, 1);
                updateCartSidebar();
                updateCartCount();
            });

            div.querySelector("input").addEventListener("change", e => {
                const q = Math.max(1, parseInt(e.target.value));
                item.quantity = q;
                updateCartSidebar();
                updateCartCount();
            });

            cartItemsContainer.appendChild(div);
        });

        cartTotalEl.textContent = total.toFixed(2);
    }

    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCountEl.textContent = count;
    }

    // --------------- Add to Cart ----------------
    const addButtons = document.querySelectorAll(".product-card button");

    addButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".product-card");
            const name = card.querySelector("h3").textContent;
            const priceEl = Array.from(card.querySelectorAll("p")).find(p => p.classList.contains("font-bold"));
            const price = parseFloat(priceEl.textContent.replace("$", ""));
            const existing = cart.find(item => item.name === name);

            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                cart.push({ name, price, quantity: 1 });
            }

            updateCartCount();
            updateCartSidebar();
            showMessage(`${name} added to cart!`);
        });
    });

    // --------------- Checkout Button ----------------
    checkoutBtn?.addEventListener("click", () => {
        if (cart.length === 0) {
            showMessage("Cart is empty!", true);
            return;
        }
        showMessage("The order has been placed successfully!");
        cart = [];
        updateCartSidebar();
        updateCartCount();
        cartSidebar.classList.add("translate-x-full");
    });
});

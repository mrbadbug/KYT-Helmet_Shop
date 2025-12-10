document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://127.0.0.1:5000/api";
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    const productsGrid = document.getElementById("products-grid");
    const cartCount = document.getElementById("cart-count");
    const toast = document.getElementById("toast");
    const logoutBtn = document.getElementById("logout-btn");

    // Cart Sidebar Elements
    const cartSidebar = document.getElementById("cart-sidebar");
    const openCartBtn = document.getElementById("open-cart");
    const closeCartBtn = document.getElementById("close-cart");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    const sidebarCheckoutBtn = document.getElementById("sidebar-checkout");

    let cart = [];

    // --------------- Toast ---------------
    function showMessage(msg, error = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = error ? "#b91c1c" : "#065f46";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
    }

    // --------------- Logout ---------------
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    });

    // --------------- Cart Sidebar ---------------
    // Open cart sidebar
    openCartBtn.addEventListener("click", () => {
        cartSidebar.classList.remove("translate-x-full");
        cartSidebar.classList.add("translate-x-0");
    });

    // Close cart sidebar when clicking the close button
    closeCartBtn.addEventListener("click", () => {
        cartSidebar.classList.remove("translate-x-0");
        cartSidebar.classList.add("translate-x-full");
    });

    // Close when clicking outside the sidebar
    document.addEventListener("click", (e) => {
        // Check if click is outside sidebar AND outside the open button
        if (!cartSidebar.contains(e.target) && !openCartBtn.contains(e.target)) {
            cartSidebar.classList.remove("translate-x-0");
            cartSidebar.classList.add("translate-x-full");
        }
    });


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

            // Remove item
            div.querySelector(".remove-btn").addEventListener("click", () => {
                cart.splice(index, 1);
                updateCartSidebar();
                updateCartCount();
            });

            // Quantity change
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
        cartCount.textContent = count;
    }

    // --------------- Checkout ---------------
    sidebarCheckoutBtn.addEventListener("click", async () => {
        if (cart.length === 0) return showMessage("Cart is empty", true);

        const totalAmount = cart.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        const orderData = {
            total_amount: totalAmount,
            shipping_info: {
                name: "John Doe",
                address: "123 Main St",
                city: "City",
                country: "Country",
                postal_code: "00000"
            },
            products: cart.map(p => ({ id: p.id, name: p.name, price: p.price, quantity: p.quantity || 1 }))
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("Order placed successfully!");
                cart = [];
                updateCartSidebar();
                updateCartCount();
                cartSidebar.classList.add("translate-x-full");
            } else {
                showMessage(data.message || "Checkout failed", true);
            }
        } catch (e) {
            showMessage("Cannot connect to backend", true);
        }
    });

    // --------------- Initialize ---------------
    loadProducts();
});


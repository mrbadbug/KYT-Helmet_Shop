const API_URL = "/api";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showRegisterBtn = document.getElementById("show-register-form");
const showLoginBtn = document.getElementById("show-login-form");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const messageArea = document.getElementById("message-area");

if (localStorage.getItem("access_token")) window.location.href = "/store";

function showMessage(msg, error=false){
    messageArea.textContent = msg;
    messageArea.style.backgroundColor = error?"#fee2e2":"#d1fae5";
    messageArea.style.color = error?"#b91c1c":"#065f46";
}

// Toggle forms
showRegisterBtn.addEventListener("click", ()=>{loginForm.classList.add("hidden");registerForm.classList.remove("hidden");messageArea.innerHTML=""});
showLoginBtn.addEventListener("click", ()=>{registerForm.classList.add("hidden");loginForm.classList.remove("hidden");messageArea.innerHTML=""});

// Register
registerButton.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const surname = document.getElementById("surname").value;
    const password = document.getElementById("register-password").value;
    const retype = document.getElementById("retype-password").value;
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const mobile = document.getElementById("register-phone").value;

    if (!name || !surname || !retype || !username || !email || !password || !mobile)
        return showMessage("You must fill all fields", true);

    // ✅ Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email))
        return showMessage("Please enter a valid email address.", true);

    // ✅ Mobile validation (10 digits - you can change as needed)
    const mobilePattern = /^[0-9]{10}$/;
    if (!mobilePattern.test(mobile))
        return showMessage("Please enter a valid 10-digit mobile number.", true);

    if (password !== retype)
        return showMessage("Passwords don't match!", true);

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, mobile, password })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage("Registered Successfully! Please login to continue.");
            showLoginBtn.click();
        } else {
            showMessage(data.message || "Registration failed", true);
        }
    } catch (e) {
        showMessage("Invalid email or password!", true);
    }
});



// Login
loginButton.addEventListener("click", async ()=>{
    const email=document.getElementById("login-email").value;
    const password=document.getElementById("login-password").value;
    if(!email||!password) return showMessage("Provide Email and Password", true);

    try{
        const res=await fetch(`${API_URL}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
        const data=await res.json();
        if(res.ok){localStorage.setItem("access_token", data.access_token);window.location.href="/store";}
        else showMessage(data.message||"Login failed", true);
    } catch(e){showMessage("Cannot connect to backend", true);}
});

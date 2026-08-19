/* ==========================================================
   FoodExpress Premium Single Page Application Engine (Supabase Integrated)
   ========================================================== */

const SUPABASE_URL = "https://iquhouefedyzyvlwiwha.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdWhvdWVmZWR5enl2bHdpd2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjYyNDMsImV4cCI6MjA5NDg0MjI0M30.coVCyG4ZHYnKKZQtQ-tO3Sl1xynbY6OGzSCyoBcDeVo";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

// --- APPLICATION STATE ---
let state = {
  currentUser: null,      // { id, name, role (1=User, 2=Hotel, 3=DP, 4=Admin) }
  currentRestaurant: null,// Currently selected restaurant for browsing menu
  cart: [],               // Array of { id, name, price, qty }
  activeOrderPolling: null,// Interval ID for live tracking
  selectedPaymentType: "1",// 1=Cash, 2=Card, 3=UPI
  appliedCoupon: "",      // Currently active coupon code
  appliedDiscount: 0.0,   // Calculated discount value
};

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// --- HELPER: SUPABASE HTTP FETCH ---
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const mergedHeaders = {
    ...HEADERS,
    ...(options.headers || {})
  };
  const mergedOptions = {
    ...options,
    headers: mergedHeaders
  };
  return await fetch(url, mergedOptions);
}

// --- INITIALIZATION ---
async function initApp() {
  setupEventListeners();
  
  // 1) Check Session Persistence
  const savedUser = localStorage.getItem("food_express_user");
  if (savedUser) {
    state.currentUser = JSON.parse(savedUser);
    showDashboardForRole(state.currentUser.role);
    showToast(`Welcome back, ${state.currentUser.name}!`, "success");
    return;
  }

  // 2) Autodetect Database Setup
  try {
    const res = await supabaseFetch("restaurant?limit=1");
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        // Connection is working and database is seeded
        const indicator = document.getElementById("db-status-indicator");
        if (indicator) {
          indicator.textContent = "CONNECTED & SEEDED";
          indicator.className = "status-indicator success";
        }
        navigateTo("auth-view");
        return;
      }
    }
    navigateTo("setup-view");
  } catch (e) {
    navigateTo("setup-view");
  }
}

// --- SPA ROUTER & NAVIGATION ---
function navigateTo(viewId) {
  // Hide all views
  document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
  
  // Show target view
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hidden");
  }

  // Header Management
  const header = document.getElementById("app-header");
  if (viewId === "setup-view" || viewId === "auth-view") {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
    updateHeader();
  }

  // Toggle floating cart button visibility based on view & role
  const floatingCartBtn = document.getElementById("floating-cart-btn");
  if (floatingCartBtn) {
    if (viewId === "customer-view" && state.currentUser && state.currentUser.role === 1) {
      floatingCartBtn.classList.remove("hidden");
    } else {
      floatingCartBtn.classList.add("hidden");
      closeCart();
    }
  }

  // Stop tracking pollers if navigating away from tracking
  if (viewId !== "tracking-view" && state.activeOrderPolling) {
    clearInterval(state.activeOrderPolling);
    state.activeOrderPolling = null;
  }
}

function updateHeader() {
  const nameSpan = document.getElementById("header-user-name");
  const roleSpan = document.getElementById("header-user-role");

  if (state.currentUser) {
    nameSpan.textContent = `Welcome, ${state.currentUser.name}`;
    
    let roleText = "Customer";
    if (state.currentUser.role === 2) roleText = "Restaurant";
    if (state.currentUser.role === 3) roleText = "Delivery";
    if (state.currentUser.role === 4) roleText = "Admin";
    
    roleSpan.textContent = roleText;
  }

  // Toggle header cart button visibility
  const headerCartBtn = document.getElementById("header-cart-btn");
  if (headerCartBtn) {
    if (state.currentUser && state.currentUser.role === 1) {
      headerCartBtn.classList.remove("hidden");
    } else {
      headerCartBtn.classList.add("hidden");
    }
  }
}

function showDashboardForRole(role) {
  if (role === 1) {
    navigateTo("customer-view");
    loadRestaurants();
    resetCart();
  } else if (role === 2) {
    navigateTo("restaurant-view");
    loadRestaurantDashboard();
  } else if (role === 3) {
    navigateTo("delivery-view");
    loadDeliveryDashboard();
  } else if (role === 4) {
    navigateTo("admin-view");
    loadAdminDashboard();
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // 1) Setup DB button & Copy schema button
  document.getElementById("run-setup-btn").addEventListener("click", runDatabaseSetup);
  document.getElementById("copy-sql-btn").addEventListener("click", copySqlSchemaToClipboard);
  
  document.getElementById("bypass-setup-link").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("auth-view");
  });

  // 2) Auth Form Tabs switching
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      document.querySelectorAll(".auth-form").forEach(f => f.classList.add("hidden"));
      const formId = tab.dataset.tab;
      document.getElementById(formId).classList.remove("hidden");
    });
  });

  // 3) Role selector radio toggles (Login & Register)
  document.querySelectorAll('#login-form input[name="login-role"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll('#login-form .role-option').forEach(opt => opt.classList.remove("active"));
      radio.closest('.role-option').classList.add("active");
    });
  });

  document.querySelectorAll('#register-form input[name="reg-role"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll('#register-form .role-option').forEach(opt => opt.classList.remove("active"));
      radio.closest('.role-option').classList.add("active");
      
      const roleVal = parseInt(radio.value);
      const specGroup = document.getElementById("hotel-spec-group");
      if (roleVal === 2) {
        specGroup.classList.remove("hidden");
        document.getElementById("reg-type").required = true;
      } else {
        specGroup.classList.add("hidden");
        document.getElementById("reg-type").required = false;
      }
    });
  });

  // 4) Auth Toggles for Admin
  document.getElementById("admin-login-toggle").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".auth-form").forEach(f => f.classList.add("hidden"));
    document.getElementById("admin-form").classList.remove("hidden");
  });
  document.getElementById("admin-login-back").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".auth-form").forEach(f => f.classList.add("hidden"));
    document.getElementById("login-form").classList.remove("hidden");
  });

  // 5) Auth Form submissions
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("register-form").addEventListener("submit", handleRegister);
  document.getElementById("admin-form").addEventListener("submit", handleAdminLogin);

  // 6) User profile dropdown & Logout — hover-open is handled by CSS
  const userBadgeBtn = document.getElementById("user-badge-btn");
  const userDropdownMenu = document.getElementById("user-dropdown-menu");
  const userProfileDropdown = userBadgeBtn?.closest(".user-profile-dropdown");

  // Close dropdown on click outside (for when user clicks a menu item then moves away)
  document.addEventListener("click", (e) => {
    if (userProfileDropdown && !userProfileDropdown.contains(e.target)) {
      userDropdownMenu?.classList.add("hidden");
    }
  });

  document.getElementById("nav-account-btn")?.addEventListener("click", () => {
    openAccountModal();
    if (userDropdownMenu) userDropdownMenu.classList.add("hidden");
  });

  document.getElementById("nav-orders-btn")?.addEventListener("click", () => {
    openOrdersModal();
    if (userDropdownMenu) userDropdownMenu.classList.add("hidden");
  });

  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  // 7) Customer dashboard features
  document.getElementById("food-search").addEventListener("input", debounce(searchFoodOrRestaurants, 300));
  
  // Cuisine filter chips
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      loadRestaurants(chip.dataset.cuisine, document.getElementById("food-search").value);
    });
  });

  document.getElementById("back-to-restaurants-btn").addEventListener("click", () => {
    showRestaurantsBrowse();
  });

  // 8) Cart & Checkout actions
  document.getElementById("checkout-btn").addEventListener("click", openCheckoutModal);
  
  const applyCouponBtn = document.getElementById("apply-coupon-btn");
  if (applyCouponBtn) {
    applyCouponBtn.addEventListener("click", applyCouponCode);
  }
  
  // Cart Drawer toggles
  const headerCartBtn = document.getElementById("header-cart-btn");
  if (headerCartBtn) headerCartBtn.addEventListener("click", openCart);
  
  const floatingCartBtn = document.getElementById("floating-cart-btn");
  if (floatingCartBtn) floatingCartBtn.addEventListener("click", openCart);
  
  const closeCartBtn = document.getElementById("close-cart-btn");
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  
  const cartBackdrop = document.getElementById("cart-backdrop");
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);

  // Modals closing
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
    });
  });

  // Payment tabs switcher
  document.querySelectorAll(".payment-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".payment-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      document.querySelectorAll(".pay-form").forEach(f => f.classList.add("hidden"));
      state.selectedPaymentType = tab.dataset.pay;
      document.getElementById(`pay-form-${state.selectedPaymentType}`).classList.remove("hidden");
    });
  });

  // Pay button submit
  document.getElementById("pay-submit-btn").addEventListener("click", submitOrderPayment);

  // Active tracker return
  document.getElementById("track-back-home").addEventListener("click", () => {
    navigateTo("customer-view");
    showRestaurantsBrowse();
    resetCart();
  });

  // 9) Restaurant additions
  document.getElementById("add-menu-item-btn").addEventListener("click", () => {
    openMenuModal(null);
  });
  document.getElementById("menu-item-form").addEventListener("submit", submitMenuItem);
}

// --- API ACTIONS ---

// Copy SQL to clipboard
async function copySqlSchemaToClipboard() {
  try {
    const res = await fetch("db/setup.sql");
    const sql = await res.text();
    await navigator.clipboard.writeText(sql);
    showToast("PostgreSQL SQL Schema copied to clipboard! Paste it in the Supabase SQL editor.", "success");
  } catch (e) {
    showToast("Failed to copy schema automatically. Please read and copy db/setup.sql contents manually.", "error");
  }
}

// DB Verification Sync action
async function runDatabaseSetup() {
  showLoader(true, "Verifying Supabase Project Database...");
  try {
    const res = await supabaseFetch("restaurant?limit=1");
    showLoader(false);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        showToast("Supabase connection and seed data verified successfully!", "success");
        // Update Setup Indicator
        const indicator = document.getElementById("db-status-indicator");
        if (indicator) {
          indicator.textContent = "CONNECTED & SEEDED";
          indicator.className = "status-indicator success";
        }
        
        setTimeout(() => navigateTo("auth-view"), 1200);
      } else {
        showToast("Connection works but restaurant tables are empty. Please run the SQL seed script in your Supabase SQL Editor first.", "warning");
      }
    } else {
      showToast("Verification failed. Did you execute the PostgreSQL seed schema script in the Supabase Editor?", "error");
    }
  } catch (e) {
    showLoader(false);
    showToast("Server connection error during database verification.", "error");
  }
}

// User Login action
async function handleLogin(e) {
  e.preventDefault();
  const role = parseInt(document.querySelector('input[name="login-role"]:checked').value);
  const identifier = document.getElementById("login-id").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  showLoader(true, "Authenticating on Supabase Secure Gateway...");
  try {
    let endpoint = "";
    let queryStr = "";
    if (role === 1) { // User
      endpoint = "user_details";
      queryStr = `or=(u_email.eq.${encodeURIComponent(identifier)},u_phonenumber.eq.${encodeURIComponent(identifier)})`;
    } else if (role === 2) { // Restaurant
      endpoint = "restaurant";
      queryStr = `or=(r_email.eq.${encodeURIComponent(identifier)},restaurantphone.eq.${encodeURIComponent(identifier)})`;
    } else if (role === 3) { // Delivery Partner
      endpoint = "deliverypartner_details";
      queryStr = `or=(dp_email.eq.${encodeURIComponent(identifier)},dp_phonenumber.eq.${encodeURIComponent(identifier)})`;
    }

    const res = await supabaseFetch(`${endpoint}?${queryStr}`);
    showLoader(false);

    if (res.ok) {
      const users = await res.json();
      if (users && users.length > 0) {
        const userRecord = users[0];
        let match = false;
        let id = -1;
        let name = "";

        if (role === 1 && userRecord.u_password === password) {
          match = true; id = userRecord.u_id; name = userRecord.u_name;
        } else if (role === 2 && userRecord.r_pass === password) {
          match = true; id = userRecord.restaurantid; name = userRecord.restaurantname;
        } else if (role === 3 && userRecord.dp_password === password) {
          match = true; id = userRecord.dp_id; name = userRecord.dp_name;
        }

        if (match) {
          state.currentUser = { id, name, role };
          localStorage.setItem("food_express_user", JSON.stringify(state.currentUser));
          showToast(`Welcome, ${name}!`, "success");
          showDashboardForRole(role);
          document.getElementById("login-form").reset();
        } else {
          showToast("Invalid password. Try again.", "error");
        }
      } else {
        showToast("Profile email or phone not found.", "error");
      }
    } else {
      showToast("Authentication request failed.", "error");
    }
  } catch (e) {
    showLoader(false);
    console.error("Login connection error details:", e);
    showToast(`Supabase secure connection failed: ${e.message || e}`, "error");
  }
}

// User Register action
async function handleRegister(e) {
  e.preventDefault();
  const role = parseInt(document.querySelector('input[name="reg-role"]:checked').value);
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-pass").value.trim();
  const address = document.getElementById("reg-address").value.trim();
  const type = document.getElementById("reg-type").value.trim(); // hotel type

  // Input validations
  if (!name || !email || !phone || !password || !address) {
    showToast("All fields are required.", "error");
    return;
  }
  if (!phone.match(/^\d{10}$/)) {
    showToast("Mobile number must be exactly 10 digits.", "error");
    return;
  }
  if (email.length < 12 || email.length > 30 || (!email.endsWith("@gmail.com") && !email.endsWith("@yahoo.com"))) {
    showToast("Email must be 12-30 chars and end with @gmail.com or @yahoo.com.", "error");
    return;
  }
  
  // Password complexity helper
  const checkPasswordDetails = (p) => {
    const errors = [];
    if (p.length < 6) {
      errors.push("at least 6 characters");
    }
    let hasUpper = false;
    let hasSpecial = false;
    for (let i = 0; i < p.length; i++) {
      const char = p.charAt(i);
      if (/^[A-Z]$/.test(char)) {
        hasUpper = true;
      } else if (!/^[a-zA-Z0-9]$/.test(char)) {
        hasSpecial = true;
      }
    }
    if (!hasUpper) {
      errors.push("one uppercase letter (A-Z)");
    }
    if (!hasSpecial) {
      errors.push("one special character (e.g. @, #, $, !, _)");
    }
    return errors;
  };

  const passwordErrors = checkPasswordDetails(password);
  if (passwordErrors.length > 0) {
    showToast(`Password requirements missing: ${passwordErrors.join(', ')}.`, "error");
    return;
  }

  showLoader(true, "Registering profile in Supabase...");
  try {
    let endpoint = "";
    let payload = {};
    
    if (role === 1) {
      endpoint = "user_details";
      payload = { u_name: name, u_email: email, u_phonenumber: phone, u_address: address, u_password: password };
    } else if (role === 2) {
      endpoint = "restaurant";
      payload = { restaurantname: name, r_email: email, restaurantphone: phone, r_pass: password, r_type: type || "General", r_address: address };
    } else if (role === 3) {
      endpoint = "deliverypartner_details";
      payload = { dp_name: name, dp_email: email, dp_phonenumber: phone, dp_password: password };
    }

    // Verify unique constraints first
    let checkQuery = "";
    if (role === 1) checkQuery = `or=(u_email.eq.${encodeURIComponent(email)},u_phonenumber.eq.${encodeURIComponent(phone)})`;
    if (role === 2) checkQuery = `or=(r_email.eq.${encodeURIComponent(email)},restaurantphone.eq.${encodeURIComponent(phone)})`;
    if (role === 3) checkQuery = `or=(dp_email.eq.${encodeURIComponent(email)},dp_phonenumber.eq.${encodeURIComponent(phone)})`;

    const checkRes = await supabaseFetch(`${endpoint}?${checkQuery}`);
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        showLoader(false);
        showToast("Email or phone number already registered.", "error");
        return;
      }
    }

    // Create record
    const res = await supabaseFetch(endpoint, {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });
    showLoader(false);

    if (res.ok || res.status === 201) {
      let createdUser = null;
      try {
        const data = await res.json();
        if (data && data.length > 0) {
          createdUser = data[0];
        }
      } catch (err) {
        console.error("Failed to parse representation response:", err);
      }

      if (createdUser) {
        let id = -1;
        let nameVal = name;
        if (role === 1) {
          id = createdUser.u_id;
          nameVal = createdUser.u_name || name;
        } else if (role === 2) {
          id = createdUser.restaurantid;
          nameVal = createdUser.restaurantname || name;
        } else if (role === 3) {
          id = createdUser.dp_id;
          nameVal = createdUser.dp_name || name;
        }

        state.currentUser = { id, name: nameVal, role };
        localStorage.setItem("food_express_user", JSON.stringify(state.currentUser));
        showToast(`Registration successful! Welcome, ${nameVal}!`, "success");
        showDashboardForRole(role);
      } else {
        showToast("Account created successfully! Please login.", "success");
        document.querySelector('.auth-tab[data-tab="login-form"]').click();
      }
      document.getElementById("register-form").reset();
    } else {
      showToast("Registration failed. Please try again.", "error");
    }
  } catch (e) {
    showLoader(false);
    console.error("Registration error details:", e);
    showToast(`Server error during registration: ${e.message || e}`, "error");
  }
}

// Admin login action
function handleAdminLogin(e) {
  e.preventDefault();
  const passkey = document.getElementById("admin-pass").value;
  if (passkey === "Admin@123") {
    state.currentUser = { id: 999, name: "Platform Admin", role: 4 };
    localStorage.setItem("food_express_user", JSON.stringify(state.currentUser));
    showToast("Platform Administrator portal unlocked!", "success");
    showDashboardForRole(4);
    document.getElementById("admin-form").reset();
  } else {
    showToast("Access Denied. Invalid passkey.", "error");
  }
}

// Sign out action
function handleLogout() {
  state.currentUser = null;
  resetCart();
  localStorage.removeItem("food_express_user");
  showToast("You have logged out.", "info");
  navigateTo("auth-view");
}

// --- CUSTOMER PORTAL ACTION HANDLERS ---

// Fetch restaurants
// restaurantIdMap: optional Map<restaurantId, [matchedDishNames]> from food search
async function loadRestaurants(cuisine = "", search = "", restaurantIdMap = null) {
  try {
    let queryParams = "select=*";
    if (cuisine) {
      queryParams += `&r_type=eq.${encodeURIComponent(cuisine)}`;
    }

    // If we have a specific set of restaurant IDs from food search, filter by them
    if (restaurantIdMap !== null) {
      const ids = [...restaurantIdMap.keys()];
      if (ids.length === 0) {
        // No restaurants found serving this food item
        renderRestaurants([], restaurantIdMap);
        return;
      }
      queryParams += `&restaurantid=in.(${ids.join(",")})`;
    } else if (search) {
      // Normal name-based restaurant search
      queryParams += `&restaurantname=ilike.*${encodeURIComponent(search)}*`;
    }

    const res = await supabaseFetch(`restaurant?${queryParams}`);
    if (res.ok) {
      const data = await res.json();
      const formattedRestaurants = data.map(r => ({
        id: r.restaurantid,
        name: r.restaurantname,
        email: r.r_email,
        phone: r.restaurantphone,
        type: r.r_type,
        address: r.r_address,
        image: r.image_url
      }));
      
      // Shuffle array randomly using Fisher-Yates algorithm
      for (let i = formattedRestaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [formattedRestaurants[i], formattedRestaurants[j]] = [formattedRestaurants[j], formattedRestaurants[i]];
      }
      
      renderRestaurants(formattedRestaurants, restaurantIdMap);
    } else {
      showToast("Failed to fetch restaurants.", "error");
    }
  } catch (e) {
    showToast("Failed to fetch restaurants.", "error");
  }
}

// Search restaurant or dish global search
async function searchFoodOrRestaurants() {
  const query = document.getElementById("food-search").value.trim();
  const activeChip = document.querySelector(".filter-chip.active");
  const activeCuisine = activeChip ? activeChip.dataset.cuisine : "";

  if (!query) {
    // Empty search — show all restaurants normally
    loadRestaurants(activeCuisine, "");
    // Reset browse title
    document.getElementById("browse-title").textContent = "Popular Restaurants";
    return;
  }

  // Search menu_item table for matching dish names
  try {
    const menuRes = await supabaseFetch(
      `menu_item?item_name=ilike.*${encodeURIComponent(query)}*&select=item_id,item_name,r_id`
    );

    if (menuRes.ok) {
      const menuItems = await menuRes.json();

      if (menuItems && menuItems.length > 0) {
        // Build a map: restaurantId -> [dish names]
        const restaurantIdMap = new Map();
        menuItems.forEach(item => {
          if (!restaurantIdMap.has(item.r_id)) {
            restaurantIdMap.set(item.r_id, []);
          }
          restaurantIdMap.get(item.r_id).push(item.item_name);
        });

        // Update title to show it's a food search
        document.getElementById("browse-title").textContent =
          `Restaurants serving "${query}"`;

        // Load restaurants filtered by the IDs that have this dish
        loadRestaurants(activeCuisine, query, restaurantIdMap);
        return;
      }
    }
  } catch (e) {
    // Swallow menu search error — fall through to restaurant name search
  }

  // Fallback: search by restaurant name
  document.getElementById("browse-title").textContent = "Popular Restaurants";
  loadRestaurants(activeCuisine, query);
}

function renderRestaurants(list, restaurantIdMap = null) {
  const grid = document.getElementById("restaurants-grid");
  grid.innerHTML = "";

  if (list.length === 0) {
    const query = document.getElementById("food-search").value.trim();
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-store-slash"></i>
        <p>${query ? `No restaurants found serving "${query}".` : 'No restaurants match your search criteria.'}</p>
      </div>
    `;
    return;
  }

  list.forEach(res => {
    // Build matched dishes badge HTML if this is a food search
    let matchedDishesHtml = "";
    if (restaurantIdMap && restaurantIdMap.has(res.id)) {
      const dishes = restaurantIdMap.get(res.id);
      // Show up to 3 matched dish names as pills
      const pills = dishes.slice(0, 3).map(d =>
        `<span class="matched-dish-pill"><i class="fa-solid fa-bowl-food"></i> ${d}</span>`
      ).join("");
      const extra = dishes.length > 3 ? `<span class="matched-dish-pill more">+${dishes.length - 3} more</span>` : "";
      matchedDishesHtml = `
        <div class="matched-dishes-row">
          <span class="matched-label"><i class="fa-solid fa-fire"></i> Serves:</span>
          ${pills}${extra}
        </div>`;
    }

    const card = document.createElement("div");
    card.className = "res-card glass";
    card.innerHTML = `
      <div class="res-card-image">
        ${res.image ? `<img src="${res.image}" alt="${res.name}">` : `<i class="fa-solid fa-store"></i>`}
        <span class="res-card-tag">${res.type}</span>
      </div>
      <div class="res-card-info">
        <h4>${res.name}</h4>
        <p><i class="fa-solid fa-location-dot"></i> ${res.address}</p>
        <p><i class="fa-solid fa-phone"></i> ${res.phone}</p>
        ${matchedDishesHtml}
      </div>
    `;
    card.addEventListener("click", () => showRestaurantMenu(res));
    grid.appendChild(card);
  });
}

function showRestaurantsBrowse() {
  document.getElementById("restaurants-grid").classList.remove("hidden");
  document.getElementById("menu-view").classList.add("hidden");
  document.getElementById("back-to-restaurants-btn").classList.add("hidden");
  document.getElementById("browse-title").textContent = "Popular Restaurants";
  state.currentRestaurant = null;
}

// Show Menu of Selected Hotel
async function showRestaurantMenu(restaurant) {
  state.currentRestaurant = restaurant;
  
  // Update Header UI
  document.getElementById("selected-res-name").textContent = restaurant.name;
  document.getElementById("selected-res-type").textContent = restaurant.type;
  document.getElementById("selected-res-address").textContent = restaurant.address;
  document.getElementById("selected-res-phone").textContent = restaurant.phone;

  document.getElementById("restaurants-grid").classList.add("hidden");
  document.getElementById("menu-view").classList.remove("hidden");
  document.getElementById("back-to-restaurants-btn").classList.remove("hidden");
  document.getElementById("browse-title").textContent = "Restaurant Menu";

  // Fetch Menu
  try {
    const res = await supabaseFetch(`menu_item?r_id=eq.${restaurant.id}&select=*`);
    if (res.ok) {
      const data = await res.json();
      const formattedMenu = data.map(item => ({
        id: item.item_id,
        name: item.item_name,
        price: parseFloat(item.price),
        image: item.image_url
      }));
      renderMenuItems(formattedMenu);
    } else {
      showToast("Failed to retrieve menu list.", "error");
    }
  } catch (e) {
    showToast("Failed to retrieve menu list.", "error");
  }
}

function renderMenuItems(items) {
  const grid = document.getElementById("menu-items-grid");
  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = `<p class="empty-text">This restaurant has no dishes listed yet.</p>`;
    return;
  }

  items.forEach(item => {
    // Find item qty in existing cart
    const cartItem = state.cart.find(c => c.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;
    const hasItem = qty > 0;

    const card = document.createElement("div");
    card.className = "menu-card glass";
    card.dataset.itemId = item.id;
    card.innerHTML = `
      ${item.image ? `<div class="menu-card-image"><img src="${item.image}" alt="${item.name}"></div>` : ''}
      <div class="menu-card-top">
        <h4>${item.name}</h4>
        <p class="price">${item.price.toFixed(2)} Rs.</p>
      </div>
      <div class="menu-card-bottom">
        <button class="add-to-cart-btn" style="display: ${hasItem ? 'none' : 'flex'}">
          <i class="fa-solid fa-plus"></i> Add
        </button>
        <div class="qty-controls" style="display: ${hasItem ? 'flex' : 'none'}">
          <button class="qty-btn minus-btn"><i class="fa-solid fa-minus"></i></button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn plus-btn"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    `;

    const addBtn     = card.querySelector(".add-to-cart-btn");
    const qtyControls = card.querySelector(".qty-controls");
    const numSpan    = card.querySelector(".qty-num");

    // "+ Add" button: first-time add
    addBtn.addEventListener("click", () => {
      let newQty = updateCart(item, 1);
      numSpan.textContent = newQty;
      addBtn.style.display = "none";
      qtyControls.style.display = "flex";
    });

    // "+" button: increase
    card.querySelector(".plus-btn").addEventListener("click", () => {
      let newQty = updateCart(item, 1);
      numSpan.textContent = newQty;
    });

    // "-" button: decrease / remove
    card.querySelector(".minus-btn").addEventListener("click", () => {
      let newQty = updateCart(item, -1);
      numSpan.textContent = newQty;
      if (newQty <= 0) {
        addBtn.style.display = "flex";
        qtyControls.style.display = "none";
      }
    });

    grid.appendChild(card);
  });
}

// Sync all visible menu cards to reflect current cart quantities
function syncMenuCardQtys() {
  document.querySelectorAll(".menu-card[data-item-id]").forEach(card => {
    const itemId = parseInt(card.dataset.itemId);
    const cartItem = state.cart.find(c => c.id === itemId);
    const qty = cartItem ? cartItem.qty : 0;

    const addBtn      = card.querySelector(".add-to-cart-btn");
    const qtyControls = card.querySelector(".qty-controls");
    const numSpan     = card.querySelector(".qty-num");

    if (!addBtn || !qtyControls || !numSpan) return;

    numSpan.textContent = qty;
    if (qty > 0) {
      addBtn.style.display = "none";
      qtyControls.style.display = "flex";
    } else {
      addBtn.style.display = "flex";
      qtyControls.style.display = "none";
    }
  });
}

// --- CART STATE MECHANICS ---

function openCart() {
  const sidebar = document.querySelector(".cart-sidebar");
  const backdrop = document.getElementById("cart-backdrop");
  if (sidebar) sidebar.classList.add("open");
  if (backdrop) {
    backdrop.classList.remove("hidden");
    // Trigger paint reflow for CSS transition opacity to kick in
    void backdrop.offsetWidth;
    backdrop.classList.add("show");
  }
}

function closeCart() {
  const sidebar = document.querySelector(".cart-sidebar");
  const backdrop = document.getElementById("cart-backdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) {
    backdrop.classList.remove("show");
    setTimeout(() => {
      if (backdrop && !backdrop.classList.contains("show")) {
        backdrop.classList.add("hidden");
      }
    }, 300);
  }
}

function updateCart(item, delta) {
  const index = state.cart.findIndex(c => c.id === item.id);
  let currentQty = 0;

  if (index > -1) {
    state.cart[index].qty += delta;
    if (state.cart[index].qty <= 0) {
      state.cart.splice(index, 1);
    } else {
      currentQty = state.cart[index].qty;
    }
  } else if (delta > 0) {
    state.cart.push({ id: item.id, name: item.name, price: item.price, qty: delta });
    currentQty = delta;
  }

  renderCartSidebar();

  // Automatically pop open cart drawer when a brand new item is added
  if (delta > 0 && index === -1) {
    openCart();
  }

  return currentQty;
}

function renderCartSidebar() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fa-solid fa-cart-shopping"></i>
        <p>Your basket is empty.</p>
        <p class="sub">Select items from a restaurant menu to add them here.</p>
      </div>
    `;
    updateCartTotals(0);
    syncMenuCardQtys();
    return;
  }

  state.cart.forEach(c => {
    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div class="cart-item-meta">
        <h5>${c.name}</h5>
        <p>${(c.price * c.qty).toFixed(2)} Rs.</p>
      </div>
      <div class="qty-controls">
        <button class="qty-btn minus-btn"><i class="fa-solid fa-minus"></i></button>
        <span class="qty-num">${c.qty}</span>
        <button class="qty-btn plus-btn"><i class="fa-solid fa-plus"></i></button>
      </div>
    `;

    row.querySelector(".plus-btn").addEventListener("click", () => {
      updateCart({ id: c.id, name: c.name, price: c.price }, 1);
    });
    row.querySelector(".minus-btn").addEventListener("click", () => {
      updateCart({ id: c.id, name: c.name, price: c.price }, -1);
    });

    container.appendChild(row);
  });

  // Calculate totals
  const subtotal = state.cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
  updateCartTotals(subtotal);

  // Keep menu cards in sync with the cart
  syncMenuCardQtys();
}

function updateCartTotals(subtotal) {
  if (typeof subtotal === 'undefined') {
    subtotal = state.cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
  }
  // Recalculate discount based on state.appliedCoupon dynamically
  let discount = 0.0;
  if (state.cart.length > 0 && state.appliedCoupon) {
    if (state.appliedCoupon === "FOOD50") {
      discount = subtotal * 0.5;
    } else if (state.appliedCoupon === "WELCOME10") {
      discount = subtotal * 0.1;
    } else if (state.appliedCoupon === "FREE40") {
      discount = Math.min(40.0, subtotal);
    }
  } else {
    // If cart is empty, clear coupon display/state
    if (state.cart.length === 0) {
      state.appliedCoupon = "";
      const couponInput = document.getElementById("coupon-code");
      if (couponInput) couponInput.value = "";
      const couponMsg = document.getElementById("coupon-message");
      if (couponMsg) {
        couponMsg.style.display = "none";
        couponMsg.textContent = "";
      }
    }
  }
  state.appliedDiscount = discount;

  // Render Discount Row
  const discountRow = document.getElementById("cart-discount-row");
  const discountVal = document.getElementById("cart-discount");
  const discountLabel = document.getElementById("cart-discount-label");
  if (discountRow && discountVal) {
    if (discount > 0) {
      discountRow.style.display = "flex";
      if (discountLabel) {
        discountLabel.textContent = `Discount (${state.appliedCoupon})`;
      }
      discountVal.textContent = `-${discount.toFixed(2)} Rs.`;
    } else {
      discountRow.style.display = "none";
    }
  }

  // GST (5%) calculated on discounted subtotal
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const gst = taxableSubtotal * 0.05;
  const delivery = (subtotal === 0 || subtotal >= 400) ? 0.0 : 40.0;
  const grand = taxableSubtotal + gst + delivery;

  document.getElementById("cart-subtotal").textContent = `${subtotal.toFixed(2)} Rs.`;
  document.getElementById("cart-gst").textContent = `${gst.toFixed(2)} Rs.`;
  document.getElementById("cart-delivery").textContent = `${delivery.toFixed(2)} Rs.`;
  document.getElementById("cart-grandtotal").textContent = `${grand.toFixed(2)} Rs.`;

  // Free delivery alerts
  const deliveryAlert = document.getElementById("free-delivery-alert");
  if (subtotal === 0) {
    deliveryAlert.className = "free-delivery-badge";
    deliveryAlert.innerHTML = `<i class="fa-solid fa-circle-info"></i> Add items worth 400 Rs. or more for FREE delivery!`;
  } else if (subtotal >= 400) {
    deliveryAlert.className = "free-delivery-badge success";
    deliveryAlert.innerHTML = `<i class="fa-solid fa-circle-check"></i> Congratulations! Free delivery has been applied!`;
  } else {
    const diff = 400 - subtotal;
    deliveryAlert.className = "free-delivery-badge";
    deliveryAlert.innerHTML = `<i class="fa-solid fa-circle-info"></i> Add items worth <strong>${diff.toFixed(2)} Rs.</strong> more for FREE delivery!`;
  }

  // Update badge counts for the new cart icons
  const totalCount = state.cart.reduce((sum, c) => sum + c.qty, 0);
  const headerBadge = document.getElementById("header-cart-badge");
  const floatingBadge = document.getElementById("floating-cart-badge");
  
  if (headerBadge) {
    headerBadge.textContent = totalCount;
    headerBadge.style.display = totalCount > 0 ? "flex" : "none";
  }
  if (floatingBadge) {
    floatingBadge.textContent = totalCount;
    floatingBadge.style.display = totalCount > 0 ? "flex" : "none";
  }

  // Toggle checkout button
  const checkoutBtn = document.getElementById("checkout-btn");
  checkoutBtn.disabled = (state.cart.length === 0);
}

function applyCouponCode() {
  const couponInput = document.getElementById("coupon-code");
  const couponMsg = document.getElementById("coupon-message");
  if (!couponInput || !couponMsg) return;

  const code = couponInput.value.trim().toUpperCase();
  if (!code) {
    couponMsg.style.display = "block";
    couponMsg.style.color = "var(--text-muted)";
    couponMsg.textContent = "Please enter a coupon code.";
    return;
  }

  if (state.cart.length === 0) {
    couponMsg.style.display = "block";
    couponMsg.style.color = "var(--danger)";
    couponMsg.textContent = "Your basket is empty.";
    return;
  }

  const subtotal = state.cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
  
  if (code === "FOOD50" || code === "WELCOME10" || code === "FREE40") {
    state.appliedCoupon = code;
    couponMsg.style.display = "block";
    couponMsg.style.color = "var(--success)";
    couponMsg.textContent = `Coupon "${code}" applied successfully!`;
    updateCartTotals(subtotal);
  } else {
    state.appliedCoupon = "";
    state.appliedDiscount = 0.0;
    couponMsg.style.display = "block";
    couponMsg.style.color = "var(--danger)";
    couponMsg.textContent = "Invalid coupon code!";
    updateCartTotals(subtotal);
  }
}

function resetCart() {
  state.cart = [];
  state.appliedCoupon = "";
  state.appliedDiscount = 0.0;
  const couponInput = document.getElementById("coupon-code");
  if (couponInput) couponInput.value = "";
  const couponMsg = document.getElementById("coupon-message");
  if (couponMsg) {
    couponMsg.style.display = "none";
    couponMsg.textContent = "";
  }
  renderCartSidebar();
}

// --- CHECKOUT & PLACING ORDER ---

function openCheckoutModal() {
  closeCart();
  const subtotal = state.cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
  const discount = state.appliedDiscount;
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const gst = taxableSubtotal * 0.05;
  const delivery = (subtotal >= 400) ? 0.0 : 40.0;
  const grand = taxableSubtotal + gst + delivery;

  document.getElementById("modal-payable-amount").textContent = `${grand.toFixed(2)} Rs.`;
  
  // Reset payment selections to Cash
  document.querySelector('.payment-tab[data-pay="1"]').click();

  // Show Modal
  document.getElementById("payment-modal").classList.remove("hidden");
}

async function submitOrderPayment() {
  const userId = state.currentUser.id;
  const restaurantid = state.currentRestaurant.id;
  const paymentType = parseInt(state.selectedPaymentType);
  
  if (state.cart.length === 0) {
    showToast("Cart is empty.", "error");
    return;
  }

  const subtotal = state.cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
  const discount = state.appliedDiscount;
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const gst = taxableSubtotal * 0.05;
  const delivery = (subtotal >= 400) ? 0.0 : 40.0;
  const grandTotal = taxableSubtotal + gst + delivery;

  showLoader(true, "Contacting secure Supabase bank gateway...");
  try {
    // 1) Verify and Deduct Bank Account if online transaction
    let accountId = -1;
    let balance = 0.0;

    if (paymentType === 2) { // Card
      const cardNum = document.getElementById("pay-card-num").value.trim();
      const expiryMonth = document.getElementById("pay-card-month").value.trim();
      const expiryYear = document.getElementById("pay-card-year").value.trim();
      const cvv = document.getElementById("pay-card-cvv").value.trim();

      if (!cardNum.match(/^\d{16}$/)) {
        showLoader(false);
        showToast("Card number must be exactly 16 digits.", "error");
        return;
      }
      if (!cvv.match(/^\d{3}$/)) {
        showLoader(false);
        showToast("CVV code must be exactly 3 digits.", "error");
        return;
      }
      if (!expiryMonth || !expiryYear) {
        showLoader(false);
        showToast("Please provide expiry details.", "error");
        return;
      }

      const cnum = parseInt(cardNum);
      const cvvNum = parseInt(cvv);

      // Fetch matching bank card account
      const cardRes = await supabaseFetch(`accounts?cnum=eq.${cnum}&cvv=eq.${cvvNum}&select=*`);
      if (cardRes.ok) {
        const accounts = await cardRes.json();
        if (accounts && accounts.length > 0) {
          accountId = accounts[0].a_id;
          balance = parseFloat(accounts[0].balance);
        } else {
          showLoader(false);
          showToast("Invalid credit card credentials.", "error");
          return;
        }
      } else {
        showLoader(false);
        showToast("Secure bank validation request failed.", "error");
        return;
      }
    } else if (paymentType === 3) { // UPI
      const upiId = document.getElementById("pay-upi-id").value.trim();
      if (!upiId) {
        showLoader(false);
        showToast("Please enter a valid UPI Address ID.", "error");
        return;
      }

      const upiRes = await supabaseFetch(`accounts?upi=eq.${encodeURIComponent(upiId)}&select=*`);
      if (upiRes.ok) {
        const accounts = await upiRes.json();
        if (accounts && accounts.length > 0) {
          accountId = accounts[0].a_id;
          balance = parseFloat(accounts[0].balance);
        } else {
          showLoader(false);
          showToast("Invalid UPI ID.", "error");
          return;
        }
      } else {
        showLoader(false);
        showToast("Secure UPI verification request failed.", "error");
        return;
      }
    }

    // Verify balance and deduct if Card or UPI
    if (paymentType !== 1) {
      if (balance < grandTotal) {
        showLoader(false);
        showToast("Insufficient funds in bank account.", "error");
        return;
      }

      // Deduct balance
      const deductRes = await supabaseFetch(`accounts?a_id=eq.${accountId}`, {
        method: "PATCH",
        body: JSON.stringify({ balance: balance - grandTotal })
      });
      if (!deductRes.ok) {
        showLoader(false);
        showToast("Secure payment deduction failed.", "error");
        return;
      }
    }

    // 2) Select Random Delivery Partner from actual DB
    let dpId = null;
    let dpName = "Unassigned Partner";
    let dpPhone = "N/A";

    const dpRes = await supabaseFetch("deliverypartner_details?select=*");
    if (dpRes.ok) {
      const partners = await dpRes.json();
      if (partners && partners.length > 0) {
        const randomPartner = partners[Math.floor(Math.random() * partners.length)];
        dpId = randomPartner.dp_id;
        dpName = randomPartner.dp_name;
        dpPhone = randomPartner.dp_phonenumber;
      }
    }

    const eta = 20 + Math.floor(Math.random() * 16);

    // 3) Insert Order into Supabase
    const orderPayload = {
      user_id: userId,
      restaurant_id: restaurantid,
      delivery_partner_id: dpId,
      eta_minutes: eta,
      total_amount: grandTotal,
      status: 'PREPARING'
    };

    const placeRes = await supabaseFetch("orders", {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(orderPayload)
    });

    if (!placeRes.ok) {
      showLoader(false);
      showToast("Failed to place order in database.", "error");
      return;
    }

    const ordersCreated = await placeRes.json();
    const newOrder = ordersCreated[0];
    const orderId = newOrder.order_id;

    // 4) Insert Order Items in Batch into Supabase
    const orderItemsPayload = state.cart.map(c => ({
      order_id: orderId,
      item_id: c.id,
      item_name: c.name,
      price: c.price,
      qty: c.qty
    }));

    const itemsRes = await supabaseFetch("order_items", {
      method: "POST",
      body: JSON.stringify(orderItemsPayload)
    });

    showLoader(false);
    if (itemsRes.ok) {
      showToast("Transaction Successful! Order Placed.", "success");
      
      // Close modal
      document.getElementById("payment-modal").classList.add("hidden");
      
      // Navigate to Tracker
      navigateTo("tracking-view");
      startOrderLiveTracking(orderId);
      
      // Trigger simulated background order tracker updates!
      simulateBackgroundOrderTracking(orderId);
      
      // Clear cart
      resetCart();
    } else {
      showToast("Failed to save order catalog items.", "error");
    }
  } catch (e) {
    showLoader(false);
    showToast("An unexpected error occurred during checkout.", "error");
  }
}

// Client-Side Simulated Order Status updates (modifies Supabase status in background)
function simulateBackgroundOrderTracking(orderId) {
  // Preparing -> Out For Delivery (after 10 seconds) -> Delivered (after another 12 seconds)
  setTimeout(async () => {
    try {
      await supabaseFetch(`orders?order_id=eq.${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "OUT_FOR_DELIVERY" })
      });
    } catch (e) {
      console.error("Order simulation OUT_FOR_DELIVERY error:", e);
    }
  }, 10000);

  setTimeout(async () => {
    try {
      await supabaseFetch(`orders?order_id=eq.${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DELIVERED" })
      });
    } catch (e) {
      console.error("Order simulation DELIVERED error:", e);
    }
  }, 22000);
}

// --- LIVE ORDER TRACKING POLLER ---

function startOrderLiveTracking(orderId) {
  // Clear any existing poller
  if (state.activeOrderPolling) {
    clearInterval(state.activeOrderPolling);
  }

  // Immediate fetch first
  pollOrderStatus(orderId);

  // Set interval to poll status every 2 seconds
  state.activeOrderPolling = setInterval(() => {
    pollOrderStatus(orderId);
  }, 2000);
}

async function pollOrderStatus(orderId) {
  try {
    // Query relational data using foreign keys
    const res = await supabaseFetch(`orders?order_id=eq.${orderId}&select=*,restaurant:restaurant_id(restaurantname),deliverypartner_details:delivery_partner_id(dp_name,dp_phonenumber)`);
    
    if (!res.ok) {
      clearInterval(state.activeOrderPolling);
      return;
    }
    
    const orders = await res.json();
    if (orders && orders.length > 0) {
      const order = orders[0];
      const dpName = order.deliverypartner_details ? order.deliverypartner_details.dp_name : "Unassigned";
      const dpPhone = order.deliverypartner_details ? order.deliverypartner_details.dp_phonenumber : "N/A";
      const restaurantname = order.restaurant ? order.restaurant.restaurantname : "Restaurant";

      // Populate Tracking View
      document.getElementById("track-order-id").textContent = order.order_id;
      document.getElementById("track-res-name").textContent = restaurantname;
      document.getElementById("track-eta").textContent = order.eta_minutes;
      document.getElementById("track-dp-name").textContent = dpName;
      document.getElementById("track-dp-phone").textContent = dpPhone;
      document.getElementById("track-amount").textContent = `${parseFloat(order.total_amount).toFixed(2)} Rs.`;
      
      // Status text
      let payStr = "Cash on Delivery";
      if (state.selectedPaymentType === "2") payStr = "Credit Card";
      if (state.selectedPaymentType === "3") payStr = "UPI Online";
      document.getElementById("track-pay-method").textContent = payStr;

      // Stepper management
      updateTrackingStepper(order.status);

      // If delivered, stop polling
      if (order.status === "DELIVERED") {
        clearInterval(state.activeOrderPolling);
        state.activeOrderPolling = null;
        showToast("Your food is here! Enjoy your meal!", "success");
      }
    }
  } catch (e) {
    console.error("Tracking status poll error:", e);
  }
}

function updateTrackingStepper(status) {
  const steps = ["step-placed", "step-preparing", "step-out", "step-delivered"];
  steps.forEach(id => {
    document.getElementById(id).className = "step";
  });

  const stepPlaced = document.getElementById("step-placed");
  const stepPreparing = document.getElementById("step-preparing");
  const stepOut = document.getElementById("step-out");
  const stepDelivered = document.getElementById("step-delivered");

  if (status === "PREPARING") {
    stepPlaced.classList.add("completed");
    stepPreparing.classList.add("active");
  } else if (status === "OUT_FOR_DELIVERY") {
    stepPlaced.classList.add("completed");
    stepPreparing.classList.add("completed");
    stepOut.classList.add("active");
  } else if (status === "DELIVERED") {
    stepPlaced.classList.add("completed");
    stepPreparing.classList.add("completed");
    stepOut.classList.add("completed");
    stepDelivered.classList.add("completed");
  } else {
    // Default placed state
    stepPlaced.classList.add("active");
  }
}

// --- HOTEL RESTAURANT PORTAL ENGINE ---

async function loadRestaurantDashboard() {
  const rId = state.currentUser.id;
  
  // 1) Load Menu
  try {
    const menuRes = await supabaseFetch(`menu_item?r_id=eq.${rId}&select=*`);
    if (menuRes.ok) {
      const data = await menuRes.json();
      const menu = data.map(item => ({
        id: item.item_id,
        name: item.item_name,
        price: parseFloat(item.price),
        image: item.image_url
      }));
      renderRestaurantMenuMgmt(menu);
    } else {
      showToast("Failed to fetch menu list.", "error");
    }
  } catch (e) {
    showToast("Failed to fetch menu list.", "error");
  }

  // 2) Load Orders
  try {
    const ordersRes = await supabaseFetch(`orders?restaurant_id=eq.${rId}&select=*,user_details:user_id(u_name)&order=order_id.desc`);
    if (ordersRes.ok) {
      const data = await ordersRes.json();
      const orders = data.map(o => ({
        orderId: o.order_id,
        customer: o.user_details ? o.user_details.u_name : "Customer",
        total: parseFloat(o.total_amount),
        status: o.status,
        date: o.created_at
      }));
      renderRestaurantOrders(orders);
    } else {
      showToast("Failed to fetch orders history.", "error");
    }
  } catch (e) {
    showToast("Failed to fetch orders history.", "error");
  }
}

function renderRestaurantMenuMgmt(items) {
  const list = document.getElementById("hotel-menu-list");
  list.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "mgmt-menu-card glass";
    card.innerHTML = `
      <div>
        <h5>${item.name}</h5>
        <p>${item.price.toFixed(2)} Rs.</p>
      </div>
      <div class="mgmt-menu-actions">
        <button class="btn btn-secondary btn-sm edit-menu-btn"><i class="fa-solid fa-pen"></i> Edit Details</button>
      </div>
    `;

    card.querySelector(".edit-menu-btn").addEventListener("click", () => {
      openMenuModal(item);
    });

    list.appendChild(card);
  });
}

function renderRestaurantOrders(orders) {
  const list = document.getElementById("hotel-orders-list");
  list.innerHTML = "";

  if (orders.length === 0) {
    list.innerHTML = `<p class="empty-text">No orders received yet.</p>`;
    return;
  }

  orders.forEach(o => {
    const card = document.createElement("div");
    card.className = "hotel-order-card";
    
    let statusClass = "preparing";
    if (o.status === "OUT_FOR_DELIVERY") statusClass = "out";
    if (o.status === "DELIVERED") statusClass = "delivered";

    card.innerHTML = `
      <div class="h-order-header">
        <h5>Order #${o.orderId}</h5>
        <span class="status-badge ${statusClass}">${o.status}</span>
      </div>
      <div class="h-order-details">
        <p><strong>Customer:</strong> ${o.customer}</p>
        <p><strong>Amount:</strong> ${o.total.toFixed(2)} Rs.</p>
        <p><strong>Placed:</strong> ${formatDateStr(o.date)}</p>
      </div>
    `;
    list.appendChild(card);
  });
}

function openMenuModal(item = null) {
  const modal = document.getElementById("menu-modal");
  const form = document.getElementById("menu-item-form");
  const title = document.getElementById("menu-modal-title");
  const deleteBtn = document.getElementById("delete-menu-item-btn");

  form.reset();

  if (item) {
    title.textContent = "Edit Menu Item";
    document.getElementById("menu-form-item-id").value = item.id;
    document.getElementById("menu-item-name").value = item.name;
    document.getElementById("menu-item-name").disabled = true;
    document.getElementById("menu-item-price").value = item.price;
    document.getElementById("menu-item-image").value = item.image || "";
    // Show delete button for existing items
    deleteBtn.classList.remove("hidden");
    // Replace to avoid stacking listeners
    const newBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
    newBtn.addEventListener("click", async () => {
      if (!confirm(`Delete "${item.name}" from your menu? This cannot be undone.`)) return;
      showLoader(true, "Deleting item from Supabase...");
      try {
        const res = await supabaseFetch(`menu_item?item_id=eq.${item.id}&r_id=eq.${state.currentUser.id}`, {
          method: "DELETE"
        });
        showLoader(false);
        if (res.ok || res.status === 204) {
          showToast(`"${item.name}" deleted successfully.`, "success");
          modal.classList.add("hidden");
          loadRestaurantDashboard();
        } else {
          showToast("Failed to delete item.", "error");
        }
      } catch (err) {
        showLoader(false);
        showToast("Error deleting item: " + (err.message || err), "error");
      }
    });
  } else {
    title.textContent = "Add Menu Dish";
    document.getElementById("menu-form-item-id").value = "";
    document.getElementById("menu-item-name").disabled = false;
    document.getElementById("menu-item-image").value = "";
    // Hide delete button for new items
    deleteBtn.classList.add("hidden");
  }

  modal.classList.remove("hidden");
}

async function submitMenuItem(e) {
  e.preventDefault();
  const itemId = document.getElementById("menu-form-item-id").value;
  const name = document.getElementById("menu-item-name").value.trim();
  const price = parseFloat(document.getElementById("menu-item-price").value);
  const image = document.getElementById("menu-item-image").value.trim();
  const rId = state.currentUser.id;

  const isEdit = (itemId !== "");
  const payload = {
    item_name: name,
    price: price,
    r_id: rId,
    image_url: image || null
  };

  showLoader(true, isEdit ? "Updating pricing on Supabase..." : "Adding dish to Supabase...");
  try {
    let res;
    if (isEdit) {
      res = await supabaseFetch(`menu_item?item_id=eq.${itemId}&r_id=eq.${rId}`, {
        method: "PATCH",
        body: JSON.stringify({ price: price, image_url: image || null })
      });
    } else {
      res = await supabaseFetch("menu_item", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    
    showLoader(false);

    if (res.ok || res.status === 201 || res.status === 204) {
      showToast(isEdit ? "Item updated successfully!" : "Item added successfully!", "success");
      document.getElementById("menu-modal").classList.add("hidden");
      loadRestaurantDashboard();
    } else {
      showToast("Menu update failed.", "error");
    }
  } catch (e) {
    showLoader(false);
    showToast("Server error updating menu.", "error");
  }
}

// --- DELIVERY HERO PORTAL ENGINE ---

async function loadDeliveryDashboard() {
  const dpId = state.currentUser.id;

  showLoader(true, "Loading assignments from Supabase...");
  try {
    const res = await supabaseFetch(`orders?delivery_partner_id=eq.${dpId}&select=*,restaurant:restaurant_id(restaurantname),user_details:user_id(u_name)&order=order_id.desc`);
    showLoader(false);

    if (res.ok) {
      const data = await res.json();
      const orders = data.map(o => ({
        orderId: o.order_id,
        restaurant: o.restaurant ? o.restaurant.restaurantname : "Restaurant",
        customer: o.user_details ? o.user_details.u_name : "Customer",
        total: parseFloat(o.total_amount),
        status: o.status,
        date: o.created_at
      }));

      // Active Task: Any order where status is Preparing or Out for Delivery
      const activeTask = orders.find(o => o.status === "PREPARING" || o.status === "OUT_FOR_DELIVERY");
      const completedHistory = orders.filter(o => o.status === "DELIVERED");

      renderDpActiveTask(activeTask);
      renderDpCompletedHistory(completedHistory);
    } else {
      showToast("Failed to fetch partner assignments.", "error");
    }
  } catch (e) {
    showLoader(false);
    showToast("Failed to fetch partner assignments.", "error");
  }
}

function renderDpActiveTask(task) {
  const container = document.getElementById("dp-active-task-container");
  container.innerHTML = "";

  if (!task) {
    container.innerHTML = `
      <div class="empty-state p-4 text-center">
        <i class="fa-solid fa-motorcycle text-muted font-size-lg mb-2"></i>
        <p>No active delivery assignments. Relax and wait for orders!</p>
      </div>
    `;
    return;
  }

  const card = document.createElement("div");
  card.className = "dp-task-card";
  
  let payout = task.total * 0.15; // Simulated payout: 15%
  if (payout < 40) payout = 40;

  card.innerHTML = `
    <div class="dp-task-details">
      <div class="dp-task-row">
        <span>Order Number</span>
        <strong>#${task.orderId}</strong>
      </div>
      <div class="dp-task-row">
        <span>Restaurant</span>
        <strong>${task.restaurant}</strong>
      </div>
      <div class="dp-task-row">
        <span>Deliver To</span>
        <strong>${task.customer}</strong>
      </div>
      <div class="dp-task-row">
        <span>Estimated Payout</span>
        <strong class="text-accent">${payout.toFixed(2)} Rs.</strong>
      </div>
      <div class="dp-task-row">
        <span>Order Amount</span>
        <strong>${task.total.toFixed(2)} Rs.</strong>
      </div>
    </div>
    <div class="dp-task-status-box">
      <h4>Status: <span class="badge active-pulse" style="background: rgba(255, 45, 85, 0.1); color: var(--accent);">${task.status}</span></h4>
      <p class="sub-text">Updates will occur in real-time as simulated status threads proceed.</p>
      <button class="btn btn-primary mt-2" id="dp-refresh-btn"><i class="fa-solid fa-rotate"></i> Check Status Update</button>
    </div>
  `;

  card.querySelector("#dp-refresh-btn").addEventListener("click", () => {
    loadDeliveryDashboard();
  });

  container.appendChild(card);
}

function renderDpCompletedHistory(list) {
  const tbody = document.getElementById("dp-history-table-body");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No completed deliveries found yet.</td>
      </tr>
    `;
    return;
  }

  list.forEach(o => {
    let payout = o.total * 0.15;
    if (payout < 40) payout = 40;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${o.orderId}</td>
      <td><strong>${o.restaurant}</strong></td>
      <td>${o.customer}</td>
      <td class="text-success">+${payout.toFixed(2)} Rs.</td>
      <td><span class="badge" style="background: rgba(0,230,118,0.1); color: var(--success);">DELIVERED</span></td>
      <td>${formatDateStr(o.date)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- ADMIN GATEWAY CONTROL PORTAL ---

async function loadAdminDashboard() {
  showLoader(true, "Gathering platform metrics from Supabase...");
  try {
    // 1) Users count
    const usersRes = await supabaseFetch("user_details?select=u_id");
    const usersData = usersRes.ok ? await usersRes.json() : [];
    const totalUsers = usersData.length;

    // 2) Restaurants list
    const resHotelsList = await supabaseFetch("restaurant?select=*");
    const hotelsData = resHotelsList.ok ? await resHotelsList.json() : [];
    const totalHotels = hotelsData.length;

    // 3) Partners count
    const partnersRes = await supabaseFetch("deliverypartner_details?select=dp_id");
    const partnersData = partnersRes.ok ? await partnersRes.json() : [];
    const totalPartners = partnersData.length;

    // 4) Orders count & stats
    const ordersRes = await supabaseFetch("orders?select=*,restaurant:restaurant_id(restaurantname),user_details:user_id(u_name)");
    const ordersData = ordersRes.ok ? await ordersRes.json() : [];
    const totalOrders = ordersData.length;

    // 5) Total Revenue
    const totalRevenue = ordersData.reduce((sum, o) => sum + parseFloat(o.total_amount), 0.0);

    // 6) Platform Active Users Leaderboard
    const userOrderCounts = {};
    ordersData.forEach(o => {
      const name = o.user_details ? o.user_details.u_name : "User ID: " + o.user_id;
      const uid = o.user_id;
      if (!userOrderCounts[uid]) {
        userOrderCounts[uid] = { userId: uid, name: name, orders: 0 };
      }
      userOrderCounts[uid].orders++;
    });
    const usersLeaderboard = Object.values(userOrderCounts)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    // 7) Restaurant Order Volume
    const hotelOrderCounts = {};
    ordersData.forEach(o => {
      const name = o.restaurant ? o.restaurant.restaurantname : "Restaurant ID: " + o.restaurant_id;
      const rid = o.restaurant_id;
      if (!hotelOrderCounts[rid]) {
        hotelOrderCounts[rid] = { restaurantid: rid, name: name, orders: 0 };
      }
      hotelOrderCounts[rid].orders++;
    });
    const hotelsLeaderboard = Object.values(hotelOrderCounts)
      .sort((a, b) => b.orders - a.orders);

    // Populate Metrics
    document.getElementById("admin-metric-users").textContent = totalUsers;
    document.getElementById("admin-metric-hotels").textContent = totalHotels;
    document.getElementById("admin-metric-dps").textContent = totalPartners;
    document.getElementById("admin-metric-orders").textContent = totalOrders;
    document.getElementById("admin-metric-revenue").textContent = `${totalRevenue.toFixed(2)} Rs.`;

    // Populate leaderboards
    renderAdminActiveUsers(usersLeaderboard);
    renderAdminMonthlyHistory(hotelsLeaderboard);
    
    // Vendor lists for deletions
    const hotelsFormatted = hotelsData.map(h => ({
      id: h.restaurantid,
      name: h.restaurantname,
      type: h.r_type,
      phone: h.restaurantphone
    }));
    renderAdminDeleteHotels(hotelsFormatted);

    // Fetch delivery partners
    const dpListRes = await supabaseFetch("deliverypartner_details?select=*");
    const dpListData = dpListRes.ok ? await dpListRes.json() : [];
    const partnersFormatted = dpListData.map(dp => ({
      id: dp.dp_id,
      name: dp.dp_name,
      phone: dp.dp_phonenumber
    }));
    renderAdminDeleteDps(partnersFormatted);
    
    showLoader(false);
  } catch (e) {
    showLoader(false);
    showToast("Failed to fetch admin metrics.", "error");
  }
}

function renderAdminActiveUsers(users) {
  const container = document.getElementById("admin-active-users-list");
  container.innerHTML = "";

  if (users.length === 0) {
    container.innerHTML = `<p class="empty-text">No active customers on the platform.</p>`;
    return;
  }

  users.forEach((u, i) => {
    const item = document.createElement("div");
    item.className = "analytics-item";
    item.innerHTML = `
      <span>${i + 1}. ${u.name} (ID: ${u.userId})</span>
      <span class="badge">${u.orders} Orders placed</span>
    `;
    container.appendChild(item);
  });
}

function renderAdminMonthlyHistory(hotels) {
  const container = document.getElementById("admin-monthly-history-list");
  container.innerHTML = "";

  if (hotels.length === 0) {
    container.innerHTML = `<p class="empty-text">No orders recorded yet.</p>`;
    return;
  }

  hotels.forEach((h, i) => {
    const item = document.createElement("div");
    item.className = "analytics-item";
    item.innerHTML = `
      <span>${i + 1}. ${h.name}</span>
      <span class="badge" style="background: rgba(0, 176, 255, 0.1); color: var(--info);">${h.orders} Sales</span>
    `;
    container.appendChild(item);
  });
}

async function loadAdminVendorManagement() {
  // Automatically handled directly inside loadAdminDashboard to sync metrics in single load
}

function renderAdminDeleteHotels(hotels) {
  const container = document.getElementById("admin-mgmt-hotels");
  container.innerHTML = "";

  hotels.forEach(h => {
    const item = document.createElement("div");
    item.className = "mgmt-item";
    item.innerHTML = `
      <div class="mgmt-item-info">
        <h5>${h.name}</h5>
        <p>${h.type} | ${h.phone}</p>
      </div>
      <button class="delete-btn" data-id="${h.id}"><i class="fa-solid fa-trash"></i> Remove</button>
    `;

    item.querySelector(".delete-btn").addEventListener("click", () => {
      deleteVendor("restaurant", h.id);
    });

    container.appendChild(item);
  });
}

function renderAdminDeleteDps(dps) {
  const container = document.getElementById("admin-mgmt-dps");
  container.innerHTML = "";

  dps.forEach(dp => {
    const item = document.createElement("div");
    item.className = "mgmt-item";
    item.innerHTML = `
      <div class="mgmt-item-info">
        <h5>${dp.name}</h5>
        <p>Mobile: ${dp.phone}</p>
      </div>
      <button class="delete-btn" data-id="${dp.id}"><i class="fa-solid fa-trash"></i> Remove</button>
    `;

    item.querySelector(".delete-btn").addEventListener("click", () => {
      deleteVendor("partner", dp.id);
    });

    container.appendChild(item);
  });
}

async function deleteVendor(type, id) {
  const confirmed = confirm(`Are you sure you want to delete this ${type} from the platform? This cannot be undone.`);
  if (!confirmed) return;

  showLoader(true, "Removing from Supabase database...");
  try {
    let endpoint = "";
    let query = "";
    if (type === "restaurant") {
      endpoint = "restaurant";
      query = `restaurantid=eq.${id}`;
    } else if (type === "partner") {
      endpoint = "deliverypartner_details";
      query = `dp_id=eq.${id}`;
    }

    const res = await supabaseFetch(`${endpoint}?${query}`, {
      method: "DELETE"
    });
    showLoader(false);

    if (res.ok || res.status === 204) {
      showToast("Database updated! Removed successfully.", "success");
      loadAdminDashboard();
    } else {
      showToast("Deletions failed.", "error");
    }
  } catch (e) {
    showLoader(false);
    showToast("Server error during deletion.", "error");
  }
}

// --- VIEW UTILITIES ---

function showLoader(show, text = "Loading...") {
  const overlay = document.getElementById("loading-overlay");
  if (show) {
    overlay.querySelector("p").textContent = text;
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

// Float custom toasts notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let iconClass = "fa-circle-info";
  if (type === "success") iconClass = "fa-circle-check";
  if (type === "error") iconClass = "fa-circle-exclamation";
  
  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Slide out after 3 seconds
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3500);
}

// Helper: debounce key entries
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper: Date parser
function formatDateStr(dateStr) {
  if (!dateStr) return "";
  return dateStr.replace(".0", "").replace("T", " ").substring(0, 16);
}

// ============================================================
//  ACCOUNT DETAILS MODAL
// ============================================================

async function openAccountModal() {
  const modal = document.getElementById("account-modal");
  if (!modal) return;

  // Reset form to loading state
  document.getElementById("acc-name").value = "";
  document.getElementById("acc-email").value = "";
  document.getElementById("acc-phone").value = "";
  document.getElementById("acc-address").value = "";

  modal.classList.remove("hidden");

  // Setup close button
  modal.querySelector(".close-modal-btn").onclick = () => modal.classList.add("hidden");
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

  const user = state.currentUser;
  if (!user) { modal.classList.add("hidden"); return; }

  const addressGroup = document.getElementById("acc-address-group");
  if (addressGroup) {
    addressGroup.style.display = user.role === 3 ? "none" : "block";
  }

  // Determine which table + fields to use per role
  let endpoint = "", nameField = "", emailField = "", phoneField = "", addressField = "", idField = "";
  if (user.role === 1) {
    endpoint    = `user_details?u_id=eq.${user.id}&select=u_id,u_name,u_email,u_phonenumber,u_address`;
    nameField   = "u_name"; emailField = "u_email"; phoneField = "u_phonenumber"; addressField = "u_address"; idField = "u_id";
  } else if (user.role === 2) {
    endpoint    = `restaurant?restaurantid=eq.${user.id}&select=restaurantid,restaurantname,r_email,restaurantphone,r_address`;
    nameField   = "restaurantname"; emailField = "r_email"; phoneField = "restaurantphone"; addressField = "r_address"; idField = "restaurantid";
  } else if (user.role === 3) {
    endpoint    = `deliverypartner_details?dp_id=eq.${user.id}&select=dp_id,dp_name,dp_email,dp_phonenumber`;
    nameField   = "dp_name"; emailField = "dp_email"; phoneField = "dp_phonenumber"; addressField = ""; idField = "dp_id";
  } else {
    // Admin — no editable profile
    document.getElementById("acc-name").value  = "Platform Admin";
    document.getElementById("acc-email").value = "admin@foodexpress.com";
    document.getElementById("acc-phone").value = "N/A";
    document.getElementById("acc-address").value = "N/A";
    return;
  }

  try {
    showLoader(true);
    const res = await supabaseFetch(endpoint);
    showLoader(false);

    if (!res.ok) { showToast("Failed to load account details.", "error"); modal.classList.add("hidden"); return; }
    const rows = await res.json();
    if (!rows || rows.length === 0) { showToast("User record not found.", "error"); modal.classList.add("hidden"); return; }

    const u = rows[0];
    document.getElementById("acc-name").value    = u[nameField]    || "";
    document.getElementById("acc-email").value   = u[emailField]   || "";
    document.getElementById("acc-phone").value   = u[phoneField]   || "";
    document.getElementById("acc-address").value = addressField ? (u[addressField] || "") : "N/A";

  } catch (err) {
    showLoader(false);
    showToast("Error loading account: " + (err.message || err), "error");
    modal.classList.add("hidden");
    return;
  }

  // Handle form save
  const form = document.getElementById("account-details-form");
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName    = document.getElementById("acc-name").value.trim();
    const newPhone   = document.getElementById("acc-phone").value.trim();
    const newAddress = document.getElementById("acc-address").value.trim();

    if (!newName || !newPhone) {
      showToast("Name and phone are required.", "error");
      return;
    }
    if (!newPhone.match(/^\d{10}$/)) {
      showToast("Phone must be exactly 10 digits.", "error");
      return;
    }

    // Build update payload per role
    let patchEndpoint = "";
    let patchBody = {};
    if (user.role === 1) {
      patchEndpoint = `user_details?u_id=eq.${user.id}`;
      patchBody = { u_name: newName, u_phonenumber: newPhone, u_address: newAddress };
    } else if (user.role === 2) {
      patchEndpoint = `restaurant?restaurantid=eq.${user.id}`;
      patchBody = { restaurantname: newName, restaurantphone: newPhone, r_address: newAddress };
    } else if (user.role === 3) {
      patchEndpoint = `deliverypartner_details?dp_id=eq.${user.id}`;
      patchBody = { dp_name: newName, dp_phonenumber: newPhone };
    }

    try {
      showLoader(true);
      const res = await supabaseFetch(patchEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify(patchBody)
      });
      showLoader(false);

      if (res.ok) {
        state.currentUser.name = newName;
        localStorage.setItem("food_express_user", JSON.stringify(state.currentUser));
        document.getElementById("header-user-name").textContent = `Welcome, ${newName}`;
        showToast("Account details updated successfully!", "success");
        modal.classList.add("hidden");
      } else {
        const errBody = await res.text();
        showToast("Update failed: " + errBody, "error");
      }
    } catch (err) {
      showLoader(false);
      showToast("Save error: " + (err.message || err), "error");
    }
  });

  // ── Change Password Section ────────────────────────────────
  // Reset panel state every time the modal opens
  const cpPanel   = document.getElementById("change-password-panel");
  const cpStep1   = document.getElementById("cp-step-1");
  const cpStep2   = document.getElementById("cp-step-2");
  const cpChevron = document.getElementById("change-password-chevron");
  const cpMsg     = document.getElementById("cp-verify-msg");

  cpPanel.classList.add("hidden");
  cpStep2.classList.add("hidden");
  cpStep1.classList.remove("hidden");
  cpChevron.style.transform = "rotate(0deg)";
  document.getElementById("acc-old-pass").value    = "";
  document.getElementById("acc-new-pass").value     = "";
  document.getElementById("acc-confirm-pass").value = "";
  if (cpMsg) { cpMsg.style.display = "none"; cpMsg.textContent = ""; }

  // Toggle collapse
  const toggle = document.getElementById("change-password-toggle");
  const newToggle = toggle.cloneNode(true);
  toggle.parentNode.replaceChild(newToggle, toggle);
  newToggle.addEventListener("click", () => {
    const isHidden = cpPanel.classList.contains("hidden");
    cpPanel.classList.toggle("hidden", !isHidden);
    cpChevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
  });

  // Verify old password button
  const verifyBtn = document.getElementById("verify-old-pass-btn");
  const newVerifyBtn = verifyBtn.cloneNode(true);
  verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
  newVerifyBtn.addEventListener("click", async () => {
    const oldPass = document.getElementById("acc-old-pass").value.trim();
    const msgEl   = document.getElementById("cp-verify-msg");
    if (!oldPass) {
      msgEl.style.display = "block";
      msgEl.style.color   = "var(--danger)";
      msgEl.textContent   = "Please enter your current password.";
      return;
    }

    // Fetch password from correct table
    let passEndpoint = "", passField = "";
    if (user.role === 1)      { passEndpoint = `user_details?u_id=eq.${user.id}&select=u_password`;            passField = "u_password"; }
    else if (user.role === 2) { passEndpoint = `restaurant?restaurantid=eq.${user.id}&select=r_pass`;          passField = "r_pass"; }
    else if (user.role === 3) { passEndpoint = `deliverypartner_details?dp_id=eq.${user.id}&select=dp_password`; passField = "dp_password"; }

    newVerifyBtn.disabled = true;
    newVerifyBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
    try {
      const res = await supabaseFetch(passEndpoint);
      const rows = res.ok ? await res.json() : [];
      newVerifyBtn.disabled = false;
      newVerifyBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> Verify Password`;

      if (rows && rows.length > 0 && rows[0][passField] === oldPass) {
        // ✅ Correct — show step 2
        msgEl.style.display = "none";
        cpStep1.classList.add("hidden");
        cpStep2.classList.remove("hidden");
      } else {
        // ❌ Wrong
        msgEl.style.display = "block";
        msgEl.style.color   = "var(--danger)";
        msgEl.textContent   = "❌ Incorrect password. Please try again.";
      }
    } catch (err) {
      newVerifyBtn.disabled = false;
      newVerifyBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> Verify Password`;
      msgEl.style.display = "block";
      msgEl.style.color   = "var(--danger)";
      msgEl.textContent   = "Verification error: " + (err.message || err);
    }
  });

  // Save new password button
  const savePassBtn = document.getElementById("save-new-pass-btn");
  const newSavePassBtn = savePassBtn.cloneNode(true);
  savePassBtn.parentNode.replaceChild(newSavePassBtn, savePassBtn);
  newSavePassBtn.addEventListener("click", async () => {
    const newPass     = document.getElementById("acc-new-pass").value.trim();
    const confirmPass = document.getElementById("acc-confirm-pass").value.trim();

    // Validation
    if (!newPass || !confirmPass) { showToast("Please fill in both password fields.", "error"); return; }
    if (newPass !== confirmPass)  { showToast("Passwords do not match.", "error"); return; }
    if (newPass.length < 6)       { showToast("Password must be at least 6 characters.", "error"); return; }
    if (!/[A-Z]/.test(newPass))   { showToast("Password must contain at least one uppercase letter.", "error"); return; }
    if (!/[^a-zA-Z0-9]/.test(newPass)) { showToast("Password must contain at least one special character.", "error"); return; }

    let patchEp = "", passBody = {};
    if (user.role === 1)      { patchEp = `user_details?u_id=eq.${user.id}`;              passBody = { u_password: newPass }; }
    else if (user.role === 2) { patchEp = `restaurant?restaurantid=eq.${user.id}`;        passBody = { r_pass: newPass }; }
    else if (user.role === 3) { patchEp = `deliverypartner_details?dp_id=eq.${user.id}`; passBody = { dp_password: newPass }; }

    showLoader(true, "Updating password in Supabase...");
    try {
      const res = await supabaseFetch(patchEp, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passBody)
      });
      showLoader(false);
      if (res.ok || res.status === 204) {
        showToast("✅ Password updated successfully!", "success");
        // Reset section back to step 1
        cpStep2.classList.add("hidden");
        cpStep1.classList.remove("hidden");
        cpPanel.classList.add("hidden");
        cpChevron.style.transform = "rotate(0deg)";
        document.getElementById("acc-old-pass").value    = "";
        document.getElementById("acc-new-pass").value     = "";
        document.getElementById("acc-confirm-pass").value = "";
      } else {
        showToast("Failed to update password.", "error");
      }
    } catch (err) {
      showLoader(false);
      showToast("Error: " + (err.message || err), "error");
    }
  });
}


// ============================================================
//  ORDER HISTORY MODAL
// ============================================================

async function openOrdersModal() {
  const modal = document.getElementById("orders-modal");
  if (!modal) return;

  const container = document.getElementById("orders-list-container");
  container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading your orders...</div>`;

  modal.classList.remove("hidden");

  // Setup close
  modal.querySelector(".close-modal-btn").onclick = () => modal.classList.add("hidden");
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

  const user = state.currentUser;
  if (!user || user.role !== 1) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Order history is only available for Customer accounts.</p>`;
    return;
  }

  try {
    // Fetch orders for this user, join restaurant name
    const res = await supabaseFetch(
      `orders?user_id=eq.${user.id}&select=order_id,total_amount,status,created_at,restaurant_id,restaurant(restaurantname)&order=created_at.desc`
    );

    if (!res.ok) {
      container.innerHTML = `<p style="color: var(--danger); text-align: center;">Failed to load order history.</p>`;
      return;
    }

    const orders = await res.json();

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-receipt" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.4;"></i>
          <p style="font-size: 1rem;">No orders yet.</p>
          <p style="font-size: 0.85rem;">Your placed orders will appear here.</p>
        </div>`;
      return;
    }

    // Fetch order_items for all those order IDs to show items
    const orderIds = orders.map(o => o.order_id).join(",");
    const itemsRes = await supabaseFetch(`order_items?order_id=in.(${orderIds})&select=order_id,item_name,qty,price`);
    let itemsByOrder = {};
    if (itemsRes.ok) {
      const items = await itemsRes.json();
      items.forEach(item => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      });
    }

    container.innerHTML = "";

    orders.forEach(order => {
      const restaurantName = order.restaurant?.restaurantname || "Unknown Restaurant";
      const dateStr = formatDateStr(order.created_at);
      const items = itemsByOrder[order.order_id] || [];
      const statusColor = {
        "DELIVERED": "var(--success)",
        "CANCELLED": "var(--danger)",
        "PREPARING": "#f59e0b",
        "OUT_FOR_DELIVERY": "#3b82f6",
        "READY": "#8b5cf6"
      }[order.status] || "var(--text-muted)";

      const itemsList = items.length > 0
        ? items.map(i => `<span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; font-size: 11px;">${i.item_name} x${i.qty}</span>`).join(" ")
        : `<span style="font-size: 11px; color: var(--text-muted);">No item details</span>`;

      const card = document.createElement("div");
      card.style.cssText = "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; transition: background 0.2s;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <p style="font-weight: 700; font-size: 15px; margin: 0 0 2px;">
              <i class="fa-solid fa-store" style="color: var(--accent); margin-right: 6px;"></i>${restaurantName}
            </p>
            <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
              <i class="fa-solid fa-calendar-days" style="margin-right: 4px;"></i>${dateStr}
              &nbsp;·&nbsp; Order #${order.order_id}
            </p>
          </div>
          <span style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: rgba(255,255,255,0.07); color: ${statusColor}; border: 1px solid ${statusColor}33;">
            ${order.status}
          </span>
        </div>
        <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
          ${itemsList}
        </div>
        <div style="display: flex; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
          <span style="font-size: 14px; font-weight: 700; color: var(--accent);">Total: ${parseFloat(order.total_amount).toFixed(2)} Rs.</span>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger); text-align: center;">Error: ${err.message || err}</p>`;
  }
}

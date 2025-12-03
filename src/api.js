export const API_BASE_URL = "https://dellytmf.onrender.com";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Error en la solicitud";
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return response;
}

export const AuthApi = {
  login: (email, password) =>
    apiFetch("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  registerCustomer: (fullName, email, password) =>
    apiFetch("/api/Auth/register/customer", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    }),
};

export const RestaurantsApi = {
  getAll: () => apiFetch("/api/Restaurants"),
  create: (name, address) =>
    apiFetch("/api/Restaurants", {
      method: "POST",
      body: JSON.stringify({ name, address }),
    }),
  getMenu: (restaurantId) => apiFetch(`/api/Restaurants/${restaurantId}/menu`),
  addProduct: (restaurantId, name, description, price) =>
    apiFetch(`/api/Restaurants/${restaurantId}/products`, {
      method: "POST",
      body: JSON.stringify({ name, description, price: Number(price) }),
    }),
};

export const OrdersApi = {
  createOrder: (restaurantId, deliveryAddress, items) =>
    apiFetch("/api/Orders", {
      method: "POST",
      body: JSON.stringify({ restaurantId, deliveryAddress, items }),
    }),
  getMyOrders: () => apiFetch("/api/Orders/my"),
};

export const OrdersPanelApi = {
  getAll: () => apiFetch("/api/OrdersPanel/all"),
  getPending: () => apiFetch("/api/OrdersPanel/pending"),
  assign: (id) =>
    apiFetch(`/api/OrdersPanel/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify({}),
    }),
  delivered: (id) =>
    apiFetch(`/api/OrdersPanel/${id}/delivered`, {
      method: "PUT",
      body: JSON.stringify({}),
    }),
};

export const ReportsApi = {
  downloadCsv: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/Reports/orders/csv`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Error al descargar el reporte");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-report.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

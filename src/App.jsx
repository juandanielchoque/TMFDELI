import React, { useEffect, useState } from "react";
import {
  AuthApi,
  RestaurantsApi,
  OrdersApi,
  OrdersPanelApi,
  ReportsApi,
} from "./api";

function decodeToken(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const json = JSON.parse(atob(payloadBase64));
    const role =
      json.role ||
      json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      "Customer";
    const fullName = json.fullName || json.name || "";
    const email = json.email || json.sub || "";
    return { role, fullName, email };
  } catch {
    return { role: "Customer", fullName: "", email: "" };
  }
}

const ROLE_LABELS = {
  Customer: "Consumidor",
  Driver: "Repartidor",
  Admin: "Administrador",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const info = decodeToken(token);
      setSession({ token, ...info });
      setView("dashboard");
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await AuthApi.login(loginEmail, loginPassword);
      const token = data.token || data.accessToken || data.jwt;
      if (!token) throw new Error("No se recibió token desde el backend");
      localStorage.setItem("token", token);
      const info = decodeToken(token);
      setSession({ token, ...info });
      setView("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await AuthApi.registerCustomer(
        registerFullName,
        registerEmail,
        registerPassword
      );
      alert("Cuenta de consumidor creada. Ahora inicia sesión.");
      setRegisterFullName("");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setSession(null);
    setView("auth");
  }

  return (
    <div className="app-bg">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title">
            <span className="app-logo">🧡</span>
            <div>
              <h1>DellyTMF</h1>
              <p>Delivery rápido y sencillo</p>
            </div>
          </div>
          {session && (
            <div className="user-badge">
              <div className="user-name">
                {session.fullName || session.email || "Usuario"}
              </div>
              <div className="user-role">
                {ROLE_LABELS[session.role] || session.role}
              </div>
              <button className="btn-secondary btn-xs" onClick={handleLogout}>
                Salir
              </button>
            </div>
          )}
        </header>

        <main className="app-main">
          {!session || view === "auth" ? (
            <AuthScreen
              loading={loading}
              error={error}
              loginEmail={loginEmail}
              loginPassword={loginPassword}
              setLoginEmail={setLoginEmail}
              setLoginPassword={setLoginPassword}
              handleLogin={handleLogin}
              registerFullName={registerFullName}
              registerEmail={registerEmail}
              registerPassword={registerPassword}
              setRegisterFullName={setRegisterFullName}
              setRegisterEmail={setRegisterEmail}
              setRegisterPassword={setRegisterPassword}
              handleRegister={handleRegister}
            />
          ) : (
            <Dashboard session={session} />
          )}
        </main>
      </div>
    </div>
  );
}

function AuthScreen(props) {
  const {
    loading,
    error,
    loginEmail,
    loginPassword,
    setLoginEmail,
    setLoginPassword,
    handleLogin,
    registerFullName,
    registerEmail,
    registerPassword,
    setRegisterFullName,
    setRegisterEmail,
    setRegisterPassword,
    handleRegister,
  } = props;

  return (
    <div className="auth-grid">
      <section className="card auth-card">
        <h2>Iniciar sesión</h2>
        <p className="muted">
          Usa el mismo inicio de sesión para consumidor, repartidor o admin.
        </p>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleLogin} className="form">
          <label>
            Correo
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </section>

      <section className="card auth-card secondary">
        <h2>Crear cuenta de consumidor</h2>
        <p className="muted">
          Solo los consumidores pueden registrarse desde la app.
        </p>
        <form onSubmit={handleRegister} className="form">
          <label>
            Nombre completo
            <input
              type="text"
              value={registerFullName}
              onChange={(e) => setRegisterFullName(e.target.value)}
              required
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn-outline w-full" disabled={loading}>
            {loading ? "Creando..." : "Registrarme"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Dashboard({ session }) {
  if (!session) return null;
  if (session.role === "Admin") return <AdminView />;
  if (session.role === "Driver") return <DriverView />;
  // por defecto consumidor
  return <CustomerView />;
}

function CustomerView() {
  const [tab, setTab] = useState("restaurants");
  return (
    <div className="mobile-tabs">
      <nav className="bottom-nav">
        <button
          className={tab === "restaurants" ? "nav-item active" : "nav-item"}
          onClick={() => setTab("restaurants")}
        >
          <span>Restaurantes</span>
        </button>
        <button
          className={tab === "orders" ? "nav-item active" : "nav-item"}
          onClick={() => setTab("orders")}
        >
          <span>Mis pedidos</span>
        </button>
      </nav>

      <div className="tab-panels">
        {tab === "restaurants" && <CustomerRestaurants />}
        {tab === "orders" && <CustomerOrders />}
      </div>
    </div>
  );
}

function CustomerRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    setLoading(true);
    try {
      const data = await RestaurantsApi.getAll();
      setRestaurants(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando restaurantes");
    } finally {
      setLoading(false);
    }
  }

  async function selectRestaurant(r) {
    setSelected(r);
    setMenu([]);
    setMenuLoading(true);
    try {
      const data = await RestaurantsApi.getMenu(r.id);
      setMenu(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando menú");
    } finally {
      setMenuLoading(false);
    }
  }

  function addToCart(p) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === p.id);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], quantity: clone[idx].quantity + 1 };
        return clone;
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }

  function updateQty(id, qty) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === id ? { ...i, quantity: qty } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  const total = cart.reduce(
    (s, i) => s + (i.product.price || 0) * i.quantity,
    0
  );

  async function placeOrder() {
    if (!selected) {
      alert("Selecciona un restaurante");
      return;
    }
    if (!address.trim()) {
      alert("Ingresa una dirección");
      return;
    }
    if (cart.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }
    const items = cart.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));
    setPlacingOrder(true);
    try {
      await OrdersApi.createOrder(selected.id, address.trim(), items);
      alert("Pedido creado 🎉");
      setCart([]);
      setAddress("");
    } catch (err) {
      console.error(err);
      alert("Error al crear el pedido: " + err.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="customer-layout">
      <section className="card card-scroll">
        <div className="card-header">
          <h2>Restaurantes</h2>
          <button className="btn-xs btn-secondary" onClick={loadRestaurants}>
            Recargar
          </button>
        </div>
        {loading ? (
          <p>Cargando...</p>
        ) : restaurants.length === 0 ? (
          <p className="muted">No hay restaurantes disponibles.</p>
        ) : (
          <div className="list">
            {restaurants.map((r) => (
              <button
                key={r.id}
                className={
                  "list-item" +
                  (selected && selected.id === r.id ? " list-item-active" : "")
                }
                onClick={() => selectRestaurant(r)}
              >
                <div>
                  <div className="list-title">{r.name}</div>
                  <div className="list-subtitle">{r.address}</div>
                </div>
                <span className="tag">Ver menú</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card card-scroll">
        <div className="card-header">
          <h2>Menú & Carrito</h2>
        </div>
        {!selected ? (
          <p className="muted">Selecciona un restaurante para ver su menú.</p>
        ) : menuLoading ? (
          <p>Cargando menú...</p>
        ) : (
          <>
            <p className="muted">
              {selected.name} – {selected.address}
            </p>
            <div className="menu-list">
              {menu.map((p) => (
                <div key={p.id} className="menu-item">
                  <div>
                    <div className="list-title">{p.name}</div>
                    <div className="list-subtitle">{p.description}</div>
                  </div>
                  <div className="menu-item-actions">
                    <span className="price">
                      S/. {Number(p.price || 0).toFixed(2)}
                    </span>
                    <button
                      className="btn-xs btn-primary"
                      onClick={() => addToCart(p)}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart">
              <h3>Tu pedido</h3>
              {cart.length === 0 ? (
                <p className="muted">Aún no agregas productos.</p>
              ) : (
                <div className="cart-list">
                  {cart.map((item) => (
                    <div key={item.product.id} className="cart-item">
                      <div className="list-title">{item.product.name}</div>
                      <div className="cart-controls">
                        <span className="price">
                          S/.{" "}
                          {(
                            (item.product.price || 0) * item.quantity
                          ).toFixed(2)}
                        </span>
                        <div className="qty-group">
                          <button
                            className="btn-xs"
                            type="button"
                            onClick={() =>
                              updateQty(item.product.id, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="btn-xs"
                            type="button"
                            onClick={() =>
                              updateQty(item.product.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="cart-total">
                    <span>Total</span>
                    <strong>S/. {total.toFixed(2)}</strong>
                  </div>
                </div>
              )}
              <label className="mt-8">
                Dirección de entrega
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Siempre Viva 123"
                />
              </label>
              <button
                className="btn-primary w-full"
                onClick={placeOrder}
                disabled={placingOrder || cart.length === 0}
              >
                {placingOrder ? "Enviando..." : "Confirmar pedido"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await OrdersApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <section className="card card-scroll">
      <div className="card-header">
        <h2>Mis pedidos</h2>
        <button className="btn-xs btn-secondary" onClick={loadOrders}>
          Recargar
        </button>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="muted">Todavía no tienes pedidos.</p>
      ) : (
        <div className="list">
          {orders.map((o) => (
            <div key={o.id} className="list-item">
              <div>
                <div className="list-title">
                  Pedido #{o.id} – {o.restaurantName || o.restaurant?.name}
                </div>
                <div className="list-subtitle">
                  {o.deliveryAddress} | {o.status || o.orderStatus}
                </div>
              </div>
              <span className="tag">
                S/. {Number(o.total || o.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DriverView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await OrdersApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando pedidos asignados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <section className="card card-scroll">
      <div className="card-header">
        <h2>Pedidos asignados</h2>
        <button className="btn-xs btn-secondary" onClick={loadOrders}>
          Recargar
        </button>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="muted">No tienes pedidos asignados por ahora.</p>
      ) : (
        <div className="list">
          {orders.map((o) => (
            <div key={o.id} className="list-item">
              <div>
                <div className="list-title">
                  Pedido #{o.id} – {o.restaurantName || o.restaurant?.name}
                </div>
                <div className="list-subtitle">
                  {o.deliveryAddress} | {o.status || o.orderStatus}
                </div>
              </div>
              <span className="tag">
                S/. {Number(o.total || o.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminView() {
  const [tab, setTab] = useState("orders");
  return (
    <div className="mobile-tabs">
      <nav className="bottom-nav">
        <button
          className={tab === "orders" ? "nav-item active" : "nav-item"}
          onClick={() => setTab("orders")}
        >
          <span>Pedidos</span>
        </button>
        <button
          className={tab === "restaurants" ? "nav-item active" : "nav-item"}
          onClick={() => setTab("restaurants")}
        >
          <span>Restaurantes</span>
        </button>
        <button
          className={tab === "reports" ? "nav-item active" : "nav-item"}
          onClick={() => setTab("reports")}
        >
          <span>Reportes</span>
        </button>
      </nav>
      <div className="tab-panels">
        {tab === "orders" && <AdminOrdersPanel />}
        {tab === "restaurants" && <AdminRestaurants />}
        {tab === "reports" && <AdminReports />}
      </div>
    </div>
  );
}

function AdminOrdersPanel() {
  const [pending, setPending] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [p, all] = await Promise.all([
        OrdersPanelApi.getPending(),
        OrdersPanelApi.getAll(),
      ]);
      setPending(p);
      setAllOrders(all);
    } catch (err) {
      console.error(err);
      alert("Error cargando panel de pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assign(id) {
    try {
      await OrdersPanelApi.assign(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error asignando pedido");
    }
  }

  async function delivered(id) {
    try {
      await OrdersPanelApi.delivered(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error marcando como entregado");
    }
  }

  return (
    <div className="admin-orders">
      <section className="card card-scroll">
        <div className="card-header">
          <h2>Pendientes</h2>
          <button className="btn-xs btn-secondary" onClick={loadData}>
            Recargar
          </button>
        </div>
        {loading && pending.length === 0 ? (
          <p>Cargando...</p>
        ) : pending.length === 0 ? (
          <p className="muted">No hay pedidos pendientes.</p>
        ) : (
          <div className="list">
            {pending.map((o) => (
              <div key={o.id} className="list-item">
                <div>
                  <div className="list-title">
                    Pedido #{o.id} – {o.restaurantName || o.restaurant?.name}
                  </div>
                  <div className="list-subtitle">
                    {o.deliveryAddress} | Cliente: {o.customerName}
                  </div>
                </div>
                <button
                  className="btn-xs btn-primary"
                  onClick={() => assign(o.id)}
                >
                  Tomar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card card-scroll">
        <div className="card-header">
          <h2>Todos los pedidos</h2>
          <button className="btn-xs btn-secondary" onClick={loadData}>
            Recargar
          </button>
        </div>
        {loading && allOrders.length === 0 ? (
          <p>Cargando...</p>
        ) : allOrders.length === 0 ? (
          <p className="muted">Aún no hay pedidos.</p>
        ) : (
          <div className="list">
            {allOrders.map((o) => (
              <div key={o.id} className="list-item">
                <div>
                  <div className="list-title">
                    #{o.id} – {o.restaurantName || o.restaurant?.name}
                  </div>
                  <div className="list-subtitle">
                    {o.deliveryAddress} | {o.status || o.orderStatus} | Driver:{" "}
                    {o.driverName || "No asignado"}
                  </div>
                </div>
                <button
                  className="btn-xs btn-primary"
                  onClick={() => delivered(o.id)}
                >
                  Entregado
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");

  async function loadRestaurants() {
    setLoading(true);
    try {
      const data = await RestaurantsApi.getAll();
      setRestaurants(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando restaurantes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadMenu(r) {
    setSelected(r);
    setMenu([]);
    setMenuLoading(true);
    try {
      const data = await RestaurantsApi.getMenu(r.id);
      setMenu(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando menú");
    } finally {
      setMenuLoading(false);
    }
  }

  async function createRestaurant(e) {
    e.preventDefault();
    try {
      await RestaurantsApi.create(name, address);
      setName("");
      setAddress("");
      await loadRestaurants();
      alert("Restaurante creado");
    } catch (err) {
      console.error(err);
      alert("Error creando restaurante");
    }
  }

  async function addProduct(e) {
    e.preventDefault();
    if (!selected) {
      alert("Selecciona un restaurante primero");
      return;
    }
    try {
      await RestaurantsApi.addProduct(
        selected.id,
        prodName,
        prodDesc,
        prodPrice
      );
      setProdName("");
      setProdDesc("");
      setProdPrice("");
      await loadMenu(selected);
      alert("Producto agregado");
    } catch (err) {
      console.error(err);
      alert("Error agregando producto");
    }
  }

  return (
    <div className="admin-restaurants">
      <section className="card card-scroll">
        <h2>Restaurantes</h2>
        <form className="form mt-8" onSubmit={createRestaurant}>
          <label>
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Dirección
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary" type="submit">
            Crear restaurante
          </button>
        </form>
        <div className="list mt-8">
          {loading ? (
            <p>Cargando...</p>
          ) : restaurants.length === 0 ? (
            <p className="muted">No hay restaurantes aún.</p>
          ) : (
            restaurants.map((r) => (
              <button
                key={r.id}
                className={
                  "list-item" +
                  (selected && selected.id === r.id ? " list-item-active" : "")
                }
                onClick={() => loadMenu(r)}
              >
                <div>
                  <div className="list-title">{r.name}</div>
                  <div className="list-subtitle">{r.address}</div>
                </div>
                <span className="tag">Menú</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="card card-scroll">
        <h2>Menú del restaurante</h2>
        {selected ? (
          <>
            <p className="muted">
              {selected.name} – {selected.address}
            </p>
            {menuLoading ? (
              <p>Cargando menú...</p>
            ) : menu.length === 0 ? (
              <p className="muted">Este restaurante aún no tiene productos.</p>
            ) : (
              <div className="list mt-4">
                {menu.map((p) => (
                  <div key={p.id} className="list-item">
                    <div>
                      <div className="list-title">{p.name}</div>
                      <div className="list-subtitle">{p.description}</div>
                    </div>
                    <span className="tag">
                      S/. {Number(p.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form className="form mt-8" onSubmit={addProduct}>
              <h3>Agregar producto</h3>
              <label>
                Nombre
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                />
              </label>
              <label>
                Descripción
                <input
                  type="text"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  required
                />
              </label>
              <label>
                Precio
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  required
                />
              </label>
              <button className="btn-outline" type="submit">
                Guardar producto
              </button>
            </form>
          </>
        ) : (
          <p className="muted">
            Selecciona un restaurante para ver y gestionar su menú.
          </p>
        )}
      </section>
    </div>
  );
}

function AdminReports() {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      await ReportsApi.downloadCsv();
    } catch (err) {
      console.error(err);
      alert("Error descargando reporte");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="card card-scroll">
      <h2>Reportes</h2>
      <p className="muted">
        Genera un archivo CSV con todas las órdenes registradas en el sistema.
      </p>
      <button
        className="btn-primary mt-8"
        onClick={download}
        disabled={downloading}
      >
        {downloading ? "Generando..." : "Descargar reporte CSV"}
      </button>
    </section>
  );
}

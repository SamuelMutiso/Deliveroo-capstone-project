import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");
const PORT = 3001;

const app = express();

app.use(express.json());

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(items) {
  return items.length
    ? Math.max(...items.map((item) => Number(item.id) || 0)) + 1
    : 1;
}

function getUserFromRequest(req, db) {
  const auth = req.headers.authorization;

  if (!auth) return null;

  const token = auth.replace("Bearer ", "");

  if (!token.startsWith("demo-token-")) return null;

  const userId = Number(token.replace("demo-token-", ""));

  return db.users.find((user) => user.id === userId) || null;
}

function publicUser(user) {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
}

function pagination(items, req) {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.per_page) || 10;

  const start = (page - 1) * perPage;
  const paginated = items.slice(start, start + perPage);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return {
    items: paginated,
    meta: {
      page,
      per_page: perPage,
      total,
      pages,
      has_next: page < pages,
      has_prev: page > 1,
    },
  };
}

/* =========================================================
   AUTH
========================================================= */

app.post("/auth/register", (req, res) => {
  const db = readDb();
  const { name, email, password, role = "customer" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required.",
    });
  }

  const existing = db.users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    return res.status(409).json({
      message: "An account with that email already exists.",
    });
  }

  const user = {
    id: nextId(db.users),
    name,
    email,
    password,
    role,
  };

  db.users.push(user);
  writeDb(db);

  return res.status(201).json({
    user: publicUser(user),
    access_token: `demo-token-${user.id}`,
    refresh_token: `demo-refresh-${user.id}`,
  });
});

app.post("/auth/login", (req, res) => {
  const db = readDb();
  const { email, password } = req.body;

  const user = db.users.find(
    (item) =>
      item.email.toLowerCase() === String(email).toLowerCase() &&
      item.password === password,
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password.",
    });
  }

  return res.json({
    user: publicUser(user),
    access_token: `demo-token-${user.id}`,
    refresh_token: `demo-refresh-${user.id}`,
  });
});

app.get("/auth/me", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  return res.json({
    user: publicUser(user),
  });
});

app.patch("/auth/me", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  Object.assign(user, req.body);

  writeDb(db);

  return res.json({
    user: publicUser(user),
  });
});

app.post("/auth/logout", (_req, res) => {
  res.json({
    message: "Logged out successfully.",
  });
});

/*
 * The real frontend has refresh-token handling.
 * For the presentation mock, the demo token never expires.
 */
app.post("/auth/refresh", (req, res) => {
  const refreshToken = req.headers.authorization?.replace("Bearer ", "");

  if (!refreshToken?.startsWith("demo-refresh-")) {
    return res.status(401).json({
      message: "Invalid refresh token.",
    });
  }

  const userId = Number(refreshToken.replace("demo-refresh-", ""));

  const db = readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(401).json({
      message: "User not found.",
    });
  }

  return res.json({
    access_token: `demo-token-${user.id}`,
  });
});

/* =========================================================
   CUSTOMER ORDERS
========================================================= */

app.get("/orders/categories", (_req, res) => {
  res.json({
    categories: [
      {
        id: 1,
        name: "Documents",
      },
      {
        id: 2,
        name: "Food",
      },
      {
        id: 3,
        name: "Packages",
      },
      {
        id: 4,
        name: "Other",
      },
    ],
  });
});

app.get("/orders/couriers", (_req, res) => {
  const db = readDb();

  res.json({
    couriers: db.couriers,
  });
});

app.post("/orders/quote", (req, res) => {
  const distance = Number(req.body.distance || 5);

  const baseFee = 150;
  const perKm = 50;

  const deliveryFee = Math.round(baseFee + distance * perKm);

  res.json({
    distance_km: distance,
    delivery_fee: deliveryFee,
    total: deliveryFee,
    currency: "KES",
  });
});

app.get("/orders", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  let orders = db.orders;

  if (user.role === "customer") {
    orders = orders.filter((order) => order.customer_id === user.id);
  }

  if (req.query.status) {
    orders = orders.filter((order) => order.status === req.query.status);
  }

  if (req.query.search) {
    const search = String(req.query.search).toLowerCase();

    orders = orders.filter((order) =>
      JSON.stringify(order).toLowerCase().includes(search),
    );
  }

  res.json(pagination(orders, req));
});

app.post("/orders", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  const order = {
    id: nextId(db.orders),
    customer_id: user.id,
    courier_id: null,
    status: "pending",
    created_at: new Date().toISOString(),
    ...req.body,
  };

  db.orders.unshift(order);

  writeDb(db);

  res.status(201).json({
    order,
  });
});

app.get("/orders/:id", (req, res) => {
  const db = readDb();
  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  res.json({
    order,
  });
});

app.get("/orders/:id/events", (req, res) => {
  const db = readDb();

  const events = db.trackingEvents.filter(
    (event) => event.order_id === Number(req.params.id),
  );

  res.json({
    events,
  });
});

app.patch("/orders/:id/destination", (req, res) => {
  const db = readDb();

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  Object.assign(order, req.body);

  writeDb(db);

  res.json({
    order,
  });
});

app.patch("/orders/:id/cancel", (req, res) => {
  const db = readDb();

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  order.status = "cancelled";

  writeDb(db);

  res.json({
    order,
  });
});

/* =========================================================
   COURIER
========================================================= */

app.get("/courier/orders", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  const courier = db.couriers.find((item) => item.user_id === user.id);

  if (!courier) {
    return res.json({
      items: [],
      meta: {
        page: 1,
        per_page: 10,
        total: 0,
        pages: 0,
        has_next: false,
        has_prev: false,
      },
    });
  }

  const orders = db.orders.filter((order) => order.courier_id === courier.id);

  res.json(pagination(orders, req));
});

app.get("/courier/orders/:id", (req, res) => {
  const db = readDb();

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  res.json({
    order,
  });
});

app.patch("/courier/orders/:id/status", (req, res) => {
  const db = readDb();

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  order.status = req.body.status;

  if (req.body.note) {
    order.status_note = req.body.note;
  }

  const event = {
    id: nextId(db.trackingEvents),
    order_id: order.id,
    status: order.status,
    description: req.body.note || `Order status updated to ${order.status}.`,
    created_at: new Date().toISOString(),
  };

  db.trackingEvents.push(event);

  writeDb(db);

  res.json({
    order,
  });
});

app.patch("/courier/orders/:id/location", (req, res) => {
  const db = readDb();

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  order.lat = req.body.lat;
  order.lng = req.body.lng;

  writeDb(db);

  res.json({
    order,
  });
});

app.patch("/courier/availability", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  const courier = db.couriers.find((item) => item.user_id === user.id);

  if (!courier) {
    return res.status(404).json({
      message: "Courier profile not found.",
    });
  }

  courier.is_available = Boolean(req.body.is_available);
  courier.availability = courier.is_available;

  writeDb(db);

  res.json({
    courier,
  });
});

app.get("/courier/stats", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  const courier = db.couriers.find((item) => item.user_id === user?.id);

  const orders = courier
    ? db.orders.filter((order) => order.courier_id === courier.id)
    : [];

  res.json({
    total_orders: orders.length,
    completed_orders: orders.filter((order) => order.status === "delivered")
      .length,
    active_orders: orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.status),
    ).length,
    earnings: orders
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + Number(order.delivery_fee || 0), 0),
  });
});

/* =========================================================
   COURIER APPLICATIONS
========================================================= */

app.get("/courier-applications/vehicle-types", (_req, res) => {
  const db = readDb();

  res.json({
    vehicle_types: db.vehicleTypes,
  });
});

app.get("/courier-applications/mine", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  const applications = db.courierApplications.filter(
    (application) => application.user_id === user?.id,
  );

  res.json({
    applications,
  });
});

app.post("/courier-applications", (req, res) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({
      message: "Not authenticated.",
    });
  }

  const application = {
    id: nextId(db.courierApplications),
    user_id: user.id,
    status: "pending",
    created_at: new Date().toISOString(),
    ...req.body,
  };

  db.courierApplications.push(application);

  writeDb(db);

  res.status(201).json({
    application,
  });
});

app.delete("/courier-applications/:id", (req, res) => {
  const db = readDb();

  const id = Number(req.params.id);

  const index = db.courierApplications.findIndex(
    (application) => application.id === id,
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Application not found.",
    });
  }

  const [application] = db.courierApplications.splice(index, 1);

  writeDb(db);

  res.json({
    application,
  });
});

/* =========================================================
   ADMIN
========================================================= */

function requireAdmin(req, res, db) {
  const user = getUserFromRequest(req, db);

  if (!user || user.role !== "admin") {
    res.status(403).json({
      message: "Admin access required.",
    });

    return null;
  }

  return user;
}

app.get("/admin/orders", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  let orders = [...db.orders];

  if (req.query.status) {
    orders = orders.filter((order) => order.status === req.query.status);
  }

  if (req.query.courier_id) {
    orders = orders.filter(
      (order) => order.courier_id === Number(req.query.courier_id),
    );
  }

  if (req.query.search) {
    const search = String(req.query.search).toLowerCase();

    orders = orders.filter((order) =>
      JSON.stringify(order).toLowerCase().includes(search),
    );
  }

  res.json(pagination(orders, req));
});

app.get("/admin/orders/:id", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  res.json({
    order,
  });
});

app.patch("/admin/orders/:id/status", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  order.status = req.body.status;

  if (req.body.note) {
    order.status_note = req.body.note;
  }

  writeDb(db);

  res.json({
    order,
  });
});

app.patch("/admin/orders/:id/location", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  order.lat = req.body.lat;
  order.lng = req.body.lng;

  writeDb(db);

  res.json({
    order,
  });
});

app.patch("/admin/orders/:id/assign", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const order = db.orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found.",
    });
  }

  order.courier_id = Number(req.body.courier_id);
  order.status = "assigned";

  writeDb(db);

  res.json({
    order,
  });
});

app.get("/admin/couriers", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  res.json({
    couriers: db.couriers,
  });
});

app.get("/admin/users", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  let users = db.users.map(publicUser);

  if (req.query.role) {
    users = users.filter((user) => user.role === req.query.role);
  }

  if (req.query.search) {
    const search = String(req.query.search).toLowerCase();

    users = users.filter((user) =>
      JSON.stringify(user).toLowerCase().includes(search),
    );
  }

  res.json(pagination(users, req));
});

app.get("/admin/users/:id", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const user = db.users.find((item) => item.id === Number(req.params.id));

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  res.json({
    user: publicUser(user),
  });
});

app.patch("/admin/users/:id", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const user = db.users.find((item) => item.id === Number(req.params.id));

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  Object.assign(user, req.body);

  writeDb(db);

  res.json({
    user: publicUser(user),
  });
});

app.get("/admin/courier-applications", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  let applications = [...db.courierApplications];

  if (req.query.status) {
    applications = applications.filter(
      (application) => application.status === req.query.status,
    );
  }

  res.json({
    applications,
    pending_count: db.courierApplications.filter(
      (application) => application.status === "pending",
    ).length,
  });
});

app.patch("/admin/courier-applications/:id/approve", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const application = db.courierApplications.find(
    (item) => item.id === Number(req.params.id),
  );

  if (!application) {
    return res.status(404).json({
      message: "Application not found.",
    });
  }

  application.status = "approved";
  application.note = req.body.note || "";

  const credentials = {
    email: `courier${application.user_id}@deliveroo.test`,
    temporary_password: "123456",
  };

  writeDb(db);

  res.json({
    application,
    credentials,
  });
});

app.patch("/admin/courier-applications/:id/reject", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  const application = db.courierApplications.find(
    (item) => item.id === Number(req.params.id),
  );

  if (!application) {
    return res.status(404).json({
      message: "Application not found.",
    });
  }

  application.status = "rejected";
  application.note = req.body.note || "";

  writeDb(db);

  res.json({
    application,
  });
});

app.get("/admin/stats", (req, res) => {
  const db = readDb();

  if (!requireAdmin(req, res, db)) return;

  res.json({
    total_orders: db.orders.length,
    pending_orders: db.orders.filter((order) => order.status === "pending")
      .length,
    active_orders: db.orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.status),
    ).length,
    completed_orders: db.orders.filter((order) => order.status === "delivered")
      .length,
    total_users: db.users.length,
    total_couriers: db.couriers.length,
    pending_applications: db.courierApplications.filter(
      (application) => application.status === "pending",
    ).length,
  });
});

/* =========================================================
   START
========================================================= */

app.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}`);
  console.log(`Using database: ${DB_FILE}`);
});

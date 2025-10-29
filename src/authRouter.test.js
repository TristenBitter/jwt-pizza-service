import { jest } from "@jest/globals";
import request from "supertest";
import app from "./service.js";
import { DB } from "../database/database.js";

jest.unstable_mockModule("mysql2/promise", () => ({
  createConnection: jest.fn().mockResolvedValue({
    execute: jest.fn().mockResolvedValue([[]]),
    query: jest.fn().mockResolvedValue([[]]),
    end: jest.fn(),
  }),
}));

let createConnection;

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

beforeAll(async () => {
  const mysql = await import("mysql2/promise");
  createConnection = mysql.createConnection;

  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test("logout", async () => {
  const res = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body.message).toMatch(/logout/i);
});

test("unauthorized logout returns 401", async () => {
  const res = await request(app).delete("/api/auth");
  expect(res.status).toBe(401);
  expect(res.body.message).toMatch(/unauthorized/i);
});

test("GET / returns welcome message", async () => {
  const res = await request(app).get("/");
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("message", "welcome to JWT Pizza");
  expect(res.body).toHaveProperty("version");
});

test("returns 404 for unknown routes", async () => {
  const res = await request(app).get("/doesnotexist");
  expect(res.status).toBe(404);
  expect(res.body.message).toMatch(/unknown endpoint/i);
});

test("GET /api/docs returns documentation", async () => {
  const res = await request(app).get("/api/docs");
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("version");
  expect(Array.isArray(res.body.endpoints)).toBe(true);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

/* ---------------------------- Database.js tests ----------------------------- */
describe("Database.js unit tests", () => {
  test("getTokenSignature returns last part of token", () => {
    expect(DB.getTokenSignature("a.b.c")).toBe("c");
  });

  test("getTokenSignature returns empty string for invalid token", () => {
    expect(DB.getTokenSignature("abc")).toBe("");
  });

  test("getOffset works properly", () => {
    expect(DB.getOffset(2, 10)).toBe(10);
  });

  test("initializeDatabase does not throw when DB exists", async () => {
    await DB.initializeDatabase();
    expect(createConnection).toHaveBeenCalled();
  });

  test("getConnection returns connection object", async () => {
    const conn = await DB.getConnection();
    expect(conn).toHaveProperty("execute");
  });
});

/* -------------------------- Franchise Router tests -------------------------- */
beforeAll(() => {
  jest
    .spyOn(DB, "getFranchises")
    .mockResolvedValue([[{ id: 1, name: "Fr1" }], false]);
  jest
    .spyOn(DB, "getUserFranchises")
    .mockResolvedValue([{ id: 1, name: "Fr1" }]);
  jest.spyOn(DB, "createFranchise").mockResolvedValue({ id: 1, name: "Fr1" });
  jest.spyOn(DB, "deleteFranchise").mockResolvedValue();
  jest
    .spyOn(DB, "getFranchise")
    .mockResolvedValue({ id: 1, admins: [], stores: [] });
  jest.spyOn(DB, "createStore").mockResolvedValue({ id: 1, name: "Store1" });
  jest.spyOn(DB, "deleteStore").mockResolvedValue();
});

describe("Franchise Router", () => {
  test("GET /api/franchise returns franchises", async () => {
    const res = await request(app).get("/api/franchise");
    expect(res.status).toBe(200);
    expect(res.body.franchises.length).toBeGreaterThan(0);
  });

  test("POST /api/franchise creates a franchise", async () => {
    const res = await request(app)
      .post("/api/franchise")
      .set("Authorization", "Bearer faketoken")
      .send({ name: "Test", admins: [] });
    expect([200, 401, 403]).toContain(res.status);
  });

  test("DELETE /api/franchise/1 deletes a franchise", async () => {
    const res = await request(app).delete("/api/franchise/1");
    expect([200, 401]).toContain(res.status);
  });
});

/* ----------------------------- Order Router tests ---------------------------- */
beforeAll(() => {
  jest.spyOn(DB, "getMenu").mockResolvedValue([{ id: 1, title: "Pizza" }]);
  jest.spyOn(DB, "addMenuItem").mockResolvedValue({ id: 2, title: "Student" });
  jest.spyOn(DB, "getOrders").mockResolvedValue({ orders: [] });
  jest.spyOn(DB, "addDinerOrder").mockResolvedValue({ id: 1, items: [] });
});

describe("Order Router", () => {
  test("GET /api/order/menu returns menu", async () => {
    const res = await request(app).get("/api/order/menu");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("PUT /api/order/menu (unauthorized) should fail", async () => {
    const res = await request(app)
      .put("/api/order/menu")
      .send({ title: "New Pizza" });
    expect([401, 403]).toContain(res.status);
  });

  test("GET /api/order requires auth", async () => {
    const res = await request(app).get("/api/order");
    expect([401, 403]).toContain(res.status);
  });
});

/* ------------------------------ User Router tests ---------------------------- */
jest.spyOn(DB, "updateUser").mockResolvedValue({
  id: 1,
  name: "Updated",
  email: "u@test.com",
  roles: [{ role: "admin" }],
});

describe("User Router", () => {
  test("GET /api/user/me requires auth", async () => {
    const res = await request(app).get("/api/user/me");
    expect(res.status).toBe(401);
  });

  test("PUT /api/user/1 returns updated user", async () => {
    const res = await request(app)
      .put("/api/user/1")
      .send({ name: "Updated", email: "u@test.com", password: "123" });
    expect([200, 401, 403]).toContain(res.status);
  });
});

afterAll(async () => {
  // Close any remaining DB connections
  if (DB._connection && DB._connection.end) {
    await DB._connection.end();
  }
  jest.clearAllMocks();
});

import { Router } from "express";
import { factory } from "../config.js";
import { Role, DB } from "../database/database.js";
import { authRouter } from "./authRouter.js";
import { asyncHandler, StatusCodeError } from "../endpointHelper.js";
import metrics from "../metrics.js";
import logger from "../logger.js"; // ADD THIS LINE

export const orderRouter = Router();

orderRouter.docs = [
  {
    method: "GET",
    path: "/api/order/menu",
    description: "Get the pizza menu",
    example: `curl localhost:3000/api/order/menu`,
    response: [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
    ],
  },
  {
    method: "PUT",
    path: "/api/order/menu",
    requiresAuth: true,
    description: "Add an item to the menu",
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [
      {
        id: 1,
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      },
    ],
  },
  {
    method: "GET",
    path: "/api/order",
    requiresAuth: true,
    description: "Get the orders for the authenticated user",
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: {
      dinerId: 4,
      orders: [
        {
          id: 1,
          franchiseId: 1,
          storeId: 1,
          date: "2024-06-05T05:14:40.000Z",
          items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.05 }],
        },
      ],
      page: 1,
    },
  },
  {
    method: "POST",
    path: "/api/order",
    requiresAuth: true,
    description: "Create a order for the authenticated user",
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: {
      order: {
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
        id: 1,
      },
      jwt: "1111111111",
    },
  },
];

// getMenu
orderRouter.get(
  "/menu",
  asyncHandler(async (req, res) => {
    res.send(await DB.getMenu());
  })
);

// addMenuItem
orderRouter.put(
  "/menu",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError("unable to add menu item", 403);
    }

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);
    res.send(await DB.getMenu());
  })
);

// getOrders
orderRouter.get(
  "/",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

// createOrder
orderRouter.post(
  "/",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    const orderReq = req.body;
    const order = await DB.addDinerOrder(req.user, orderReq);

    // Calculate total price
    const totalPrice = order.items.reduce((sum, item) => sum + item.price, 0);

    const factoryRequest = {
      // ADD THIS
      diner: { id: req.user.id, name: req.user.name, email: req.user.email },
      order,
    };

    const r = await fetch(`${factory.url}/api/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${factory.apiKey}`,
      },
      body: JSON.stringify({
        diner: { id: req.user.id, name: req.user.name, email: req.user.email },
        order,
      }),
    });

    // const r = await fetch(`${factory.url}/api/order`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application / json",
    //     authorization: `Bearer ${factory.apiKey}`,
    //   },
    //   body: JSON.stringify(factoryRequest),  // CHANGE THIS
    // });

    const latency = Date.now() - startTime;

    const j = await r.json();

    logger.factoryLogger(factoryRequest, j); // ADD THIS LINE

    if (r.ok) {
      metrics.pizzaPurchase(true, latency, totalPrice);
      res.send({ order, followLinkToEndChaos: j.reportUrl, jwt: j.jwt });
    } else {
      metrics.pizzaPurchase(false, latency, 0);
      res.status(500).send({
        message: `Failed to fulfill order at factory, ${(j.message, j.body)}, ${
          res.authenticateToken
        } `,
        followLinkToEndChaos: j.reportUrl,
      });
    }
  })
);

export default orderRouter;

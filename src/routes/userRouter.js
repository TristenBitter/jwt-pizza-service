import { Router } from "express";
import { asyncHandler } from "../endpointHelper.js";
import { DB, Role } from "../database/database.js";
import { authRouter, setAuth } from "./authRouter.js";

export const userRouter = Router();

userRouter.docs = [
  {
    method: "GET",
    path: "/api/user/me",
    requiresAuth: true,
    description: "Get authenticated user",
    example: `curl -X GET localhost:3000/api/user/me -H 'Authorization: Bearer tttttt'`,
    response: {
      id: 1,
      name: "常用名字",
      email: "a@jwt.com",
      roles: [{ role: "admin" }],
    },
  },
  {
    method: "GET",
    path: "/api/user?page=1&limit=10&name=*",
    requiresAuth: true,
    description: "Gets a list of users",
    example: `curl -X GET localhost:3000/api/user -H 'Authorization: Bearer tttttt'`,
    response: {
      users: [
        {
          id: 1,
          name: "常用名字",
          email: "a@jwt.com",
          roles: [{ role: "admin" }],
        },
      ],
      more: false,
    },
  },
  {
    method: "PUT",
    path: "/api/user/:userId",
    requiresAuth: true,
    description: "Update user",
    example: `curl -X PUT localhost:3000/api/user/1 -d '{"name":"常用名字", "email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt'`,
    response: {
      user: {
        id: 1,
        name: "常用名字",
        email: "a@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "tttttt",
    },
  },
  {
    method: "DELETE",
    path: "/api/user/:userId",
    requiresAuth: true,
    description: "Delete a user",
    example: `curl -X DELETE localhost:3000/api/user/1 -H 'Authorization: Bearer tttttt'`,
    response: { message: "user deleted" },
  },
];

// getUser
userRouter.get(
  "/me",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  })
);

// listUsers - MUST come before /:userId to avoid route conflicts
userRouter.get(
  "/",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    // Only admins can list users
    if (!req.user.isRole(Role.Admin)) {
      return res.status(403).json({ message: "unauthorized" });
    }

    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const name = req.query.name || "*";

    // Get users from database with pagination
    const users = await DB.getUsers(page, limit, name);

    res.json(users);
  })
);

// updateUser
userRouter.put(
  "/:userId",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userId = Number(req.params.userId);
    const user = req.user;
    if (user.id !== userId && !user.isRole(Role.Admin)) {
      return res.status(403).json({ message: "unauthorized" });
    }

    const updatedUser = await DB.updateUser(userId, name, email, password);
    const auth = await setAuth(updatedUser);
    res.json({ user: updatedUser, token: auth });
  })
);

// deleteUser
userRouter.delete(
  "/:userId",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    // Only admins can delete users
    if (!req.user.isRole(Role.Admin)) {
      return res.status(403).json({ message: "unauthorized" });
    }

    const userId = Number(req.params.userId);

    // Don't allow deleting yourself
    if (req.user.id === userId) {
      return res.status(400).json({ message: "cannot delete yourself" });
    }

    await DB.deleteUser(userId);
    res.json({ message: "user deleted" });
  })
);

export default userRouter;

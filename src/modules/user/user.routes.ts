import { Router } from "express";
import { createRoute } from "../../core/framework";
import { UserService } from "./user.service";
import {
  getUsersContract,
  getUserByIdContract,
  deleteUserContract,
} from "./user.contracts";

const router = Router();
const userService = new UserService();

router.get(
  "/",
  ...createRoute(getUsersContract, async ({ query }) => {
    const { data, total } = await userService.getAllUsers(query as { page?: string; limit?: string });
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    return {
      status: 200,
      message: "Users retrieved",
      data: {
        users: data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    };
  }),
);

router.get(
  "/:id",
  ...createRoute(getUserByIdContract, async ({ params }) => {
    const user = await userService.getUserById(params.id);
    return { status: 200, data: user, message: "User retrieved" };
  }),
);

router.delete(
  "/:id",
  ...createRoute(deleteUserContract, async ({ params }) => {
    await userService.deleteUser(params.id);
    return { status: 200, message: "User deleted" };
  }),
);

export { router as userRouter };

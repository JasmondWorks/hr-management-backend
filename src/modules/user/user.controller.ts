import { Request, Response } from "express";
import { UserService } from "./user.service";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { data, total } = await this.userService.getAllUsers({
      page: String(page),
      limit: String(limit),
    });

    res.status(200).json({
      success: true,
      message: "Users retrieved",
      data: {
        users: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.getUserById(req.params.id as string);
    res.status(200).json({
      success: true,
      message: "User retrieved",
      data: user,
    });
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    await this.userService.deleteUser(req.params.id as string);
    res.status(200).json({
      success: true,
      message: "User deleted",
    });
  };
}

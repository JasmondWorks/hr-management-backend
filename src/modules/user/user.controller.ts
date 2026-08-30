import { Request, Response } from "express";
import { UserService } from "./user.service";
import { sendSuccess } from "../../core/utils/response.util";
import { parseQuery } from "../../core/dto/query.dto";
import { BadRequestException } from "../../core/errors/app.error";

export class UserController {
  constructor(private readonly userService: UserService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.user!;
    
    if (!organizationId) {
      sendSuccess(res, 200, "Users retrieved", [], {
        page: 1, limit: 10, total: 0, totalPages: 0
      });
      return;
    }

    const parsed = parseQuery(req.query as Record<string, string>);
    const { data, total } = await this.userService.getAllUsers(
      req.query as Record<string, string>,
      organizationId
    );

    sendSuccess(res, 200, "Users retrieved", data, {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    // Deliberately not requireOrg: a user reading themselves may not have an
    // organization yet. The service decides what they are allowed to see.
    const user = await this.userService.getUserById(
      req.params.id as string,
      req.user!.organizationId,
      req.user!.userId,
    );
    sendSuccess(res, 200, "User retrieved", user);
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    await this.userService.deleteUser(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "User deleted");
  };
}

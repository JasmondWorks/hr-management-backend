import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  getNotificationsSchema,
  notificationIdParamSchema,
} from "./notification.dto";
import { catchAsync } from "../../core/utils/catch-async";
import { authenticate } from "../../core/middlewares/auth.middleware";

const router = Router();
const notificationService = new NotificationService();
const notificationController = new NotificationController(notificationService);

router.use(authenticate);

router.get(
  "/",
  validate(getNotificationsSchema),
  catchAsync(notificationController.getMine),
);

router.patch("/read-all", catchAsync(notificationController.markAllRead));

router.patch(
  "/:id/read",
  validate(notificationIdParamSchema),
  catchAsync(notificationController.markRead),
);

export { router as notificationRouter };

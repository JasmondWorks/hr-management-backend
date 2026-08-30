import { Router } from "express";
import multer from "multer";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../core/utils/catch-async";

const router = Router();
const uploadService = new UploadService();
const uploadController = new UploadController(uploadService);

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authenticate);

router.post(
  "/single",
  upload.single("file"),
  catchAsync(uploadController.uploadSingle)
);

router.post(
  "/batch",
  upload.array("files", 10), // Limit to 10 files per batch
  catchAsync(uploadController.uploadBatch)
);

export { router as uploadRouter };

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { CandidateController } from "./candidate.controller";
import { CandidateService } from "./candidate.service";
import { validate } from "../../core/middlewares/validate.middleware";
import { registerCandidateSchema } from "./candidate.dto";
import { catchAsync } from "../../core/utils/catch-async";
import { BadRequestException } from "../../core/errors/app.error";

const router = Router();
const candidateService = new CandidateService();
const candidateController = new CandidateController(candidateService);

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Multer middleware setup
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new BadRequestException("Only PDF, DOC, or DOCX files are allowed") as any);
    }
  },
});

// Register route
router.post(
  "/register",
  upload.single("resume"),
  validate(registerCandidateSchema),
  catchAsync(candidateController.register),
);

export { router as candidateRouter };

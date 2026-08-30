import { Request, Response } from "express";
import { UploadService } from "./upload.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  uploadSingle = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new BadRequestException("No file provided");
    }

    const url = await this.uploadService.uploadSingle(req.file);
    sendSuccess(res, 200, "File uploaded successfully", { url });
  };

  uploadBatch = async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const urls = await this.uploadService.uploadBatch(files);
    sendSuccess(res, 200, "Files uploaded successfully", { urls });
  };
}

import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../../core/errors/app.error";
import { PassThrough } from "stream";

// Automatically uses CLOUDINARY_URL from env if present
cloudinary.config({
  secure: true,
});

export class UploadService {
  async uploadSingle(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "hrms_documents" },
        (error, result) => {
          if (error) {
            reject(new AppError(500, "File upload to Cloudinary failed"));
          } else {
            resolve(result!.secure_url);
          }
        }
      );
      
      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  async uploadBatch(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadSingle(file));
    return Promise.all(uploadPromises);
  }
}

import { Request, Response } from "express";
import { CandidateService } from "./candidate.service";
import { BadRequestException } from "../../core/errors/app.error";

export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new BadRequestException("Resume file (resume) is required");
    }

    const { email, firstName, lastName, skills } = req.body;

    const candidate = await this.candidateService.register({
      email,
      firstName,
      lastName,
      skills,
      resumeUrl: req.file.filename,
    });

    res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      data: candidate,
    });
  };
}

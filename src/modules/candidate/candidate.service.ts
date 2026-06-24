import prisma from "../../core/config/prisma";
import { ConflictException } from "../../core/errors/app.error";

export interface RegisterCandidateInput {
  email: string;
  firstName: string;
  lastName: string;
  skills?: string;
  resumeUrl?: string;
}

export class CandidateService {
  async register(input: RegisterCandidateInput) {
    const existing = await prisma.candidate.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("Candidate email already registered");
    }

    const candidate = await prisma.candidate.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        candidateProfile: {
          create: {
            resumeUrl: input.resumeUrl,
            skills: input.skills,
          },
        },
      },
      include: {
        candidateProfile: true,
      },
    });

    return candidate;
  }
}

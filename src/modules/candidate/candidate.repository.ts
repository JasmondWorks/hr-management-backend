import { BaseRepository } from "../../core/repositories/base.repository";
import prisma from "../../core/config/prisma";
import type { Candidate } from "../../generated/prisma/client";

export class CandidateRepository extends BaseRepository<Candidate, typeof prisma.candidate> {
  protected readonly useSoftDelete = true;

  constructor() {
    super(prisma.candidate);
  }
}

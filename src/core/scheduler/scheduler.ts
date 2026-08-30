import logger from "../config/logger";
import { AttendanceService } from "../../modules/attendance/attendance.service";
import { InvitationService } from "../../modules/invitation/invitation.service";

const SWEEP_INTERVAL_MS = 60_000; // every minute

const attendanceService = new AttendanceService();
const invitationService = new InvitationService();
let handle: NodeJS.Timeout | null = null;

async function sweep(): Promise<void> {
  try {
    const count = await attendanceService.runAutoCheckout();
    if (count > 0) {
      logger.info(`Auto check-out: closed ${count} attendance record(s)`);
    }
  } catch (err) {
    logger.error(`Auto check-out sweep failed: ${(err as Error).message}`);
  }

  // Bookkeeping only — expired invitations are already refused at use time.
  try {
    const expired = await invitationService.expireStaleInvitations();
    if (expired > 0) {
      logger.info(`Invitations: marked ${expired} as expired`);
    }
  } catch (err) {
    logger.error(`Invitation expiry sweep failed: ${(err as Error).message}`);
  }
}

// Starts the in-process scheduler (no external dependency). Runs a per-minute
// sweep that auto-checks-out employees past their org's configured time.
export function startScheduler(): void {
  if (handle) return;
  handle = setInterval(sweep, SWEEP_INTERVAL_MS);
  handle.unref?.();
  logger.info(
    "Scheduler started (attendance auto check-out, invitation expiry)",
  );
}

export function stopScheduler(): void {
  if (handle) {
    clearInterval(handle);
    handle = null;
  }
}

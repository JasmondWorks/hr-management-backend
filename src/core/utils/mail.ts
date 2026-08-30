import logger from "../config/logger";
import { envConfig } from "../config/env.config";
import { getTransporter, isMailConfigured } from "../config/mailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email, returning whether it went out.
 *
 * This never throws. Delivery is not part of the operation the caller is
 * performing — an invitation that was created but whose email bounced is still a
 * valid invitation the admin can resend, and rolling the write back because the
 * SMTP host was briefly unreachable would be worse than a missing email.
 * Callers that need to react to a failure can check the boolean.
 */
export const sendMail = async ({
  to,
  subject,
  html,
}: SendMailOptions): Promise<boolean> => {
  if (!isMailConfigured()) {
    logger.info(
      `[mail] EMAIL_HOST unset — not sending. to=${to} subject="${subject}"\n${html}`,
    );
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: envConfig.email.from,
      to,
      subject,
      html,
    });
    logger.info(`[mail] sent to=${to} subject="${subject}"`);
    return true;
  } catch (err) {
    logger.error(
      `[mail] failed to=${to} subject="${subject}": ${(err as Error).message}`,
    );
    return false;
  }
};

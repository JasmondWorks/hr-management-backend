import nodemailer, { type Transporter } from "nodemailer";
import { envConfig } from "./env.config";

let transporter: Transporter | null = null;

// True when no SMTP host is configured. In that mode `sendMail` logs the message
// instead of sending it, so local development needs no inbox. `validateEnv`
// already rejects this state in production.
export const isMailConfigured = (): boolean => Boolean(envConfig.email.host);

// Built lazily and reused: nodemailer pools connections per transport, so
// creating one per email would open a new SMTP connection every time.
export const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  const port = Number(envConfig.email.port ?? 587);

  transporter = nodemailer.createTransport({
    host: envConfig.email.host,
    port,
    // Port 465 is implicit TLS; everything else starts plaintext and upgrades
    // via STARTTLS.
    secure: port === 465,
    auth: {
      user: envConfig.email.user,
      pass: envConfig.email.pass,
    },
  });

  return transporter;
};

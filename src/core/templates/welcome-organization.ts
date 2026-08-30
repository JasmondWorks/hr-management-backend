import { emailLayout, emailButton } from "./layout";

export interface WelcomeOrganizationEmailData {
  organizationName: string;
  adminFirstName: string;
  dashboardUrl: string;
}

export const welcomeOrganizationEmail = ({
  organizationName,
  adminFirstName,
  dashboardUrl,
}: WelcomeOrganizationEmailData) => ({
  subject: `${organizationName} is set up on HR Search`,
  html: emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;">Welcome, ${adminFirstName}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      <strong>${organizationName}</strong> is ready. You can now add office branches,
      invite your team, and start posting jobs.
    </p>
    <p style="margin:0 0 8px;">${emailButton(dashboardUrl, "Go to dashboard")}</p>
  `),
});

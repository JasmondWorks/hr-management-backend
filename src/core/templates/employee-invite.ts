import { emailLayout, emailButton } from "./layout";

export interface EmployeeInviteEmailData {
  organizationName: string;
  inviteUrl: string;
  expiresInDays: number;
  departmentName?: string | null;
  designationName?: string | null;
}

export const employeeInviteEmail = ({
  organizationName,
  inviteUrl,
  expiresInDays,
  departmentName,
  designationName,
}: EmployeeInviteEmailData) => {
  const roleLine =
    designationName || departmentName
      ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">You have been invited as <strong>${
          designationName ?? "a team member"
        }</strong>${departmentName ? ` in the <strong>${departmentName}</strong> department` : ""}.</p>`
      : "";

  return {
    subject: `You've been invited to join ${organizationName}`,
    html: emailLayout(`
      <h1 style="margin:0 0 16px;font-size:22px;">Join ${organizationName}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        ${organizationName} has invited you to join their team on HR Search.
      </p>
      ${roleLine}
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        Click below to set your password and complete your profile.
      </p>
      <p style="margin:0 0 24px;">${emailButton(inviteUrl, "Accept invitation")}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#616e7c;">
        This invitation expires in ${expiresInDays} days and can only be used once.
      </p>
      <p style="margin:0;font-size:13px;color:#616e7c;word-break:break-all;">
        If the button does not work, paste this into your browser:<br />${inviteUrl}
      </p>
    `),
  };
};

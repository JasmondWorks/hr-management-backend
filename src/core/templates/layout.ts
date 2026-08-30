// Shared shell for transactional emails. Inline styles only: email clients strip
// <style> blocks and have no support for external stylesheets.
export const emailLayout = (body: string): string => `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr><td>
        ${body}
      </td></tr>
    </table>
    <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#8a94a6;text-align:center;">
      This is an automated message from HR Search. Please do not reply to it.
    </p>
  </body>
</html>`;

export const emailButton = (href: string, label: string): string => `
<a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a>`;

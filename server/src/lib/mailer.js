import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY || "";

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export async function sendPasswordResetEmail({ to, name = "", token }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("brevo_api_key_missing");
  }

  const baseUrl = process.env.RESET_EMAIL_URL || "";
  if (!baseUrl) {
    throw new Error("reset_email_url_missing");
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  const resetUrl = `${baseUrl}${separator}token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

  const htmlContent = `
    <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:24px;color:#111;line-height:1.5">
      <h2 style="margin:0 0 12px">Reset your NestEgg password</h2>
      <p>Hi ${name || "there"}, click the button to reset your password for <b>${to}</b>.</p>
      <p style="text-align:center;margin:20px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
          Reset password
        </a>
      </p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <p style="color:#666;margin-top:24px">— NestEgg</p>
    </div>`;

  const [fromName, fromEmail] = (() => {
    const raw = process.env.RESET_EMAIL_FROM || "";
    const match = raw.match(/^(.*)<\s*([^>]+)\s*>$/);
    if (match) {
      return [match[1].trim() || "NestEgg", match[2].trim()];
    }
    return [raw ? raw.trim() : "NestEgg", raw ? raw.trim() : ""];
  })();

  if (!fromEmail) {
    throw new Error("reset_email_from_missing");
  }

  const payload = {
    sender: { name: fromName || "NestEgg", email: fromEmail },
    to: [{ email: to, name }],
    subject: "Reset your NestEgg password",
    htmlContent,
    textContent: `Reset link: ${resetUrl}`,
  };

  await tranEmailApi.sendTransacEmail(payload);
  console.log("✅ Password reset email sent via Brevo API to:", to);
}

export default sendPasswordResetEmail;

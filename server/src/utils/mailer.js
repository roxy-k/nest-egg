import nodemailer from "nodemailer";

const truthy = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(normalized);
  }
  return false;
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

let cachedTransport;
let cachedState = "pending";

const buildTransport = () => {
  if (cachedState !== "pending") {
    return cachedTransport;
  }

  try {
    if (process.env.SMTP_URL) {
      cachedTransport = nodemailer.createTransport(process.env.SMTP_URL);
      cachedState = cachedTransport ? "ready" : "missing";
      return cachedTransport;
    }

    const host = process.env.SMTP_HOST;
    if (!host) {
      cachedState = "missing";
      cachedTransport = null;
      return cachedTransport;
    }

    const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
    const secure =
      truthy(process.env.SMTP_SECURE) || (!Number.isNaN(port) && port === 465);

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const auth = user ? { user, pass } : undefined;

    cachedTransport = nodemailer.createTransport({
      host,
      port: Number.isNaN(port) ? 587 : port,
      secure,
      auth,
    });
    cachedState = cachedTransport ? "ready" : "missing";
  } catch (err) {
    console.error("Failed to initialize SMTP transport:", err);
    cachedTransport = null;
    cachedState = "error";
  }

  return cachedTransport;
};

export const isResetEmailConfigured = () => {
  if (process.env.NODE_ENV === "test" || truthy(process.env.RESET_EMAIL_DISABLED)) {
    return false;
  }
  if (cachedState === "pending") {
    buildTransport();
  }
  return cachedState === "ready";
};

const buildResetLink = ({ baseUrl, email, token }) => {
  const url = new URL(baseUrl || "http://localhost:5173/reset");
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
};

export const sendPasswordResetEmail = async ({
  to,
  email,
  name = "",
  token,
  baseUrl,
}) => {
  if (!token || !email || !to) {
    return { skipped: true, reason: "missing_parameters" };
  }

  if (process.env.NODE_ENV === "test" || truthy(process.env.RESET_EMAIL_DISABLED)) {
    return { skipped: true, reason: "disabled" };
  }

  const transport = buildTransport();
  if (!transport) {
    console.warn("Password reset email skipped: SMTP transporter is not configured.");
    return { skipped: true, reason: "transport_unavailable" };
  }

  const from = process.env.RESET_EMAIL_FROM || process.env.SMTP_USER;
  if (!from) {
    console.warn("Password reset email skipped: RESET_EMAIL_FROM/SMTP_USER not set.");
    return { skipped: true, reason: "from_missing" };
  }

  const subject = process.env.RESET_EMAIL_SUBJECT || "Reset your NestEgg password";
  const resetUrl = buildResetLink({ baseUrl, email, token });

  const friendlyName = name ? escapeHtml(name) : "";
  const greeting = friendlyName ? `Hi ${friendlyName},` : "Hi,";

  const text = [
    greeting,
    "",
    "We received a request to reset your NestEgg password.",
    "If you made this request, click the link below to choose a new password:",
    resetUrl,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "This link will expire shortly for your security.",
    "",
    "— The NestEgg Team",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>We received a request to reset your NestEgg password.</p>
    <p>If you made this request, click the button below to choose a new password:</p>
    <p>
      <a
        href="${resetUrl}"
        style="display:inline-block;padding:10px 16px;background-color:#0d6efd;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;"
      >
        Reset password
      </a>
    </p>
    <p>Or copy and paste this link into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    <p style="margin-top:24px;">This link will expire shortly for your security.</p>
    <p>— The NestEgg Team</p>
  `;

  try {
    await transport.sendMail({
      to,
      from,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("Unable to send password reset email:", err);
    return { skipped: true, reason: "send_failed", error: err };
  }
};

export default sendPasswordResetEmail;

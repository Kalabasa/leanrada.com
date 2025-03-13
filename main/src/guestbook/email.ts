import { EmailMessage } from "cloudflare:email";
import { Env } from "./worker";

export async function sendNotificationEmail(
  env: Env,
  data: {
    subject: string;
    body: string;
  }
) {
  const from = "notify@leanrada.com";
  const to = "notify-xfscgrxn@leanrada.com";
  const email = generateMimeEmail({
    ...data,
    from,
    to,
  });
  try {
    await env.notify.send(new EmailMessage(from, to, email));
  } catch (e) {
    console.error("Notification email not sent!");
  }
}

function generateMimeEmail(data: {
  from: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const date = new Date().toUTCString();

  return `Date: ${date}
From: ${data.from}
To: ${data.to}
Subject: ${data.subject}
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"

${data.body}`.trim();
}

export function generateMimeEmail(data: {
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

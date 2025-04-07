import { SubmitRequest } from "./worker";

export function checkSpam(submitRequest: SubmitRequest): {
  isSpam: boolean;
  reason: string;
} {
  if (checkHoneypot(submitRequest)) {
    return {
      isSpam: true,
      reason: "honeypot",
    };
  }

  if (checkTimeSpent(submitRequest)) {
    return { isSpam: true, reason: "time spent" };
  }

  const spamText = findSpamText(submitRequest.text);
  if (spamText) {
    return {
      isSpam: true,
      reason: `text''${spamText}''`,
    };
  }

  return {
    isSpam: false,
    reason: "",
  };
}

function checkHoneypot(request: SubmitRequest): boolean {
  return !!request.website && request.website.trim().length > 0;
}

function checkTimeSpent(request: SubmitRequest): boolean {
  if (!request.timeSpentMs) return true;
  const timeSpentMsNum = Number(request.timeSpentMs);
  return isNaN(timeSpentMsNum) || timeSpentMsNum < 3000;
}

function findSpamText(text: string): string | null {
  const aHref = text.match(/<a\s+href/i);
  if (aHref) return aHref[0];

  // The new grift
  const gptDotCom = text.match(/gpt\w+\.com/i);
  if (gptDotCom) return gptDotCom.join(",");

  // Too many links!
  const urls = text.match(/https?:\/\//gi);
  if (urls && urls.length - 1 >= 2) return urls.join(",");

  return null;
}

#!/usr/bin/env node
const GUESTBOOK_API =
  process.env.GUESTBOOK_API ?? "https://guestbook.leanrada.com/api";

export async function fetchGuestbookData(page) {
  console.log("Loading guestbook page", page);
  const response = await fetch(GUESTBOOK_API + "?page=" + page);
  if (!response.ok) throw new Error();
  const data = await response.json();
  if (!data || data.length === 0) return undefined;
  return data;
}

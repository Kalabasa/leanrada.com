export async function fetchStackOverflowReputation() {
  console.log("Fetching reputation...");
  const res = await fetch("https://stackoverflow.com/users/flair/3144156.json");
  const data = await res.json();
  console.log("Reputation:", data.reputation);
  return data.reputation;
}

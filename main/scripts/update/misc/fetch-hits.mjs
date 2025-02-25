export async function fetchHits() {
  console.log("Fetching hits...");
  const res = await fetch(
    "https://kalabasa.goatcounter.com/counter/TOTAL.json"
  );
  const data = await res.json();
  console.log("Hits:", data.count);
  return parseInt(data.count.replaceAll(/\D/g, ""));
}

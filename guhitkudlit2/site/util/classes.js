export function classes(...array) {
  return array.filter((item) => item && typeof item === "string").join(" ");
}

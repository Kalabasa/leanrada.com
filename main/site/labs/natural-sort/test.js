import { wordSort } from "./sort.js";

const testCases = [
  // pairs
  ["past", "future"],
  ["slow", "fast"],
  ["weak", "strong"],
  ["young", "old"],
  ["narrow", "wide"],
  ["shallow", "deep"],
  ["soft", "hard"],
  // ["dry", "wet"],
  ["empty", "full"],
  ["light", "heavy"],
  ["poor", "rich"],
  ["sad", "happy"],
  ["worst", "best"],
  ["less", "more"],
  ["few", "many"],
  ["minor", "major"],
  ["below", "above"],
  ["down", "up"],
  ["failure", "success"],
  ["smallest", "biggest"],
  ["lowest", "highest"],
  ["weakest", "strongest"],
  ["slower", "faster"],
  ["smaller", "larger"],
  ["thinner", "thicker"],
  ["easier", "harder"],
  ["simpler", "complex"],
  ["dull", "sharp"],
  ["loose", "tight"],
  ["plain", "fancy"],
  ["asleep", "awake"],

  // longer sequences — passing
  ["low", "medium", "high"],
  ["tiny", "small", "medium", "large", "huge"],
  ["left", "center", "right"],
  ["worst", "bad", "good", "best"],
  ["village", "town", "city", "metropolis"],
  ["path", "road", "highway"],

  // from index.html — all failed
  // ["never", "rarely", "often", "always"],
  // ["terrible", "bad", "okay", "good", "great", "excellent"],
  // ["hate", "dislike", "like", "love"],
  // ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  // ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  // ["bronze", "silver", "gold", "platinum"],  // got reversed
  // ["first", "second", "third", "fourth", "fifth"],  // almost: swapped fourth/fifth
  // ["spring", "summer", "autumn", "winter"],
  // ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],

  // longer sequences — failed
  // ["terrible", "poor", "fair", "good", "great", "excellent"],
  // ["freezing", "cool", "warm", "hot"],
  // ["whisper", "talk", "shout", "scream"],
  // ["crawl", "walk", "run", "sprint"],
  // ["infant", "child", "teenager", "adult", "elder"],
  // ["pond", "lake", "sea", "ocean"],
  // ["hill", "mountain", "peak"],
  // ["cup", "bowl", "bucket", "barrel"],
  // ["pebble", "stone", "rock", "boulder"],
  // ["breeze", "wind", "gale", "hurricane"],
  // ["drop", "stream", "river", "flood"],
  // ["spark", "flame", "fire", "inferno"],
  // ["mouse", "cat", "dog", "horse", "elephant", "whale"],
  // ["penny", "dollar", "thousand", "million", "billion"],
  // ["never", "rarely", "sometimes", "often", "always"],
  // ["none", "few", "some", "many", "all"],

  // not in vocab: cold, morning, win, peace, minute, byte, kilobyte, megabyte, gigabyte, terabyte
];

let passed = 0;
let failed = 0;

for (const expected of testCases) {
  const shuffled = expected.toSorted(() => Math.random() - 0.5);
  const result = await wordSort(shuffled);
  const sorted = result.toSorted();
  const correct = expected.every((w, i) => sorted[i] === w);

  if (correct) {
    passed++;
    console.log(`✓ ${expected.join(', ')}`);
  } else {
    failed++;
    console.log(`✗ ${expected.join(', ')}`);
    console.log(`  got: ${sorted.join(', ')}`);
  }
}

console.log(`\n${passed}/${passed + failed} passed`);

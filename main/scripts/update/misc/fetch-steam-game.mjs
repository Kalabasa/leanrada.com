import * as cheerio from "cheerio";

export async function fetchSteamGame() {
  console.log("Fetching Steam game...");
  const res = await fetch("https://steamcommunity.com/id/kalabasa25/?xml=1");
  const xml = await res.text();

  const ch = cheerio.load(xml, { xmlMode: true });
  const games = ch("mostPlayedGames > mostPlayedGame")
    .map((_, el) => {
      const chGame = ch(el);
      return {
        name: chGame.find("gameName").text(),
        imgSrc: chGame.find("gameLogoSmall").text(),
        hoursPlayed: parseFloat(chGame.find("hoursPlayed").text()),
      };
    })
    .get();
  if (!games.length) throw new Error("Can't find mostPlayedGame.");

  let topGame = games[0];
  for (const game of games) {
    if (game.hoursPlayed > topGame.hoursPlayed) topGame = game;
  }

  return {
    name: topGame.name,
    imgSrc: topGame.imgSrc,
    lastUpdated: Date.now(),
  };
}

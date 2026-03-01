const { Innertube } = require("youtubei.js");

async function main() {
  const yt = await Innertube.create();
  try {
    const results = await yt.music.search("Spotify Top 50 Global", {
      type: "playlist",
    });
    console.log("Playlists:");
    if (
      results.contents &&
      results.contents[0] &&
      results.contents[0].contents
    ) {
      const firstPlaylist = results.contents[0].contents[0];
      console.log("Found playlist:", firstPlaylist.title, firstPlaylist.id);

      const playlistDetails = await yt.music.getPlaylist(firstPlaylist.id);
      console.dir(playlistDetails.items[0], { depth: 2 });
    }
  } catch (e) {
    console.error("error:", e);
  }
}
main();

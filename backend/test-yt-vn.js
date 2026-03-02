const { Innertube } = require('youtubei.js');

async function main() {
  const yt = await Innertube.create({gl: 'VN', hl: 'vi'});
  try {
    const results = await yt.music.search('Top 100 Songs Vietnam', { type: 'playlist' });
    console.log("Playlists:");
    if (results.contents && results.contents[0] && results.contents[0].contents) {
       const firstPlaylist = results.contents[0].contents[0];
       console.log("Found playlist:", firstPlaylist.title, firstPlaylist.id);
       
       const playlistDetails = await yt.music.getPlaylist(firstPlaylist.id);
       console.log("Tracks:", playlistDetails.items?.slice(0, 5).map(i => i.title));
    }
  } catch (e) {
    console.error("error:", e);
  }
}
main();

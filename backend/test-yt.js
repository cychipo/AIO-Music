const { Innertube } = require('youtubei.js');

async function main() {
  const yt = await Innertube.create();
  try {
    const trending = await yt.music.getExplore();
    const ts = trending.top_songs;
    console.log(ts?.items?.slice(0, 2));

    const yTrending = await yt.getTrending();
    console.log("Trend categories: ", yTrending.categories?.map(c => c.title.text));
  } catch (e) {
    console.error("error getting trending:", e);
  }
}
main();

const { Innertube } = require("youtubei.js");

async function main() {
  const yt = await Innertube.create();
  try {
    const explore = await yt.music.getExplore();
    console.log("Explore top songs:", explore.top_songs?.items?.slice(0, 1));
    console.log("Explore trending:", explore.trending?.items?.slice(0, 1));
    console.log(
      "Explore new releases:",
      explore.new_releases?.items?.slice(0, 1),
    );
    const charts = await yt.music.getCharts();
    console.log(charts.countries?.slice(0, 2));
    console.dir(charts.sections, { depth: 3 });
  } catch (e) {
    console.error("error getting explore:", e);
  }
}
main();

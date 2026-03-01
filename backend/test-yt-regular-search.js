const { Innertube } = require("youtubei.js");

async function main() {
  const yt = await Innertube.create();
  try {
    const results = await yt.search("trending pop music 2025", {
      type: "video",
    });
    console.log("has videos?", !!results.videos);
    if (results.videos) {
      console.log("first video:", results.videos[0].title);
      console.log("duration:", results.videos[0].duration);
      console.log("view_count:", results.videos[0].view_count);
      console.log("author:", results.videos[0].author);
    }
  } catch (e) {
    console.error("error:", e);
  }
}
main();

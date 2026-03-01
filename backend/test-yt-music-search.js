const { Innertube } = require("youtubei.js");

async function main() {
  const yt = await Innertube.create();
  try {
    const results = await yt.music.search("trending pop music 2025", {
      type: "song",
    });
    console.log(
      "Songs:",
      results.contents?.slice(0, 3).map((s) => s.name),
    );
    if (
      results.contents &&
      results.contents[0] &&
      results.contents[0].contents
    ) {
      results.contents[0].contents.slice(0, 3).forEach((c) => {
        console.log(
          c.title,
          c.artists?.map((a) => a.name).join(", "),
          c.id,
          c.duration?.seconds,
          c.thumbnail?.contents?.[0]?.url,
        );
      });
    }
  } catch (e) {
    console.error("error:", e);
  }
}
main();

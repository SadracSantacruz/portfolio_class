let data = [];
let commits = [];

async function loadData() {
  data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: +row.line, // Shorter way to convert to number
    depth: +row.depth,
    length: +row.length,
    date: row.date
      ? new Date(row.date + "T00:00" + (row.timezone || "Z"))
      : null,
    datetime: row.datetime ? new Date(row.datetime) : null,
  }));
}

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      if (!lines.length) return null; // Skip empty commits

      let first = lines[0]; // Get the first line entry for commit metadata
      if (!first) return null; // Skip if no lines
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: "https://github.com/YOUR_REPO/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime
          ? datetime.getHours() + datetime.getMinutes() / 60
          : null,
        totalLines: lines.length,
      };

      // Hide the original lines array from console output
      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false, // Don't show it when printing
        configurable: false,
        writable: false,
      });

      return ret;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData(); // Load CSV data
  processCommits(); // Process commits
  console.log(commits); // Check processed commit data
});

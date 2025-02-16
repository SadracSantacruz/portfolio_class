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

function displayStats() {
  console.log("✅ displayStats() is running...");

  // Process commits to get stats
  processCommits();

  // Create a dl element to display stats
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  // Add the total LOC
  dl.append("dt").html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append("dd").text(data.length);

  // Add the total commits
  dl.append("dt").text("Total commits");
  dl.append("dd").text(commits.length);

  // 1 Number of distinct files
  const numFiles = d3.groups(data, (d) => d.file).length;
  dl.append("dt").text("Number of distinct files");
  dl.append("dd").text(numFiles);

  // 2️ Maximum file length (in lines)
  const maxFileLength = d3.max(data, (d) => d.line);
  dl.append("dt").text("Maximum file length (lines)");
  dl.append("dd").text(maxFileLength);

  // 3️ Average file length (in lines)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append("dt").text("Average file length (lines)");
  dl.append("dd").text(avgFileLength.toFixed(2));

  // 4 Most active time of day
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString("en", { dayPeriod: "short" })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0]; // Most frequent period
  dl.append("dt").text("Most active time of day");
  dl.append("dd").text(maxPeriod);

  console.log("✅ Stats should now be displayed.");
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM Loaded. Now loading data...");
  await loadData(); // Load CSV data
  console.log("✅ Data loaded:", data.length, "rows.");

  processCommits(); // Process commits
  displayStats();
});

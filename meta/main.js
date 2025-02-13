let data = [];
let commits = d3.groups(data, (d) => d.commit);

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

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  console.log(data); // Check if data loads correctly
});

console.log(commits);

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

  // Ensure the stats container exists and is styled
  const statsContainer = d3
    .select("#stats") // Keeping `stats` ID
    .append("div")
    .attr("class", "stats"); // Apply new styling

  // Function to append styled stat blocks
  function addStat(label, value) {
    const statBlock = statsContainer.append("div").attr("class", "stat-block");

    statBlock.append("dt").html(label);
    statBlock.append("dd").text(value);
  }

  // Add stats
  addStat('Total <abbr title="Lines of Code">LOC</abbr>', data.length);
  addStat("Total commits", commits.length);

  // 1️⃣ Number of distinct files
  const numFiles = d3.groups(data, (d) => d.file).length;
  addStat("Number of distinct files", numFiles);

  // 2️⃣ Maximum file length (in lines)
  const maxFileLength = d3.max(data, (d) => d.line);
  addStat("Maximum file length (lines)", maxFileLength);

  // 3️⃣ Average file length (in lines)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  addStat("Average file length (lines)", avgFileLength.toFixed(2));

  // 4️⃣ Most active time of day
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString("en", { dayPeriod: "short" })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0]; // Most frequent period
  addStat("Most active time of day", maxPeriod);

  console.log("✅ Stats should now be displayed.");
}

function createScatterplot() {
  console.log("✅ Creating Scatterplot...");

  // Set up SVG dimensions
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 50, left: 50 }; // Increased bottom margin

  // Compute usable area
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  d3.select("#chart").selectAll("*").remove(); // Clear previous SVG if it exists

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // 🎨 **Add Background to Scatterplot**
  svg
    .append("rect")
    .attr("x", usableArea.left)
    .attr("y", usableArea.top)
    .attr("width", usableArea.width)
    .attr("height", usableArea.height)
    .attr("fill", "var(--chart-bg)") // Dynamic background color
    .attr("rx", 10); // Rounded corners for smooth aesthetics

  // Define Scales with margins
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right]) // Adjusted for margins
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]); // Adjusted for margins

  // **Add Gridlines BEFORE axes**
  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);
  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  // 🎯 **Draw Dots with Higher Contrast**
  // 🎯 **Draw Dots with Hover Events**
  svg
    .append("g")
    .attr("class", "dots")
    .selectAll("circle")
    .data(commits)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", 6) // Slightly larger for visibility
    .attr("fill", "var(--dot-color)") // Dynamic dot color
    .attr("stroke", "var(--dot-outline)") // Dynamic outline
    .attr("stroke-width", 1)
    .on("mouseenter", function (event, commit) {
      updateTooltipContent(commit);
      d3.select("#commit-tooltip")
        .style("opacity", "1")
        .style("top", `${event.pageY - 30}px`)
        .style("left", `${event.pageX + 15}px`);
    })
    .on("mousemove", function (event) {
      d3.select("#commit-tooltip")
        .style("top", `${event.pageY - 30}px`)
        .style("left", `${event.pageX + 15}px`);
    })
    .on("mouseleave", function () {
      updateTooltipContent({}); // Clear tooltip content
      d3.select("#commit-tooltip").style("opacity", "0");
    });

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00"); // Format Y axis

  // **Add X Axis**
  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis)
    .attr("color", "var(--axis-text)");

  // **Add Y Axis**
  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis)
    .attr("color", "var(--axis-text)");

  // **Fix X-Axis Label Position**
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 15) // Moved lower for visibility
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("fill", "var(--axis-text)") // Dynamically change text color
    .text("Date");

  // **Fix Y-Axis Label Position**
  svg
    .append("text")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("fill", "var(--axis-text)") // Dynamically change text color
    .text("Time of Day");

  console.log("✅ Scatterplot rendered.");
}

function updateTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("commit-time");
  const author = document.getElementById("commit-author");
  const lines = document.getElementById("commit-lines");

  if (!commit || Object.keys(commit).length === 0) {
    document.getElementById("commit-tooltip").style.opacity = "0"; // Hide tooltip
    return;
  }

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleDateString("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  time.textContent = commit.datetime?.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;

  document.getElementById("commit-tooltip").style.opacity = "1"; // Show tooltip
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData(); // Load CSV data
  processCommits(); // Process commits
  displayStats();

  if (commits.length > 0) {
    createScatterplot(); // Create scatterplot if commits exist
  } else {
    console.warn("⚠️ No commits found. Cannot create scatterplot.");
  }
});

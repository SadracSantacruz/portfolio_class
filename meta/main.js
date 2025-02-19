let data = [];
let commits = [];
let brushSelection = null;
let xScale, yScale;

async function loadData() {
  data = await d3.csv("./loc.csv", (row) => ({
    ...row,
    line: +row.line,
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
      if (!lines.length) return null;

      let first = lines[0];
      if (!first) return null;
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: `https://github.com/YOUR_REPO/commit/${commit}`,
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

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false,
        configurable: false,
        writable: false,
      });

      return ret;
    });
}

function updateSelectionDetails(selectedCommits) {
  const container = document.getElementById("selection-details");
  if (!container) {
    console.warn("⚠️ No selection-details container found in the HTML.");
    return;
  }

  // Clear previous selection details
  container.innerHTML = "";

  if (selectedCommits.length === 0) {
    container.innerHTML = "<p>No commits selected</p>";
    return;
  }

  // Create a horizontal container for selected commits
  const rowContainer = document.createElement("div");
  rowContainer.classList.add("commit-row");

  selectedCommits.forEach((commit) => {
    const commitCard = document.createElement("div");
    commitCard.classList.add("commit-card");

    commitCard.innerHTML = `
      <div class="commit-header">
        <strong>Commit:</strong> <a href="${commit.url}" target="_blank">${
      commit.id
    }</a>
      </div>
      <div><strong>Date:</strong> ${commit.datetime.toLocaleDateString()}</div>
      <div><strong>Time:</strong> ${commit.datetime.toLocaleTimeString()}</div>
      <div><strong>Author:</strong> ${commit.author}</div>
      <div><strong>Lines Edited:</strong> ${commit.totalLines}</div>
    `;

    rowContainer.appendChild(commitCard);
  });

  container.appendChild(rowContainer);
}

function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById("selection-count");
  countElement.textContent = `${
    selectedCommits.length || "No"
  } commits selected`;

  // Display commit details in the log
  console.log("Selected Commits:", selectedCommits);

  // Update the selection details UI
  updateSelectionDetails(selectedCommits);

  return selectedCommits;
}

function displayStats() {
  console.log("✅ displayStats() is running...");
  processCommits();

  const statsContainer = d3
    .select("#stats")
    .append("div")
    .attr("class", "stats");

  function addStat(label, value) {
    const statBlock = statsContainer.append("div").attr("class", "stat-block");
    statBlock.append("dt").html(label);
    statBlock.append("dd").text(value);
  }

  addStat('Total <abbr title="Lines of Code">LOC</abbr>', data.length);
  addStat("Total commits", commits.length);
  addStat("Number of distinct files", d3.groups(data, (d) => d.file).length);
  addStat(
    "Maximum file length (in lines)",
    d3.max(data, (d) => d.line)
  );
  addStat(
    "Average file length (lines)",
    d3
      .mean(
        d3.rollups(
          data,
          (v) => d3.max(v, (d) => d.line),
          (d) => d.file
        ),
        (d) => d[1]
      )
      .toFixed(2)
  );

  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString("en", { dayPeriod: "short" })
  );
  addStat(
    "Most active time of day",
    d3.greatest(workByPeriod, (d) => d[1])?.[0]
  );
}

function brushed(event) {
  if (!event.selection) {
    brushSelection = null;
    updateSelection();
    updateSelectionCount();
    return;
  }

  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount(); // 🔹 Ensure this updates!
}

function isCommitSelected(commit) {
  if (!brushSelection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] = brushSelection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll(".dots circle").classed("selected", (d) => isCommitSelected(d));
}
function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById("language-breakdown");

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = "";

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1~%")(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

function createScatterplot() {
  console.log("✅ Creating Scatterplot...");

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 50, left: 50 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  d3.select("#chart").selectAll("*").remove();

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  svg
    .append("rect")
    .attr("x", usableArea.left)
    .attr("y", usableArea.top)
    .attr("width", usableArea.width)
    .attr("height", usableArea.height)
    .attr("fill", "var(--chart-bg)")
    .attr("rx", 10);

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // **Fixing Area Perception: Square Root Scale**
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt() // ✅ Switched from linear to square root scale
    .domain([minLines, maxLines])
    .range([2, 30]); // Adjusted for better perception

  svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));

  // Sort before binding data
  const sortedCommits = commits
    .slice()
    .sort((a, b) => b.totalLines - a.totalLines);

  // Draw Dots with Scaled Size & Hover Effects
  svg
    .append("g")
    .attr("class", "dots")
    .selectAll("circle")
    .data(sortedCommits) // ✅ Use sorted data
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines)) // Corrected dot size perception
    .attr("fill", "var(--dot-color)")
    .attr("stroke", "var(--dot-outline)")
    .attr("stroke-width", 1)
    .style("fill-opacity", 0.7)
    .on("mouseenter", function (event, commit) {
      d3.select(this).style("fill-opacity", 1); // Highlight on hover
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove", updateTooltipPosition)
    .on("mouseleave", function () {
      d3.select(this).style("fill-opacity", 0.7); // Restore transparency
      updateTooltipVisibility(false);
    });

  const brush = d3
    .brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom],
    ])
    .on("brush end", brushed);

  const brushGroup = svg.append("g").attr("class", "brush").call(brush);
  brushGroup.raise(); // 🔹 Ensures brush is on top

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("fill", "var(--axis-text)")
    .text("Date");

  svg
    .append("text")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("fill", "var(--axis-text)")
    .text("Time of Day");

  console.log("✅ Scatterplot rendered.");
}
function updateTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("commit-time");
  const author = document.getElementById("commit-author");
  const linesEdited = document.getElementById("commit-lines");

  if (!commit || Object.keys(commit).length === 0) {
    updateTooltipVisibility(false);
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
  time.textContent = commit.time || "N/A";
  author.textContent = commit.author || "Unknown";
  linesEdited.textContent = commit.totalLines || "0";

  updateTooltipVisibility(true);
  brushSelector();
}

function updateTooltipVisibility(visible) {
  document.getElementById("commit-tooltip").style.opacity = visible ? "1" : "0";
}

function brushSelector() {
  const svg = document.querySelector("svg");
  d3.select(svg).call(d3.brush());
}

function updateTooltipPosition(event) {
  d3.select("#commit-tooltip")
    .style("top", `${event.pageY - 30}px`)
    .style("left", `${event.pageX + 15}px`);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  processCommits();
  displayStats();

  if (commits.length > 0) {
    createScatterplot();
  } else {
    console.warn("⚠️ No commits found. Cannot create scatterplot.");
  }
});

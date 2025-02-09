import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

// Projects Rendering
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const projects = await fetchJSON("../lib/projects.json");
    const projectsContainer = document.querySelector(".projects");
    const projectsTitle = document.querySelector(".projects-title");

    if (projects && projects.length > 0) {
      // Render the projects
      renderProjects(projects, projectsContainer, "h2");

      // Update the projects count in the title
      projectsTitle.textContent = `(${projects.length}) Projects`;

      // Generate Pie Chart with the projects
      generatePieChart(projects);
    } else {
      projectsContainer.innerHTML = "<p>No projects found.</p>";
      projectsTitle.textContent = " (0) Projects";
    }
  } catch (error) {
    console.error("Error loading projects:", error);
    const projectsContainer = document.querySelector(".projects");
    const projectsTitle = document.querySelector(".projects-title");

    projectsContainer.innerHTML =
      "<p>Failed to load projects. Please try again later.</p>";
    projectsTitle.textContent = "(0) Projects";
  }
});

// D3 Pie Chart
function generatePieChart(projects) {
  // Group and aggregate data by year
  let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Create a pie slice generator
  let sliceGenerator = d3.pie().value((d) => d.value);

  // Generate arc data using the slice generator
  let arcData = sliceGenerator(data);

  // Define an arc generator
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(100);

  // Select SVG and legend
  let svg = d3
    .select("svg")
    .attr("viewBox", "0 0 300 300")
    .append("g")
    .attr("transform", "translate(150, 150)");

  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  let legend = d3.select(".legend");

  // Draw pie slices
  svg
    .selectAll("path")
    .data(arcData)
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .attr("fill", (_, idx) => colors(idx))
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // Populate legend
  data.forEach((d, idx) => {
    legend
      .append("li")
      .attr("style", `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

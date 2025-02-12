import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

let projects = []; // Declare projects in a higher scope
let query = ""; // Declare query in a higher scope
let selectedIndex = -1; // No selection initially

function renderPieChart(projectsGiven) {
  // Clear SVG and legend to avoid duplicates
  d3.select("svg").selectAll("*").remove();
  d3.select(".legend").selectAll("*").remove();

  // Recalculate data
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year,
  }));

  // Create pie slice generator
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);

  // Define arc generator
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(150);

  // Colors
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Select SVG and create group
  const svg = d3
    .select("svg")
    .attr("viewBox", "0 0 400 400")
    .append("g")
    .attr("transform", "translate(200, 200)");

  // Draw pie slices with hover and click functionality
  svg
    .selectAll("path")
    .data(arcData)
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .attr("fill", (_, idx) => colors(idx))
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("class", (_, idx) => (idx === selectedIndex ? "selected" : ""))
    .on("mouseover", function (_, idx) {
      // Highlight the hovered slice
      svg.selectAll("path").style("opacity", 0.5);
      d3.select(this).style("opacity", 1);
    })
    .on("mouseout", function () {
      // Reset opacity for all slices
      svg.selectAll("path").style("opacity", 1);
    })
    .on("click", function (event, d) {
      const selectedYear = d.data.label; // Get the year for the clicked slice
      if (selectedYear) {
        const yearFilteredProjects = projects.filter(
          (project) => project.year === selectedYear
        );

        // Re-render the filtered projects
        const projectsContainer = document.querySelector(".projects");
        renderProjects(yearFilteredProjects, projectsContainer, "h2");

        // Update the projects count
        const projectsTitle = document.querySelector(".projects-title");
        projectsTitle.textContent = `(${yearFilteredProjects.length}) Projects`;

        // Re-render the chart with filtered projects
        renderPieChart(yearFilteredProjects);
      } else {
        // If no slice is selected, reset to show all projects
        const projectsContainer = document.querySelector(".projects");
        renderProjects(projects, projectsContainer, "h2");

        // Update the projects count
        const projectsTitle = document.querySelector(".projects-title");
        projectsTitle.textContent = `(${projects.length}) Projects`;

        // Re-render the chart with all projects
        renderPieChart(projects);
      }
    });

  // Populate legend with selection support
  const legend = d3.select(".legend");
  data.forEach((d, idx) => {
    legend
      .append("li")
      .attr("style", `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)

      .on("click", () => {
        selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selection

        if (selectedIndex !== -1) {
          const selectedYear = data[selectedIndex].label; // Get the year for the clicked slice
          const yearFilteredProjects = projects.filter(
            (project) => project.year === selectedYear
          ); // Filter projects based on the selected year

          // Re-render the filtered projects
          const projectsContainer = document.querySelector(".projects");
          renderProjects(yearFilteredProjects, projectsContainer, "h2");

          // Update the projects count
          const projectsTitle = document.querySelector(".projects-title");
          projectsTitle.textContent = `(${yearFilteredProjects.length}) Projects`;

          // Re-render the chart with filtered projects
          renderPieChart(yearFilteredProjects);
        } else {
          // If no slice is selected, reset to show all projects
          const projectsContainer = document.querySelector(".projects");
          renderProjects(projects, projectsContainer, "h2");

          // Update the projects count
          const projectsTitle = document.querySelector(".projects-title");
          projectsTitle.textContent = `(${projects.length}) Projects`;

          // Re-render the chart with all projects
          renderPieChart(projects);
        }
      });
  });
}

// Projects Rendering
document.addEventListener("DOMContentLoaded", async () => {
  try {
    projects = await fetchJSON("../lib/projects.json"); // Assign fetched projects to global scope
    const projectsContainer = document.querySelector(".projects");
    const projectsTitle = document.querySelector(".projects-title");

    if (projects && projects.length > 0) {
      // Render the projects
      renderProjects(projects, projectsContainer, "h2");

      // Update the projects count in the title
      projectsTitle.textContent = `(${projects.length}) Projects`;

      // Render Pie Chart with the projects
      renderPieChart(projects);
    } else {
      projectsContainer.innerHTML = "<p>No projects found.</p>";
      projectsTitle.textContent = "(0) Projects";
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

// Search Functionality
let searchInput = document.querySelector(".searchBar");

searchInput.addEventListener("input", (event) => {
  query = event.target.value.toLowerCase(); // Update query
  const filteredProjects = projects.filter((project) => {
    const values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query);
  }); // Filter projects

  // Re-render the filtered projects
  const projectsContainer = document.querySelector(".projects");
  renderProjects(filteredProjects, projectsContainer, "h2");

  // Update the projects count
  const projectsTitle = document.querySelector(".projects-title");
  projectsTitle.textContent = `(${filteredProjects.length}) Projects`;

  // Re-render the pie chart
  renderPieChart(filteredProjects);
});

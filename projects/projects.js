import { fetchJSON, renderProjects } from "../global.js";

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

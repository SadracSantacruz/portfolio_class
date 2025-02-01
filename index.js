import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const projects = await fetchJSON("./lib/projects.json");
    const latestProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector(".projects");

    if (projectsContainer && latestProjects.length > 0) {
      renderProjects(latestProjects, projectsContainer, "h2");
    } else {
      projectsContainer.innerHTML = "<p>No projects found.</p>";
    }

    const githubData = await fetchGitHubData("SadracSantacruz");

    const githubContainer = document.querySelector(".github-stats");
    if (githubContainer) {
      githubContainer.innerHTML = `
    <div class="github-stats-container">
      <div class="github-stat">
        <p>FOLLOWERS</p>
        <h3>${githubData.followers}</h3>
      </div>
      <div class="github-stat">
        <p>FOLLOWING</p>
        <h3>${githubData.following}</h3>
      </div>
      <div class="github-stat">
        <p>PUBLIC REPOS</p>
        <h3>${githubData.public_repos}</h3>
      </div>
      <div class="github-stat">
        <p>PUBLIC GISTS</p>
        <h3>${githubData.public_gists || 0}</h3>
      </div>
    </div>
  `;
    }
  } catch (error) {
    console.error("Error loading data:", error);

    /** Handle Project Loading Errors */
    const projectsContainer = document.querySelector(".projects");
    if (projectsContainer) {
      projectsContainer.innerHTML =
        "<p>Failed to load projects. Please try again later.</p>";
    }

    /** Handle GitHub API Errors */
    const githubContainer = document.querySelector(".github-stats");
    if (githubContainer) {
      githubContainer.innerHTML =
        "<p>Failed to load GitHub data. Please try again later.</p>";
    }
  }
});

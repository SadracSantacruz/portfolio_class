console.log("IT’S ALIVE!");

const ARE_WE_HOME = document.documentElement.classList.contains("home");

// Links to all the pages
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/", title: "Resume" },
  { url: "contact/", title: "Contact" },
  { url: "https://github.com/SadracSantacruz", title: "GitHub" },
];

const nav = document.createElement("nav");
document.body.prepend(nav);

for (let page of pages) {
  let url = page.url;
  let title = page.title;

  url = !ARE_WE_HOME && !url.startsWith("http") ? "../" + url : url;

  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
    <label class="color-scheme">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `
);

const select = document.getElementById("theme-select");
const root = document.documentElement;

const savedTheme = localStorage.getItem("colorScheme") || "light dark";
root.style.setProperty("color-scheme", savedTheme);
select.value = savedTheme;

select.addEventListener("input", (event) => {
  const selectedTheme = event.target.value;

  root.style.setProperty("color-scheme", selectedTheme);

  localStorage.setItem("colorScheme", selectedTheme);

  console.log("Color scheme changed to:", selectedTheme);
});

// Contact form
const form = document.getElementById("contact-form");

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);

  let url = form.action + "?";

  for (let [name, value] of data) {
    url += `${encodeURIComponent(name)}=${encodeURIComponent(value)}&`;
  }

  url = url.slice(0, -1);
  location.href = url;

  console.log("Form submitted to:", url);
});

// Setting up my circle background

// shape generator
function generateShapeConfig(numShapes, baseColor) {
  const configs = [];
  for (let i = 0; i < numShapes; i++) {
    configs.push({
      class: `shape${i + 1}`,
      size: Math.random() * 150 + 100,
      top: `${Math.random() * 80}%`,
      left: `${Math.random() * 80}%`,
      gradient: generateGradientColor(baseColor, 40 + i * 10),
    });
  }
  return configs;
}

function generateGradientColor(baseColor, intensity) {
  const lightness = Math.min(Math.max(intensity, 30), 90); // Clamp lightness
  return `linear-gradient(to bottom right, ${baseColor}, hsl(147, 50%, ${lightness}%))`;
}

function createBackgroundShapes(numShapes = 5) {
  const baseColor = "hsl(147, 50%, 50%)";
  const shapeConfigs = generateShapeConfig(numShapes, baseColor);

  const backgroundContainer = document.createElement("div");
  backgroundContainer.className = "background-shapes";

  shapeConfigs.forEach((shapeConfig) => {
    const div = document.createElement("div");
    div.className = `shape ${shapeConfig.class}`;
    div.style.width = `${shapeConfig.size}px`;
    div.style.height = `${shapeConfig.size}px`;
    div.style.top = shapeConfig.top;
    div.style.left = shapeConfig.left;
    div.style.background = shapeConfig.gradient;

    backgroundContainer.appendChild(div);
  });

  document.body.appendChild(backgroundContainer);
}

function moveShapes() {
  const shapes = document.querySelectorAll(".shape");
  const scrollY = window.scrollY;

  shapes.forEach((shape, index) => {
    const speed = (index + 1) * 0.05;
    shape.style.transform = `translateY(${scrollY * speed}px)`;
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  createBackgroundShapes(30); // shape number
  document.addEventListener("scroll", moveShapes);
  window.addEventListener("resize", moveShapes);
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
    return [];
  }
}

export function renderProjects(
  projects,
  containerElement,
  headingLevel = "h2"
) {
  containerElement.innerHTML = ""; // Clear existing content

  projects.forEach((project) => {
    if (
      !project.title ||
      !project.year ||
      !project.image ||
      !project.description
    ) {
      console.warn("Incomplete project data:", project);
      return;
    }

    const article = document.createElement("article");
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <p><strong>Year:</strong> ${project.year}</p>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

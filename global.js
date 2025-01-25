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

  // Create the <a> element
  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight the current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer"; // For security -- Chat Recommended
  }

  // Add the <a> element to the <nav>
  nav.append(a);
}

// Setting up my circle background

// create background shapes
function generateGradientColor(baseColor, intensity) {
  // Adjust the lightness of the base color
  const lightness = Math.min(Math.max(intensity, 30), 90); // Clamp between 30% and 90%
  return `linear-gradient(to bottom right, ${baseColor}, hsl(147, 50%, ${lightness}%))`;
}

// create background shapes
function createBackgroundShapes() {
  const backgroundContainer = document.createElement("div");
  backgroundContainer.className = "background-shapes";

  const shapes = [
    { class: "shape1", size: 200, top: "10%", left: "20%" },
    { class: "shape2", size: 300, top: "50%", left: "70%" },
    { class: "shape3", size: 150, top: "80%", left: "30%" },
    { class: "shape4", size: 250, top: "15%", left: "50%" },
    { class: "shape5", size: 180, top: "60%", left: "10%" },
  ];

  const baseColor = "hsl(147, 50%, 50%)"; // Green base color

  shapes.forEach((shape, index) => {
    const div = document.createElement("div");
    div.className = `shape ${shape.class}`;
    div.style.width = `${shape.size}px`;
    div.style.height = `${shape.size}px`;
    div.style.top = shape.top;
    div.style.left = shape.left;

    // aply unique gradient based on the index
    const gradient = generateGradientColor(baseColor, 40 + index * 10);
    div.style.background = gradient;

    backgroundContainer.appendChild(div);
  });

  document.body.appendChild(backgroundContainer);
}

// handle shape movement
function moveShapes() {
  const shapes = document.querySelectorAll(".shape");
  const scrollY = window.scrollY;

  shapes.forEach((shape, index) => {
    const speed = (index + 1) * 0.05;
    shape.style.transform = `translateY(${scrollY * speed}px)`;
  });
}

// Initialize shapes and event listeners
document.addEventListener("DOMContentLoaded", () => {
  createBackgroundShapes();

  document.addEventListener("scroll", moveShapes);
  window.addEventListener("resize", moveShapes);
});

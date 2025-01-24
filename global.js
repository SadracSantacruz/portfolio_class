console.log("IT’S ALIVE!");

// Detect if we're on the home page
const ARE_WE_HOME = document.documentElement.classList.contains("home");

// Pages array: Define your navigation structure
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/SadracSantacruz", title: "GitHub" },
];

// Create a new <nav> element and add it to the <body> at the beginning
const nav = document.createElement("nav");
document.body.prepend(nav);

// Iterate over the pages and create <a> elements dynamically
for (let page of pages) {
  let url = page.url;
  let title = page.title;

  // Adjust relative URLs for non-home pages
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
    a.rel = "noopener noreferrer"; // For security
  }

  // Add the <a> element to the <nav>
  nav.append(a);
}

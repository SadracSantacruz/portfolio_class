console.log("IT’S ALIVE!");

const ARE_WE_HOME = document.documentElement.classList.contains("home");

// Links to all the pages
const pages = [
  { url: "", title: "Home", class: "home" },
  { url: "projects/", title: "Projects", class: "projects" },
  { url: "resume/", title: "Resume", class: "resume" },
  { url: "contact/", title: "Contact", class: "contact" },
  { url: "https://github.com/SadracSantacruz", title: "GitHub", class: null },
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
    a.rel = "noopener noreferrer"; // For security
  }

  // Add the <a> element to the <nav>
  nav.append(a);
}

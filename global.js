console.log("IT’S ALIVE!");

const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add("current");

let api = "https://cmgt.hr.nl/api/projects";
let tags = "https://cmgt.hr.nl/api/tags";
window.indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;

let projectWrapper = document.getElementById("projects");
let tagSelector = document.getElementById("tagSelect");
let tagSelect = document.getElementById("tagCheck");
let statusToggle = document.getElementById("statusToggle");
let online = window.navigator.onLine;
let db;
let allProjects;

//Start applicatie
window.addEventListener("load", async (event) => {
  serviceWorker();
});

//connectie verandering
window.addEventListener("online", (e) => {
  statusToggle.innerHTML = "Je bent online";
  return loadData();
});

window.addEventListener("offline", (e) => {
  statusToggle.innerHTML = "Sorry, je bent offline";
  return loadData();
});

//Serviceworker registreren
async function serviceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("serviceWorker.js")
      .then((registration) => {
        console.log("Serviceworker registered!");
        console.log(registration);
      })
      .catch((err) => {
        console.log("Serviceworker registration failed!");
        console.log(err);
      });
    loadData();
  }
}

//data laden
async function loadData() {
  await initDb();
  getProjects();
  getTags();
}

//indexed database
async function initDb() {
  let openDB = indexedDB.open("projectDb", 1);
  openDB.onupgradeneeded = (e) => {
    openDB.result.createObjectStore("projects", { keyPath: "id" });
    openDB.result.createObjectStore("tags");
    console.log("DB updating");
  };

  openDB.onsuccess = (e) => {
    projectDb = openDB.result;
    console.log("DB success");
  };

  openDB.onerror = (e) => {
    console.log("Error: " + e.message);
  };
}

//Poging tot het laden van de projecten van het netwerk, voor als ze zijn geupdate.
async function getProjects() {
  try {
    let resProjects = await fetch(api);
    let dataProjects = await resProjects.json();

    let package = projectDb.transaction("projects", "readwrite");
    let projectStore = package.objectStore("projects");
    let projects = dataProjects["data"];
    let projectsArr = [];

    projects.forEach((i) => {
      projectStore.add(i.project);
      projectsArr.push(i.project);
    });
    allProjects = projectsArr;
    projectWrapper.innerHTML = projectsArr.map(projectElements).join("\n");
    return;
  } catch (e) {
    console.log("Cant fetch, offline");
  }

  // cached projecten
  let package = projectDb.transaction("projects", "readonly");
  let projectStore = package.objectStore("projects");
  projectStore.getAll().onsuccess = (e) => {
    if (e.target.result.length) {
      console.log(e.target.result);
      projectWrapper.innerHTML = e.target.result
        .map(projectElements)
        .join("\n");
    }
  };
}

//laad de tags wanneer je online bent. Zo niet dan een melding
async function getTags() {
  try {
    let offlineOption = document.getElementById("offlineOption");
    if (offlineOption) {
      tagSelector.removeChild(offlineOption);
    }
    let resTags = await fetch(tags);
    let dataTags = await resTags.json();
    loadTags(dataTags);
  } catch {
    let offlineOption = document.createElement("option");
    offlineOption.id = "offlineOption";
    offlineOption.innerHTML =
      "Je bent offline! Controleer het netwerk om de tags te weergeven";
    tagSelector.innerHTML = "";
    tagSelector.appendChild(offlineOption);
  }
}

//Tags dropdown
function loadTags(tags) {
  tags.data.forEach((tag) => {
    let tagOption = document.createElement("option");
    tagOption.value = tag.name;
    tagOption.id = tag.name;
    tagOption.innerHTML = tag.name;
    tagOption.classList.add("tagSelectOption");
    tagSelector.appendChild(tagOption);
  });
}

//filter projects op tags
function filterTags() {
  tagSelector.value;
  let filterProjects = [];

  allProjects.forEach((x) => {
    x.tags.forEach((y) => {
      if (y.name == tagSelector.value) {
        filterProjects.push(x);
      }
    });
  });
  projectWrapper.innerHTML = filterProjects.map(projectElements).join("\n");
}

//projecten weergeven in HTML
function projectElements(data) {
  let tagArray = [];
  data["tags"].forEach((tag) => {
    let tagEl = `<span>${" " + tag.name}</span>`;
    tagArray.push(tagEl);
  });
  return `
        <div class="project scroll" id="${data.id}">
            <h2 class="titleProject">${data.title}</h2> 
            <p>tags: ${tagArray}</p>
            <p class="description">${data.description}</p> 
            <div class="projectImageWrapper">
                <img src="${data.header_image}" alt="" class="projectImage"/>
            </div>      
        </div>
    `;
}

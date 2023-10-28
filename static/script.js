// Note Container related variables
const noteCardsContainerTag = document.querySelector(
  ".notes-container > .cards-container"
);
const inputCardTitleTag = document.getElementById("card-title-name");
const messageTextTag = document.getElementById("message-text");
const noteSubmitButtonTag = document.querySelector(".note-submit-button");
const formModalBodyTag = document.getElementById("note-form");

// Image Container related variables
const imageCardsContainerTag = document.querySelector(
  ".images-container > .cards-container"
);
const previewImageTag = document.getElementById("preview-image");
const btnImageFileTag = document.getElementById("btn-image-file");
const inputImageFileTag = document.getElementById("input-image-file");
const imageCardtitleTag = document.getElementById("image-title-name");
const imageSubmitButtonTag = document.querySelector(".image-submit-button");
const imageFormTag = document.getElementById("image-form");

// Audio Container related variables
const audiocardsContaienrTag = document.querySelector("ol.list-group");
const previewAudioTag = document.getElementById("preview-audio");
const btnAudioFileTag = document.getElementById("btn-audio-file");
const inputAudioFileTag = document.getElementById("input-audio-file");
const audioCardtitleTag = document.getElementById("audio-title-name");
const audioSubmitButtonTag = document.querySelector(".audio-submit-button");
const audioFormTag = document.getElementById("audio-form");
const myAudioTag = document.querySelector("audio.my-audio");
const currentTotalTimeTag = document.querySelector(".current-and-total-time");
const progressBarTag = document.querySelector(".progress");
const currentProgressBarTag = document.querySelector(".progress-bar");
const audioPlayerTag = document.querySelector("div.audio-player");
const playButtonTag = document.querySelector("i.play-button");
const pauseButtonTag = document.querySelector("i.pause-button");
let activeAudioTag = "";
let durationTime = 0;
let durationTimeText = "00:00";

//All Containers display variable
const modalTags = document.querySelectorAll(".focus-input");
const containersTags = document.querySelectorAll(".all-contents > div");

// Navigation variable
const navbarNavTag = document.querySelector("ul.menu-container");
const searchingTag = document.querySelector(".searching");
const sliderTag = document.querySelector("ul.menu-container > div.slider");
const anchorsNavTags = {
  note: [0, 42],
  image: [58, 53],
  audio: [127, 49],
};
let activeRoute = "note";

// Top Button
const topBtnTag = document.querySelector(".top-btn");

if (location.pathname === "/") {
  // Focus input inside Note Modal when note add button is click.
  modalTags.forEach((modalTag) => {
    modalTag.addEventListener("shown.bs.modal", (e) => {
      const inputFocusTag = modalTag.querySelector("input.form-control");
      inputFocusTag.focus();
    });
  });

  // Container display, Anchor Active and Tabs menu
  navbarNavTag.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName === "A") {
      const route = e.target.innerText.slice(0, -1).toLowerCase();

      const name = e.target.getAttribute("data-container");
      containersTags.forEach((container) => {
        if (container.classList.contains(name)) {
          container.style.display = "block";
        } else {
          container.style.display = "none";
        }
      });

      const activeAnchorTag = navbarNavTag.querySelector(".active");
      activeAnchorTag.classList.remove("active");
      e.target.classList.add("active");

      const [left, width] = anchorsNavTags[route];
      sliderTag.style.transform = `translate(${left}px)`;
      sliderTag.style.width = `${width}px`;

      activeRoute = route;
      e.preventDefault();
    }
  });

  // Searching notes, images, audios and videos
  searchingTag.addEventListener("input", async function () {
    let response = await fetch(
      `/search/${activeRoute}?q=` + searchingTag.value
    );
    let rows = await response.json();
    if (activeRoute === "note") {
      noteCardsContainerTag.innerHTML = creatingNotes(rows);
    } else if (activeRoute === "image") {
      imageCardsContainerTag.innerHTML = creatingImages(rows);
    } else {
      durationTimeText = "00:00";
      myAudioTag.src = "";
      activeAudioTag = "";
      updateOnOffPlayButton();
      audiocardsContaienrTag.innerHTML = creatingAudios(rows);
    }
  });

  //When the user scrolls down 100px from the top of the document, show the button
  window.addEventListener("scroll", (e) => {
    if (
      document.body.scrollTo > 100 ||
      document.documentElement.scrollTop > 100
    ) {
      topBtnTag.style.display = "block";
    } else {
      topBtnTag.style.display = "none";
    }
  });

  topBtnTag.addEventListener("click", (e) => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });

  // Input image file and audio file handling
  btnImageFileTag.addEventListener("click", (e) => {
    if (inputImageFileTag) {
      inputImageFileTag.click();
    }
    return false;
  });

  btnAudioFileTag.addEventListener("click", (e) => {
    if (inputAudioFileTag) {
      inputAudioFileTag.click();
    }
    return false;
  });

  // Preview image and audio file handling
  inputImageFileTag.addEventListener("change", (e) => {
    preview(inputImageFileTag, previewImageTag);
  });

  inputAudioFileTag.addEventListener("change", (e) => {
    preview(inputAudioFileTag, previewAudioTag);
  });

  // Audio Control
  audioPlayerTag.addEventListener("click", (e) => {
    if (e.target && e.target.matches("i.previous-button")) {
      if (activeAudioTag) {
        activeAudioTag = activeAudioTag.previousElementSibling
          ? activeAudioTag.previousElementSibling
          : audiocardsContaienrTag.lastElementChild;
        playSong(activeAudioTag);
      }
    } else if (e.target && e.target.matches("i.play-button")) {
      if (myAudioTag.src !== "http://127.0.0.1:5000/") {
        myAudioTag.play();
        updateOnOffPlayButton(true);
      }
    } else if (e.target && e.target.matches("i.pause-button")) {
      myAudioTag.pause();
      updateOnOffPlayButton();
    } else if (e.target && e.target.matches("i.next-button")) {
      if (activeAudioTag) {
        activeAudioTag = activeAudioTag.nextElementSibling
          ? activeAudioTag.nextElementSibling
          : audiocardsContaienrTag.firstElementChild;
        playSong(activeAudioTag);
      }
    }
  });

  // Audio Playing
  audiocardsContaienrTag.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName === "LI") {
      activeAudioTag = e.target;
      playSong(activeAudioTag);
    }
  });

  /* Audio Time Progress */

  // Total Duration
  myAudioTag.addEventListener("loadeddata", (e) => {
    durationTime = Math.floor(myAudioTag.duration);
    durationTimeText = createMinuteSecond(durationTime);
  });

  // Current Time Progress
  myAudioTag.addEventListener("timeupdate", (e) => {
    const currentTime = Math.floor(myAudioTag.currentTime);
    const currentTimeText = createMinuteSecond(currentTime);
    currentTotalTimeTag.innerText = currentTimeText + " / " + durationTimeText;
    updateCurrentProgress(currentTime);
  });

  // Audio finished
  myAudioTag.addEventListener("ended", (e) => {
    updateOnOffPlayButton();
  });

  // Deleting an audio in both client and server
  audiocardsContaienrTag.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName === "I") {
      deleteData(e.target, activeRoute);
      if (e.target.parentElement.classList.contains("active")) {
        durationTimeText = "00:00";
        myAudioTag.src = "";
        activeAudioTag = "";
        updateOnOffPlayButton();
      }
    }
  });

  // Adding an audio in both client and server
  audioSubmitButtonTag.addEventListener("click", (e) => {
    if (audioCardtitleTag.value === "" || inputAudioFileTag.value === "") {
      console.log("Values are empty.");
      return false;
    } else {
      const formData = new FormData(audioFormTag);
      fetchingPost(formData, activeRoute);
      inputAudioFileTag.value = "";
      audioCardtitleTag.value = "";
      previewAudioTag.src = "";
    }
  });

  // Deleting a card in both client and server
  noteCardsContainerTag.addEventListener("click", (e) => {
    if (
      e.target &&
      (e.target.nodeName === "BUTTON" || e.target.nodeName === "I")
    ) {
      deleteData(e.target, activeRoute);
    }
  });

  // Adding a card in both client and server
  noteSubmitButtonTag.addEventListener("click", (e) => {
    if (inputCardTitleTag.value === "" || messageTextTag.value === "") {
      console.log("Values are empty.");
      return false;
    } else {
      const formData = new FormData(formModalBodyTag);
      fetchingPost(formData, activeRoute);
      inputCardTitleTag.value = "";
      messageTextTag.value = "";
    }
  });

  // Deleting an image in both client and server
  imageCardsContainerTag.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName === "I") {
      deleteData(e.target, activeRoute);
    } else if (e.target && e.target.nodeName === "IMG") {
      const closeImageTag = e.target.nextElementSibling;
      const imageCardContentTag = closeImageTag.nextElementSibling;
      closeImageTag.classList.toggle("click");
      imageCardContentTag.classList.toggle("click");
    }
  });

  // Adding an image in both client and server
  imageSubmitButtonTag.addEventListener("click", (e) => {
    if (imageCardtitleTag.value === "" || inputImageFileTag.value === "") {
      console.log("Values are empty.");
      return false;
    } else {
      const formData = new FormData(imageFormTag);
      fetchingPost(formData, activeRoute);
      imageCardtitleTag.value = "";
      inputImageFileTag.value = "";
      previewImageTag.src = "";
    }
  });
}

async function fetchingPost(formData, route) {
  try {
    const response = await fetch(`/${route}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Not Found!");
    }
    const rows = await response.json();

    if (route === "note") {
      noteCardsContainerTag.insertAdjacentHTML(
        "beforeend",
        creatingNotes(rows)
      );
    } else if (route === "image") {
      imageCardsContainerTag.insertAdjacentHTML(
        "beforeend",
        creatingImages(rows)
      );
    } else if (route === "audio") {
      audiocardsContaienrTag.insertAdjacentHTML(
        "beforeend",
        creatingAudios(rows)
      );
    }

    console.log(`Inside fetching ${route}!!!!`);
  } catch (error) {
    console.log(error);
  }
}

function creatingNotes(rows) {
  let cardHTMLCode = "";
  for (let data of rows) {
    cardHTMLCode += `
        <div class="card note-card" data-note-id="${data.id}">
          <div class="card-header">
            <h5 title="${data.date}">Note</h5>
            <button type="button" class="btn btn-light">
              <i class="fa-solid fa-x"></i>
            </button>
          </div>
          <div class="card-body">
            <h5 class="card-title">${data.title}</h5>
            <p class="card-text">
              ${data.text}
            </p>
          </div>
        </div>`;
  }
  return cardHTMLCode;
}

function creatingImages(rows) {
  let imageHTMLCode = "";
  for (let row of rows) {
    imageHTMLCode += `
    <div class="col-sm-4 col-md-3 col-lg-2 image-card" data-image-id="${
      row.id
    }">
      <img src="/static/${row.user_id}/image/${row.id}"/>
      <i class="fa-solid fa-x close-img"></i>
      <div class="image-card-content">
        <h5>${row.date.split(" ")[0]}</h5>
        <p>${row.title}</p>
      </div>
    </div>
    `;
  }
  return imageHTMLCode;
}

function creatingAudios(rows) {
  let audioHTMLCode = "";
  for (let row of rows) {
    audioHTMLCode += `
      <li class="list-group-item audio-card" data-audio-id="${row.id}"
      data-audio-src="/static/${row.user_id}/audio/${row.id}"
      title="${row.date}">
        ${row.title}
        <i class="fa-solid fa-trash-can"></i>
      </li>
    `;
  }
  return audioHTMLCode;
}

async function deleteData(target, type) {
  try {
    const parentCardTag = target.closest(`.${type}-card`);
    const response = await fetch(`/delete/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: parentCardTag.getAttribute(`data-${type}-id`),
      }),
    });
    if (!response.ok) {
      throw new Error("Response not okay!");
    }
    const data = await response.json();
    parentCardTag.remove();
  } catch (error) {
    console.log(error);
  }
}

function preview(inputFile, previewData) {
  const reader = new FileReader();
  const file = inputFile.files[0];
  reader.onloadend = (e) => {
    previewData.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function updateOnOffPlayButton(isPlaying = false) {
  if (isPlaying) {
    playButtonTag.style.display = "none";
    pauseButtonTag.style.display = "inline";
  } else {
    playButtonTag.style.display = "inline";
    pauseButtonTag.style.display = "none";
  }
}

function createMinuteSecond(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const minutesText = minutes < 10 ? "0" + minutes.toString() : minutes;
  const secondsText = seconds < 10 ? "0" + seconds.toString() : seconds;
  return minutesText + ":" + secondsText;
}

function updateCurrentProgress(currentTime) {
  const currentWidth = (100 / durationTime) * currentTime;
  currentProgressBarTag.style.width = currentWidth.toString() + "%";
}

function playSong(target) {
  myAudioTag.src = target.getAttribute("data-audio-src");
  myAudioTag.play();
  updateOnOffPlayButton(true);
  const listTags = audiocardsContaienrTag.querySelectorAll(".audio-card");
  listTags.forEach((listTag) => {
    listTag.classList.remove("active");
  });
  target.classList.add("active");
}

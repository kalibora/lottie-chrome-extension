(() => {
  const STORAGE_KEY = "defaultView";
  const VIEW_ANIMATION = "animation";
  const VIEW_JSON = "json";

  const parseDocumentJson = () => {
    const text = document.body?.innerText?.trim();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const isLikelyLottie = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const hasVersion = typeof value.v === "string";
    const hasFrameRate = typeof value.fr === "number";
    const hasInOutFrame = typeof value.ip === "number" && typeof value.op === "number";
    const hasLayers = Array.isArray(value.layers);

    return hasVersion && hasFrameRate && hasInOutFrame && hasLayers;
  };

  const storageGet = async (key) => {
    if (!chrome?.storage?.sync) {
      return undefined;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (result) => resolve(result[key]));
    });
  };

  const storageSet = async (key, value) => {
    if (!chrome?.storage?.sync) {
      return;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, () => resolve());
    });
  };

  const createButton = (label) => {
    const button = document.createElement("button");
    button.className = "lx-button";
    button.type = "button";
    button.textContent = label;
    return button;
  };

  const init = async () => {
    const jsonData = parseDocumentJson();
    if (!isLikelyLottie(jsonData)) {
      return;
    }

    const defaultView = (await storageGet(STORAGE_KEY)) || VIEW_ANIMATION;

    if (!document.head || !document.body) {
      return;
    }

    document.head.replaceChildren();
    document.body.replaceChildren();

    const title = document.createElement("title");
    title.textContent = "Lottie JSON Viewer";
    document.head.appendChild(title);

    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = chrome.runtime.getURL("src/content.css");
    document.head.appendChild(styleLink);

    document.body.classList.add("lx-viewer-enabled");

    const app = document.createElement("div");
    app.id = "lx-app";

    const toolbar = document.createElement("div");
    toolbar.id = "lx-toolbar";

    const viewGroup = document.createElement("div");
    viewGroup.className = "lx-group";
    const animationBtn = createButton("Animation");
    const jsonBtn = createButton("JSON");
    viewGroup.append(animationBtn, jsonBtn);

    const playbackGroup = document.createElement("div");
    playbackGroup.className = "lx-group";
    const playPauseBtn = createButton("Pause");
    const loopBtn = createButton("Loop: ON");
    const speedSelect = document.createElement("select");
    speedSelect.className = "lx-select";
    [0.5, 1, 1.5, 2].forEach((speed) => {
      const option = document.createElement("option");
      option.value = String(speed);
      option.textContent = `${speed}x`;
      if (speed === 1) {
        option.selected = true;
      }
      speedSelect.appendChild(option);
    });
    playbackGroup.append(playPauseBtn, loopBtn, speedSelect);

    const note = document.createElement("div");
    note.id = "lx-note";
    note.textContent = "表示切替は保存されます";

    toolbar.append(viewGroup, playbackGroup, note);

    const content = document.createElement("div");
    content.id = "lx-content";

    const animationView = document.createElement("div");
    animationView.id = "lx-animation-view";
    const animationContainer = document.createElement("div");
    animationContainer.id = "lx-animation-container";
    animationView.appendChild(animationContainer);

    const jsonView = document.createElement("pre");
    jsonView.id = "lx-json-view";
    jsonView.textContent = JSON.stringify(jsonData, null, 2);

    content.append(animationView, jsonView);
    app.append(toolbar, content);
    document.body.appendChild(app);

    const animation = lottie.loadAnimation({
      container: animationContainer,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: jsonData
    });

    let currentView = VIEW_ANIMATION;
    let isPaused = false;
    let isLoop = true;

    const setView = async (view, persist = false) => {
      currentView = view;

      const animationVisible = view === VIEW_ANIMATION;
      animationView.style.display = animationVisible ? "grid" : "none";
      jsonView.style.display = animationVisible ? "none" : "block";

      animationBtn.classList.toggle("active", animationVisible);
      jsonBtn.classList.toggle("active", !animationVisible);

      playbackGroup.style.display = animationVisible ? "flex" : "none";

      if (persist) {
        await storageSet(STORAGE_KEY, view);
      }
    };

    animationBtn.addEventListener("click", () => setView(VIEW_ANIMATION, true));
    jsonBtn.addEventListener("click", () => setView(VIEW_JSON, true));

    playPauseBtn.addEventListener("click", () => {
      if (isPaused) {
        animation.play();
        playPauseBtn.textContent = "Pause";
      } else {
        animation.pause();
        playPauseBtn.textContent = "Play";
      }
      isPaused = !isPaused;
    });

    loopBtn.addEventListener("click", () => {
      isLoop = !isLoop;
      animation.loop = isLoop;
      loopBtn.textContent = isLoop ? "Loop: ON" : "Loop: OFF";
    });

    speedSelect.addEventListener("change", () => {
      const speed = Number(speedSelect.value);
      animation.setSpeed(speed);
    });

    await setView(defaultView === VIEW_JSON ? VIEW_JSON : VIEW_ANIMATION, false);

    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "v") {
        const nextView = currentView === VIEW_ANIMATION ? VIEW_JSON : VIEW_ANIMATION;
        void setView(nextView, true);
      }
    });
  };

  void init();
})();

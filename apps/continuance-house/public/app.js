const state = {
  view: "desk", session: null, speaking: false, recognition: null,
  listening: false, fridge: false, activity: null, integrations: null, family: null,
  missionStates: new Set(), failed: false
};

const stations = { desk: "COMMAND DECK", signals: "SIGNAL RELAY", family: "FAMILY ATLAS", systems: "SYSTEMS GRID" };
const refs = {
  chat: document.querySelector("#conversation"),
  input: document.querySelector("#command-input"),
  form: document.querySelector("#command-form"),
  voice: document.querySelector("#push-to-talk"),
  speech: document.querySelector("#spoken-reply")
};

const textElement = (tag, value, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = String(value);
  return el;
};
const clear = (container) => { container.replaceChildren(); };
const append = (parent, ...nodes) => { parent.append(...nodes); return parent; };
const requestJSON = async (path, init) => {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Request unavailable");
  return value;
};
const timeString = (value) => {
  if (!value) return "DATE NOT AVAILABLE";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "DATE NOT AVAILABLE";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function appendMessage(source, message) {
  const entry = textElement("div", "", "chat-entry" + (source === "YOU" ? " chat-entry--user" : ""));
  append(entry, textElement("span", source === "YOU" ? "YOU" : "IREN · SAFE ROUTER", "chat-source"),
    textElement("p", message));
  refs.chat.append(entry);
  while (refs.chat.children.length > 18) refs.chat.firstElementChild.remove();
  refs.chat.scrollTop = refs.chat.scrollHeight;
}
function say(text) {
  if (!state.speaking || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = .95;
  speechSynthesis.speak(utterance);
}
function mobileOpen(open) {
  const panel = document.querySelector(".iren-panel");
  panel.classList.toggle("is-mobile-open", open);
  const button = document.querySelector("#mobile-iren");
  button.setAttribute("aria-expanded", String(open));
  if (open) panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "end" });
}
function showStation(name) {
  if (!stations[name]) return;
  state.view = name;
  document.body.classList.toggle("fridge-preview", state.fridge && name === "family");
  for (const panel of document.querySelectorAll(".station-view")) panel.hidden = panel.dataset.station !== name;
  for (const button of document.querySelectorAll("[data-view]")) {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    if (button.closest(".side-nav,.mobile-nav")) {
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
  }
  document.querySelector("#station-name").textContent = stations[name];
  if (name === "signals") renderActivity();
  if (name === "family") renderFamily();
  if (name === "systems") renderIntegrations();
  document.querySelector("#main-content").scrollIntoView({ block: "start" });
}
async function renderActivity(reload = false) {
  const container = document.querySelector("#signal-list");
  if (state.activity && !reload) return;
  clear(container); append(container, textElement("p", "Retrieving public GitHub development activity…", "empty-note"));
  try {
    const result = await requestJSON("/api/activity");
    state.activity = result;
    clear(container);
    if (!result.live) return append(container, textElement("p", result.note, "empty-note"));
    if (!result.items.length) return append(container, textElement("p", "No open public pull requests were returned.", "empty-note"));
    for (const item of result.items) {
      const card = textElement("a", "", "signal-card");
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      const content = textElement("div", "", "signal-content");
      append(content, textElement("strong", item.title),
        textElement("p", (item.draft ? "DRAFT · " : "OPEN PR · ") + "Updated " + timeString(item.updatedAt)));
      append(card, textElement("span", "#" + item.number, "signal-index"), content,
        textElement("span", "↗", "signal-arrow"));
      container.append(card);
    }
    append(container, textElement("p", "SOURCE: PUBLIC GITHUB PULL REQUESTS · NOT VERIFIED PRODUCTION STATUS · FETCHED " + timeString(result.fetchedAt), "micro"));
  } catch (error) {
    clear(container); append(container, textElement("p", "Development activity unavailable: " + error.message, "empty-note"));
  }
}
async function renderIntegrations() {
  const container = document.querySelector("#integration-list");
  if (!state.integrations) {
    clear(container); append(container, textElement("p", "Reading integration configuration…", "empty-note"));
    try { state.integrations = await requestJSON("/api/integrations"); }
    catch (error) { clear(container); append(container, textElement("p", error.message, "empty-note")); return; }
  }
  clear(container);
  for (const item of state.integrations.integrations) {
    const card = textElement("article", "", "integration-card");
    const title = textElement("div", "", "integration-name");
    const chip = textElement("span", item.state.replace(/-/g, " "), "integration-chip" +
      (["verified", "public-read-only", "linked-navigation"].includes(item.state) ? " integration-chip--ready" : " integration-chip--pending"));
    append(title, textElement("h3", item.label), chip);
    append(card, title, textElement("p", item.detail));
    container.append(card);
  }
}
async function renderFamily() {
  if (!state.family) {
    try { state.family = await requestJSON("/api/family-preview"); }
    catch (error) {
      document.querySelector("#family-explorers").replaceChildren(textElement("p", error.message, "empty-note"));
      return;
    }
  }
  const family = state.family;
  const explorerList = document.querySelector("#family-explorers");
  const missionList = document.querySelector("#family-missions");
  clear(explorerList); clear(missionList);
  if (!family.synthetic) {
    append(explorerList, textElement("p", "This route only supports the labeled synthetic demonstration.", "empty-note"));
    return;
  }
  for (const explorer of family.explorers) {
    const card = textElement("article", "", "explorer explorer--" + explorer.theme);
    const orbit = textElement("div", "", "explorer-orbit"); orbit.setAttribute("aria-hidden", "true");
    const stardust = textElement("div", String(explorer.stardust), "explorer-stardust");
    append(stardust, textElement("small", "DEMO STARDUST"));
    append(card, orbit, textElement("span", "SYNTHETIC PROFILE", "micro"),
      textElement("h3", explorer.label), textElement("div", "LEVEL " + explorer.level + " · NONPERSISTENT", "explorer-level"), stardust);
    explorerList.append(card);
  }
  for (const mission of family.missions) {
    const chosen = state.missionStates.has(mission.id);
    const card = textElement("article", "", "mission-card");
    const body = textElement("div", "", "mission-body");
    append(body, textElement("strong", mission.title), textElement("p", "+" + mission.reward + " example Stardust · not awarded"));
    const button = textElement("button", chosen ? "Preview selected" : "Select preview");
    button.type = "button";
    button.dataset.mission = mission.id;
    button.setAttribute("aria-pressed", String(chosen));
    append(card, textElement("span", "✧", "mission-icon"), body, button);
    missionList.append(card);
  }
}
async function sendCommand(command) {
  const value = command.trim();
  if (!value) return;
  appendMessage("YOU", value);
  refs.input.value = "";
  try {
    const response = await requestJSON("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: value })
    });
    appendMessage("IREN", response.message);
    say(response.message);
    if (response.kind === "view" && stations[response.view]) showStation(response.view);
    else if (response.kind === "link" && /^https:\/\/anevum\.com\//.test(response.href)) {
      const link = document.createElement("a");
      link.href = response.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open protected ANEVUM destination ↗";
      const entry = textElement("div", "", "chat-entry");
      entry.append(link); refs.chat.append(entry);
      refs.chat.scrollTop = refs.chat.scrollHeight;
    }
  } catch (error) {
    appendMessage("IREN", "Command unavailable. No operation was executed. " + error.message);
  }
}
function attachVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    refs.voice.disabled = true;
    refs.voice.title = "Browser speech recognition is unavailable. Text input remains supported.";
    refs.voice.querySelector("span").textContent = "Text input only";
    return;
  }
  refs.voice.addEventListener("click", () => {
    if (state.listening) {
      state.recognition?.stop();
      return;
    }
    const recognition = new Recognition();
    state.recognition = recognition;
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const phrase = event.results?.[0]?.[0]?.transcript;
      if (phrase) sendCommand(phrase);
    };
    recognition.onerror = (event) => {
      appendMessage("IREN", "Microphone recognition stopped: " + (event.error || "unknown") + ". Use typed commands if unavailable.");
    };
    recognition.onend = () => {
      state.listening = false;
      refs.voice.setAttribute("aria-pressed", "false");
      refs.voice.querySelector("span").textContent = "Push to talk";
    };
    try {
      recognition.start();
      state.listening = true;
      refs.voice.setAttribute("aria-pressed", "true");
      refs.voice.querySelector("span").textContent = "Listening… tap to stop";
    } catch {
      appendMessage("IREN", "Speech input could not start. No audio was recorded by this app.");
    }
  });
  if (!("speechSynthesis" in window)) {
    refs.speech.disabled = true;
    refs.speech.title = "Speech output is unavailable in this browser.";
  } else {
    refs.speech.addEventListener("click", () => {
      state.speaking = !state.speaking;
      refs.speech.setAttribute("aria-pressed", String(state.speaking));
      refs.speech.querySelector("span").textContent = state.speaking ? "Spoken reply on" : "Spoken reply off";
      if (!state.speaking) speechSynthesis.cancel();
    });
  }
}
function bind() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.view) return showStation(target.dataset.view);
    if (target.dataset.prompt) {
      if (matchMedia("(max-width: 820px)").matches) mobileOpen(true);
      return sendCommand(target.dataset.prompt);
    }
    if (target.dataset.mission) {
      if (state.missionStates.has(target.dataset.mission)) state.missionStates.delete(target.dataset.mission);
      else state.missionStates.add(target.dataset.mission);
      renderFamily();
    }
  });
  document.querySelector("#refresh-signals").addEventListener("click", () => renderActivity(true));
  document.querySelector("#fridge-mode").addEventListener("click", () => {
    state.fridge = !state.fridge;
    document.body.classList.toggle("fridge-preview", state.fridge);
    document.querySelector("#fridge-mode").textContent = state.fridge ? "← Exit fridge preview" : "◫ Fridge display preview";
  });
  document.querySelector("#mobile-iren").addEventListener("click", () => {
    mobileOpen(!document.querySelector(".iren-panel").classList.contains("is-mobile-open"));
  });
  refs.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendCommand(refs.input.value);
  });
  document.addEventListener("keydown", (event) => {
    const editable = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (event.key === "Escape" && state.fridge) {
      state.fridge = false;
      document.body.classList.remove("fridge-preview");
      document.querySelector("#fridge-mode").textContent = "◫ Fridge display preview";
      return;
    }
    if (event.key === "Escape") mobileOpen(false);
    if (editable || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "/") {
      event.preventDefault();
      mobileOpen(true);
      refs.input.focus();
    }
    if (["1","2","3","4"].includes(event.key)) {
      const view = Object.keys(stations)[Number(event.key) - 1];
      showStation(view);
    }
  });
  attachVoice();
}

function drawStarfield() {
  const canvas = document.querySelector("#hero-stars");
  const context = canvas?.getContext("2d");
  if (!context) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0, dpr = 1, tick = 0;
  let points = [];
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    points = Array.from({length: Math.min(85, Math.max(28, Math.round(width * height / 4100)))}, (_, i) => {
      const x = ((i * 0.6180339 + .137) % 1) * width;
      const y = ((i * .4142135 + .41) % 1) * height;
      return { x, y, phase: i * 2.32, radius: i % 7 ? .6 : 1.25 };
    });
  }
  function paint() {
    context.clearRect(0,0,width,height);
    for (const p of points) {
      const alpha = still ? .37 : .23 + .23 * Math.sin(tick * .009 + p.phase);
      context.fillStyle = "rgba(144,216,238," + Math.max(.04, alpha).toFixed(3) + ")";
      context.beginPath(); context.arc(p.x,p.y,p.radius,0,2*Math.PI); context.fill();
    }
  }
  resize(); paint();
  const observer = new ResizeObserver(() => { resize(); paint(); });
  observer.observe(canvas);
  if (!still) {
    let last = 0;
    function frame(ts) {
      if (ts - last > 50 && !document.hidden) { last = ts; tick += 1; paint(); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
async function boot() {
  bind();
  try {
    const session = await requestJSON("/api/session");
    state.session = session;
    const label = session.identity.mode === "verified" ? "VERIFIED OWNER" : "LOCAL DEMO";
    document.querySelector("#access-label").textContent = label;
    if (session.identity.mode !== "verified") {
      appendMessage("IREN", "Local demonstration mode. No real family state, device control or personal account data is connected.");
    }
  } catch (error) {
    state.failed = true;
    document.querySelector("#access-label").textContent = "NOT AUTHORIZED";
    appendMessage("IREN", "Identity verification failed: " + error.message);
    refs.input.disabled = true;
    refs.form.querySelector("button").disabled = true;
    refs.voice.disabled = true;
    document.querySelector(".workspace").replaceChildren(textElement("p", "This private command center requires verified access.", "empty-note"));
    return;
  }
  drawStarfield();
  const formatClock = () => {
    document.querySelector("#clock").textContent = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
  };
  formatClock();
  setInterval(formatClock, 30000);
}
boot();

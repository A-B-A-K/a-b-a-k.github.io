  // ----- the radio: shuffle the SoundCloud playlist via the Widget API.
  // On first play, jump to a random track; when a track ends, hop to another.
  // The queue reshuffles when exhausted, so the station never stops.
  const scWidget = SC.Widget(document.getElementById("sc-player"));
  let scTotal = 0, scQueue = [], scStarted = false;

  scWidget.bind(SC.Widget.Events.READY, () =>
    scWidget.getSounds(sounds => { scTotal = sounds.length; }));

  function scNextRandom() {
    const go = () => {
      if (!scQueue.length)
        scQueue = [...Array(scTotal).keys()].sort(() => Math.random() - 0.5);
      scWidget.skip(scQueue.pop());
      scWidget.play();                       // skip() alone can land paused
      setTimeout(() => scWidget.play(), 350); // belt and suspenders: kick it again once loaded
    };
    if (scTotal) go();
    else scWidget.getSounds(s => { scTotal = s.length; if (scTotal) go(); });
  }

  scWidget.bind(SC.Widget.Events.PLAY, () => {
    if (!scStarted) { scStarted = true; scNextRandom(); }
  });
  scWidget.bind(SC.Widget.Events.FINISH, scNextRandom);

  // ----- tabs: rooms stay in the DOM (so the radio keeps playing), only visibility flips
  const tabs = document.querySelectorAll(".tab");
  const rooms = { };
  document.querySelectorAll(".room").forEach(r => rooms[r.id.replace("room-","")] = r);

  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
    Object.entries(rooms).forEach(([name, room]) => {
      room.classList.toggle("lit", name === tab.dataset.room);
    });
    history.replaceState(null, "", "#" + tab.dataset.room);
  }));

  // restore room from URL hash
  const hash = location.hash.slice(1);
  if (rooms[hash]) document.querySelector(`.tab[data-room="${hash}"]`).click();

  // ----- the candle you carry: eased mouse glow
  const glow = document.getElementById("mouse-glow");
  let mx = innerWidth / 2, my = innerHeight / 3;  // target
  let gx = mx, gy = my;                            // current
  let seen = false;

  addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; glow.style.opacity = 1; gx = mx; gy = my; }
  });

  (function drift() {
    gx += (mx - gx) * 0.09;   // the lag that makes it feel carried, not attached
    gy += (my - gy) * 0.09;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(drift);
  })();
  // ----- weather: a glance out the other window (Open-Meteo, no key needed)
  const wxToggle = document.getElementById("wx-toggle");
  const wxCard = document.getElementById("wx-card");
  let wxLoaded = false;

  const WX_WORDS = [
    [[0], "clear skies", "\u263C"],
    [[1, 2], "a few clouds drifting", "\u26C5"],
    [[3], "a grey blanket overhead", "\u2601"],
    [[45, 48], "fog rolling in", "\u2248"],
    [[51, 53, 55, 56, 57], "soft drizzle", "\u2602"],
    [[61, 63, 65, 66, 67, 80, 81, 82], "rain on the window", "\u2614"],
    [[71, 73, 75, 77, 85, 86], "snow falling quietly", "\u2744"],
    [[95, 96, 99], "a storm brewing", "\u26A1"],
  ];

  function wxDescribe(code) {
    for (const [codes, words, glyph] of WX_WORDS)
      if (codes.includes(code)) return { words, glyph };
    return { words: "weather doing its thing", glyph: "\u263C" };
  }

  let wxKind = "clear"; // "rain" | "snow" | "clear" — shared with the diorama

  async function loadWeather() {
    try {
      const r = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.405" +
        "&current=temperature_2m,weather_code&timezone=Europe%2FBerlin");
      const d = await r.json();
      const t = Math.round(d.current.temperature_2m);
      const code = d.current.weather_code;
      const { words, glyph } = wxDescribe(code);
      document.getElementById("wx-temp").textContent = `${t}\u00B0C`;
      document.getElementById("wx-desc").textContent = words;
      wxToggle.innerHTML = glyph;
      wxLoaded = true;
      // ----- tell the diorama about it
      const RAIN = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
      const SNOW = [71,73,75,77,85,86];
      wxKind = RAIN.includes(code) ? "rain" : SNOW.includes(code) ? "snow" : "clear";
      const svg = document.querySelector("#diorama svg");
      svg.classList.toggle("wx-rain", wxKind === "rain");
      svg.classList.toggle("wx-snow", wxKind === "snow");
      if (typeof refreshDiorama === "function") refreshDiorama();
    } catch {
      document.getElementById("wx-temp").textContent = "?";
      document.getElementById("wx-desc").textContent = "the window is misted over";
    }
  }

  wxToggle.addEventListener("click", () => {
    const open = wxCard.classList.toggle("open");
    wxToggle.setAttribute("aria-expanded", open);
    localStorage.setItem("wx-open", open ? "1" : "0");
    if (open && !wxLoaded) loadWeather();
  });

  // remember preference across visits
  if (localStorage.getItem("wx-open") === "1") wxToggle.click();
  loadWeather(); // the diorama wants to know the weather regardless of the card
  // ----- the diorama: pick the scene from Berlin time
  const SCENES = [
    { id: "sc-morning", caption: "having breakfast" },
    { id: "sc-day",     caption: "at the desk, 9 to 5" },
    { id: "sc-evening", caption: "out walking in the park" },
    { id: "sc-night",   caption: "asleep \u2014 the site is minding the shop" },
  ];

  function currentScene() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
    const h = now.getHours(), weekend = [0, 6].includes(now.getDay());
    if (h >= 7  && h < 9)  return 0;
    if (h >= 9  && h < 18) return weekend ? 2 : 1;
    if (h >= 18 && h < 22) return 2;
    return 3;
  }

  const diorama = document.getElementById("diorama");
  const dioCaption = document.getElementById("diorama-caption");
  let peek = null; // manual preview index, null = live

  function showScene(i, live) {
    SCENES.forEach((s, j) =>
      document.getElementById(s.id).classList.toggle("on", j === i));
    let caption = SCENES[i].caption;
    if (wxKind === "rain" && i === 2) caption += ", umbrella in hand";
    if (wxKind === "snow" && i === 2) caption += ", in the snow";
    if (wxKind === "rain" && i !== 2) caption += " (rain outside)";
    dioCaption.textContent = (live ? "right now: " : "peek: ") + caption;
  }

  function refreshDiorama() {
    if (peek === null) showScene(currentScene(), true);
  }

  // click cycles through all the other scenes for a peek, then back to live
  let peekSteps = 0;
  diorama.addEventListener("click", () => {
    peekSteps = (peekSteps + 1) % 4;
    if (peekSteps === 0) { peek = null; showScene(currentScene(), true); }
    else { peek = (currentScene() + peekSteps) % 4; showScene(peek, false); }
  });

  diorama.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); diorama.click(); }
  });

  showScene(currentScene(), true);
  setInterval(() => { if (peek === null) showScene(currentScene(), true); }, 60_000);

// --- PAGE ROUTING SYSTEM ---
let currentPage = "main";

function switchPage(targetPage) {
  const mainPage = document.getElementById("mainPage");
  const shoppingPage = document.getElementById("shoppingPage");
  const exercisePage = document.getElementById("exercisePage");
  const supplementsPage = document.getElementById("supplementsPage");
  const floatBtn = document.getElementById("floatNavBtn");

  mainPage.classList.remove("active");
  shoppingPage.classList.remove("active");
  exercisePage.classList.remove("active");
  supplementsPage.classList.remove("active");

  if (targetPage === "main") {
    mainPage.classList.add("active");
    currentPage = "main";
    floatBtn.innerHTML = "⫶☰";
    floatBtn.setAttribute("title", "Open Shopping");
    updateDashboardShoppingCount();
    renderDashboardFitnessList();
    updateUI();
  } else if (targetPage === "shopping") {
    shoppingPage.classList.add("active");
    currentPage = "shopping";
    floatBtn.innerHTML = "🏠︎";
    floatBtn.setAttribute("title", "Back to Dashboard");
    renderShoppingList();
  } else if (targetPage === "exercise") {
    exercisePage.classList.add("active");
    currentPage = "exercise";
    floatBtn.innerHTML = "🏠︎";
    floatBtn.setAttribute("title", "Back to Dashboard");
    renderExerciseList();
  } else if (targetPage === "supplements") {
    supplementsPage.classList.add("active");
    currentPage = "supplements";
    floatBtn.innerHTML = "🏠︎";
    floatBtn.setAttribute("title", "Back to Dashboard");
    renderSupplementsPage();
  }
}

function toggleMainNavigation() {
  if (currentPage === "main") {
    switchPage("shopping");
  } else {
    switchPage("main");
  }
}

// --- 0. CLOCKS & DATE FORMATTER ---
function setElementText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = value;
  }
}

function updateClocksAndDate() {
  const now = new Date();
  setElementText(
    "localClock",
    now.toLocaleTimeString("en-GB", { hour12: false }),
  );

  const optionsIST = {
    timeZone: "Asia/Kolkata",
    timeStyle: "medium",
    hour12: false,
  };
  setElementText(
    "indiaClock",
    new Intl.DateTimeFormat("en-GB", optionsIST).format(now),
  );

  setElementText(
    "dateDisplay",
    now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  );
}
setInterval(updateClocksAndDate, 1000);
updateClocksAndDate();

// --- 1. LIVE WEATHER & POLLEN FETCH ---
const WEATHER_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
let weatherRefreshTimer = null;

function scheduleWeatherRefresh() {
  if (weatherRefreshTimer) {
    clearInterval(weatherRefreshTimer);
  }

  weatherRefreshTimer = setInterval(() => {
    fetchEnvironmentData();
  }, WEATHER_REFRESH_INTERVAL_MS);
}

async function fetchEnvironmentData() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        getWeatherData(
          position.coords.latitude,
          position.coords.longitude,
        );
        getPollenData(
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      () => {
        getWeatherData(53.5511, 9.9937);
        getPollenData(53.5511, 9.9937);
      },
    );
  } else {
    getWeatherData(53.5511, 9.9937);
    getPollenData(53.5511, 9.9937);
  }
}

async function getWeatherData(lat, lon) {
  try {
    // Request additional current values and hourly precipitation for timing
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relativehumidity_2m,precipitation_probability,uv_index&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=precipitation,precipitation_probability,weathercode&forecast_days=2&timezone=auto&wind_speed_unit=kmh`;
    let response = await fetch(url);
    let data = await response.json();
    console.log({ url });
    let currentTemp = Math.round(data.current.temperature_2m);
    let feelsLikeTemp = Math.round(data.current.apparent_temperature);
    let highTemp = Math.round(data.daily.temperature_2m_max[0]);
    let lowTemp = Math.round(data.daily.temperature_2m_min[0]);
    let precipitation = data.current.precipitation;
    const windSpeed = Math.round(data.current.wind_speed_10m || 0);
    const humidity = Math.round(data.current.relativehumidity_2m ?? (data.current.humidity ?? 0));
    const precipProb = Math.round(data.current.precipitation_probability ?? 0);
    const uvIndex = data.current.uv_index ?? data.current.uv ?? null;
    let sunrise = data.daily.sunrise?.[0];
    let sunset = data.daily.sunset?.[0];

    setElementText("currentTemp", `${currentTemp}°C`);
    setElementText("feelsLikeTemp", `${feelsLikeTemp}°C`);
    setElementText("highTemp", `${highTemp}°C`);
    setElementText("lowTemp", `${lowTemp}°C`);
    setElementText("windSpeed", `${windSpeed} km/h`);
    const windEl = document.getElementById("windSpeedCard");
    if (windEl) windEl.innerText = `${windSpeed} km/h`;
    const humEl = document.getElementById("humidity");
    if (humEl) humEl.innerText = `${humidity}%`;
    const precipEl = document.getElementById("precipProb");
    if (precipEl) precipEl.innerText = `${precipProb}%`;
    const uvEl = document.getElementById("uvIndex");
    if (uvEl) uvEl.innerText = uvIndex !== null ? String(uvIndex) : "N/A";
    const uvAdviceEl = document.getElementById("uvAdvice");
    if (uvAdviceEl) {
      if (uvIndex === null) uvAdviceEl.innerText = "UV data unavailable.";
      else if (uvIndex <= 2) uvAdviceEl.innerText = "Low UV — minimal protection needed.";
      else if (uvIndex <= 5) uvAdviceEl.innerText = "Moderate UV — wear sunglasses and sunscreen.";
      else if (uvIndex <= 7) uvAdviceEl.innerText = "High UV — reduce sun exposure, use SPF 30+.";
      else if (uvIndex <= 10) uvAdviceEl.innerText = "Very high UV — seek shade and cover up.";
      else uvAdviceEl.innerText = "Extreme UV — avoid sun exposure during peak hours.";
    }
    setElementText(
      "weatherForecast",
      `Forecast: ${getWeatherForecast(currentTemp, precipitation, highTemp, lowTemp)}`,
    );

    if (sunrise && sunset) {
      setElementText("sunriseValue", formatTimeValue(sunrise));
      setElementText("sunsetValue", formatTimeValue(sunset));
    } else {
      setElementText("sunriseValue", "--:--");
      setElementText("sunsetValue", "--:--");
    }

    await loadWeatherAdvice();
    // determine next precipitation events (up to 2) and max prob from hourly data
    let nextPrecipEvents = [];
    let maxPrecipProb = 0;
    try {
      if (data.hourly && Array.isArray(data.hourly.time)) {
        const now = new Date();
        const times = data.hourly.time;
        const precips = data.hourly.precipitation || [];
        const probs = data.hourly.precipitation_probability || [];
        for (let i = 0; i < times.length; i++) {
          const t = new Date(times[i]);
          const p = Number(precips[i] || 0);
          const prob = Math.round(Number(probs[i] || 0));
          if (t > now && (p > 0 || prob >= 10)) {
            nextPrecipEvents.push({ time: times[i], precip: p, prob });
            if (nextPrecipEvents.length >= 2) break;
          }
          if (prob > maxPrecipProb) maxPrecipProb = prob;
        }
      }
    } catch (e) {
      console.warn('Error parsing hourly precip', e);
    }

    // Use 'feels like' temperature for advice generation; include next precip events and max probability
    generateSmartAdvice(feelsLikeTemp, highTemp, lowTemp, precipitation, humidity, nextPrecipEvents, maxPrecipProb);
  } catch (error) {
    const adviceEl = document.getElementById("weatherAdvice");
    if (adviceEl) {
      adviceEl.innerText = "Could not load live weather.";
    }
  }
}

function formatTimeValue(value) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function getPollenData(lat, lon) {
  try {
    let url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=grass_pollen,birch_pollen,ragweed_pollen&timezone=auto`;
    let response = await fetch(url);
    let data = await response.json();
    console.log({ url });
    let birch = data.current.birch_pollen ?? 0;
    let grass = data.current.grass_pollen ?? 0;
    let ragweed = data.current.ragweed_pollen ?? 0;

    document.getElementById("pollenBirch").innerText =
      `${Math.round(birch)} grains/m³`;
    document.getElementById("pollenGrass").innerText =
      `${Math.round(grass)} grains/m³`;
    document.getElementById("pollenRagweed").innerText =
      `${Math.round(ragweed)} grains/m³`;

    let maxVal = Math.max(birch, grass, ragweed);
    let statusEl = document.getElementById("pollenStatus");
    let adviceEl = document.getElementById("pollenAdvice");

    if (maxVal < 10) {
      statusEl.innerText = "Low / Clean";
      statusEl.className = "highlight pollen-level-low";
      adviceEl.innerText = "Safe for outdoor activities.";
    } else if (maxVal >= 10 && maxVal < 50) {
      statusEl.innerText = "Moderate";
      statusEl.className = "highlight pollen-level-moderate";
      adviceEl.innerText = "Mild allergy precautions advised.";
    } else {
      statusEl.innerText = "High Pollen Alert";
      statusEl.className = "highlight pollen-level-high";
      adviceEl.innerText = "Keep windows closed & take antihistamines!";
    }
  } catch (error) {
    document.getElementById("pollenStatus").innerText = "Unavailable";
    document.getElementById("pollenAdvice").innerText =
      "Could not fetch air quality API.";
  }
}
fetchEnvironmentData();
scheduleWeatherRefresh();
registerServiceWorker();

function getWeatherForecast(current, precipitation, high, low) {
  if (precipitation >= 5) {
    return "⛈️ Heavy rain";
  }
  if (precipitation >= 1) {
    return "🌧️ Rainy";
  }
  if (precipitation > 0) {
    return "🌦️ Light rain / drizzle";
  }

  const range = high - low;
  if (current >= 28) {
    return "☀️ Sunny";
  }
  if (current >= 20) {
    return range > 10
      ? "🌤️ Mostly sunny with some clouds"
      : "☀️ Sunny to partly cloudy";
  }
  if (current >= 10) {
    return "⛅ Partly cloudy";
  }
  if (current >= 0) {
    return "🌥️ Cool and cloudy";
  }
  return "🌫️ Cold and foggy";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) =>
        console.warn("Service Worker registration failed:", err),
      );
  }
}

function generateSmartAdvice(current, high, low, rain, humidity, nextPrecipEvents, maxPrecipProb) {
  const alertEl = document.getElementById("weatherAlert");
  const tipsEl = document.getElementById("weatherTips");

  // If JSON loaded, prefer structured advice
  if (weatherAdviceData) {
    // choose temperature bucket
    let tempAdvice = null;
    for (const bucket of weatherAdviceData.temperature) {
      if (current >= bucket.min && current < bucket.max) {
        tempAdvice = bucket.advice;
        break;
      }
    }

    // precipitation heuristics for winter conditions
    let precipKey = null;
    if (typeof rain === "number") {
      if (rain >= 5) precipKey = "heavy_rain";
      else if (rain >= 1) precipKey = "light_rain";
      else if (rain > 0) precipKey = "light_rain";
    }

    // infer possible snow/flurries when temperatures are near or below freezing
    const possibleSnow = current <= 2 && (rain > 0 || high <= 2 || low <= 0);
    if (possibleSnow) {
      if (typeof rain === "number" && rain >= 1) precipKey = "snowfall";
      else precipKey = precipKey || "flurries";
    }

    // black ice heuristic: near-freezing temps with any sign of precipitation or overnight freeze
    let blackIce = false;
    if (current <= 2 && (rain > 0 || low <= 0)) {
      blackIce = true;
    }

    const alertParts = [];
    const tipsParts = [];

    if (tempAdvice) {
      if (tempAdvice.home) {
        const homeText = tempAdvice.home;
        const isHeatAdvice = /heatwave|heat wave|heat/i.test(homeText);
        const heatThresholdReached = typeof high === "number" && high >= 25;

        if (isHeatAdvice && heatThresholdReached) {
          alertParts.push(homeText);
        }
      }
      if (tempAdvice.travel) alertParts.push(tempAdvice.travel);
      if (tempAdvice.wear) tipsParts.push(tempAdvice.wear);
      if (tempAdvice.carry) tipsParts.push(tempAdvice.carry);
    }

    // Add moisturizing advice based on dryness and humidity
    const humidityLevel = typeof humidity === "number" ? humidity : 0;
    if (weatherAdviceData.moisture) {
      let moistureKey = "moderate";
      if (humidityLevel <= 30 || current <= 5) {
        moistureKey = "very_dry";
      } else if (humidityLevel <= 50 || current <= 10) {
        moistureKey = "dry";
      } else if (humidityLevel >= 70) {
        moistureKey = "humid";
      }
      if (weatherAdviceData.moisture[moistureKey]) {
        tipsParts.push(weatherAdviceData.moisture[moistureKey]);
      }
    }

    if (precipKey && weatherAdviceData.precipitation[precipKey]) {
      const p = weatherAdviceData.precipitation[precipKey];
      const first = (Array.isArray(nextPrecipEvents) && nextPrecipEvents[0]) || null;
      const timeSuffix = first ? ` (at ${formatTimeValue(first.time)}${first.prob ? ', ' + first.prob + '%' : ''})` : "";
      if (p.travel) alertParts.push(p.travel + timeSuffix);
      if (p.home) alertParts.push(p.home + timeSuffix);
      if (p.carry) tipsParts.push(p.carry + timeSuffix);
    }

    if (blackIce && weatherAdviceData.precipitation.black_ice) {
      const bi = weatherAdviceData.precipitation.black_ice;
      const first = (Array.isArray(nextPrecipEvents) && nextPrecipEvents[0]) || null;
      const timeSuffix = first ? ` (at ${formatTimeValue(first.time)}${first.prob ? ', ' + first.prob + '%' : ''})` : "";
      if (bi.travel) alertParts.push(bi.travel + timeSuffix);
      if (bi.footwear) tipsParts.push(bi.footwear);
      if (bi.home) alertParts.push(bi.home + timeSuffix);
    }

    if (alertEl) {
      alertEl.innerHTML = alertParts.join("<br>") || "No weather alerts.";
    }
    if (tipsEl) {
      tipsEl.innerHTML = tipsParts.join("<br>") || "No specific clothing or skin tips.";
    }
    return;
  }

  // Fallback: shorter advice when JSON missing
  let wearText = "";
  let carryText = "";
  let alertText = "";

  const first = (Array.isArray(nextPrecipEvents) && nextPrecipEvents[0]) || null;
  const timeSuffix = first ? ` (at ${formatTimeValue(first.time)}${first.prob ? ', ' + first.prob + '%' : ''})` : "";
  if (current < 5) {
    wearText = "🧥 Heavy coat, beanie.";
    alertText = "⚠️ Icy patches possible." + timeSuffix;
  } else if (current >= 5 && current < 15) {
    wearText = "🧥 Jacket or sweater.";
    if (rain > 0) alertText = "🌧️ Wet roads likely." + timeSuffix;
  } else if (current >= 15 && current < 22) {
    wearText = "👕 Light jacket.";
    if (rain > 0) alertText = "🌧️ Bring a light waterproof." + timeSuffix;
  } else if (current >= 22 && current < 25) {
    wearText = "👕 Light layers, sunglasses.";
  } else {
    wearText = "👕 T-shirt; stay hydrated.";
    alertText = "☀️ Heat alert: drink water.";
  }

  carryText = rain > 0 ? "🌂 Bring umbrella." + timeSuffix : "🌂 No umbrella.";

  if (alertEl) {
    alertEl.innerHTML = alertText || "No weather alerts.";
  }
  if (tipsEl) {
    tipsEl.innerHTML = `${wearText}<br>${carryText}`;
  }
}

// --- 2. CURRENCY FETCH ---
async function fetchExchangeRate() {
  try {
    let response = await fetch("https://open.er-api.com/v6/latest/EUR");
    let data = await response.json();
    let rate = data.rates.INR.toFixed(2);
    console.log({rate});
    document.getElementById("eurInrRate").innerText = `₹${rate}`;
  } catch (error) {
    document.getElementById("eurInrRate").innerText = "₹90.50 (Cached)";
  }
}
fetchExchangeRate();

// --- Load structured weather advice from JSON ---
let weatherAdviceData = null;
async function loadWeatherAdvice() {
  if (weatherAdviceData) return weatherAdviceData;

  try {
    const resp = await fetch("data/weatherAdvice.json");
    if (!resp.ok) throw new Error("Failed to load JSON");
    weatherAdviceData = await resp.json();
    console.log("Loaded weather advice JSON");
    return weatherAdviceData;
  } catch (err) {
    console.warn("Could not load weatherAdvice.json, using defaults.", err);
    weatherAdviceData = null;
    return null;
  }
}

// --- 3. FITNESS CIRCUIT MANAGER LOGIC ---
let defaultExercises = [
  "Push-ups",
  "Squats",
  "Leg Raises",
  "Climbs",
  "Planks",
];
let fitnessList = JSON.parse(
  localStorage.getItem("fitnessList") || JSON.stringify(defaultExercises),
);

function renderDashboardFitnessList() {
  const container = document.getElementById("dashboardFitnessList");
  if (!container) return;
  container.innerHTML = "";

  if (fitnessList.length === 0) {
    container.innerHTML = "• No exercises in circuit.";
    return;
  }

  fitnessList.forEach((ex) => {
    const div = document.createElement("div");
    div.innerHTML = `• ${ex}`;
    container.appendChild(div);
  });
}

let supplementsList = JSON.parse(
  localStorage.getItem("supplementsList") || "[]",
);

function renderDashboardSupplementCount() {
  const countEl = document.getElementById("supplementsCountDashboard");
  const pluralEl = document.getElementById("supplementsCountPlural");
  const count = supplementsList.length;
  if (countEl) countEl.innerText = count;
  if (pluralEl) pluralEl.innerText = count === 1 ? "" : "s";
}

function renderSupplementsPage() {
  renderDashboardSupplementCount();

  const container = document.getElementById("supplementsListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (supplementsList.length === 0) {
    container.innerHTML =
      '<li style="text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">No supplements tracked yet</li>';
    return;
  }

  supplementsList.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "list-row";
    li.innerHTML = `
                <div class="list-row-left">
                    <span>${item}</span>
                </div>
                <button class="delete-item-btn" onclick="deleteSupplementItem(${index})">✕</button>
            `;
    container.appendChild(li);
  });
}

function addSupplementItem() {
  const input = document.getElementById("newSupplementInput");
  const text = input.value.trim();
  if (!text) return;

  supplementsList.push(text);
  input.value = "";
  saveSupplementsList();
  renderSupplementsPage();
}

function handleSupplementKey(event) {
  if (event.key === "Enter") {
    addSupplementItem();
  }
}

function deleteSupplementItem(index) {
  supplementsList.splice(index, 1);
  saveSupplementsList();
  renderSupplementsPage();
}

function saveSupplementsList() {
  localStorage.setItem(
    "supplementsList",
    JSON.stringify(supplementsList),
  );
}

renderDashboardSupplementCount();

function renderExerciseList() {
  const container = document.getElementById("exerciseListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (fitnessList.length === 0) {
    container.innerHTML =
      '<li style="text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">No exercises added</li>';
    return;
  }

  fitnessList.forEach((ex, index) => {
    const li = document.createElement("li");
    li.className = "list-row";
    li.innerHTML = `
                <div class="list-row-left">
                    <span>${ex}</span>
                </div>
                <button class="delete-item-btn" onclick="deleteFitnessExercise(${index})">✕</button>
            `;
    container.appendChild(li);
  });
}

function addFitnessExercise() {
  const input = document.getElementById("newExerciseInput");
  const text = input.value.trim();
  if (!text) return;

  fitnessList.push(text);
  input.value = "";
  saveFitnessList();
  renderExerciseList();
  renderDashboardFitnessList();
}

function handleExerciseKey(event) {
  if (event.key === "Enter") {
    addFitnessExercise();
  }
}

function deleteFitnessExercise(index) {
  fitnessList.splice(index, 1);
  saveFitnessList();
  renderExerciseList();
  renderDashboardFitnessList();
}

function saveFitnessList() {
  localStorage.setItem("fitnessList", JSON.stringify(fitnessList));
}

renderDashboardFitnessList();

// --- 4. SHOPPING LIST LOGIC ---
let shoppingList = loadShoppingList();

function loadShoppingList() {
  try {
    return JSON.parse(localStorage.getItem("shoppingList")) || [];
  } catch (error) {
    return [];
  }
}

function cleanAndSortShoppingList() {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  shoppingList = shoppingList.filter((item) => {
    if (!item.checked || !item.checkedAt) return true;
    return now - item.checkedAt < oneDayMs;
  });

  shoppingList.sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }
    if (a.checked && b.checked) {
      return (a.checkedAt || 0) - (b.checkedAt || 0);
    }
    return 0;
  });
}

function updateDashboardShoppingCount() {
  const uncheckedCount = shoppingList.filter(
    (item) => !item.checked,
  ).length;
  const countEl = document.getElementById("shoppingCountDashboard");
  if (countEl) {
    countEl.innerText = `${uncheckedCount} item${uncheckedCount === 1 ? "" : "s"}`;
  }
}

function renderShoppingList() {
  cleanAndSortShoppingList();
  updateDashboardShoppingCount();

  const container = document.getElementById("shoppingListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (shoppingList.length === 0) {
    container.innerHTML =
      '<li style="text-align:center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">Shopping list is empty</li>';
    return;
  }

  shoppingList.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = `list-row ${item.checked ? "checked" : ""}`;

    li.innerHTML = `
                <div class="list-row-left">
                    <input type="checkbox" ${item.checked ? "checked" : ""} onchange="toggleShoppingItem(${index})">
                    <span>${item.text}</span>
                </div>
                <button class="delete-item-btn" onclick="deleteShoppingItem(${index})">✕</button>
            `;
    container.appendChild(li);
  });
}

function addShoppingItem() {
  const input = document.getElementById("newItemInput");
  const text = input.value.trim();
  if (!text) return;

  shoppingList.push({ text: text, checked: false, checkedAt: null });
  input.value = "";
  saveShoppingList();
  renderShoppingList();
}

function handleShoppingKey(event) {
  if (event.key === "Enter") {
    addShoppingItem();
  }
}

function toggleShoppingItem(index) {
  if (!shoppingList[index]) return;
  shoppingList[index].checked = !shoppingList[index].checked;
  shoppingList[index].checkedAt = shoppingList[index].checked
    ? Date.now()
    : null;
  saveShoppingList();
  renderShoppingList();
}

function deleteShoppingItem(index) {
  shoppingList.splice(index, 1);
  saveShoppingList();
  renderShoppingList();
}

function saveShoppingList() {
  cleanAndSortShoppingList();
  localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  updateDashboardShoppingCount();
}

renderShoppingList();

// --- 5. LOCAL STORAGE & STREAK LOGIC ---
const todayKey = new Date().toISOString().slice(0, 10);

function checkDailyResets() {
  const lastActiveDate = localStorage.getItem("lastActiveDate");

  if (lastActiveDate !== todayKey) {
    if (lastActiveDate) {
      const lastDateObj = new Date(lastActiveDate);
      const currentDateObj = new Date(todayKey);
      const diffTime = Math.abs(currentDateObj - lastDateObj);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        localStorage.setItem("supplementsStreak", "0");
        localStorage.setItem("jobStreak", "0");
      }
    }

    localStorage.setItem("supplementsDone", "false");
    localStorage.setItem("fitnessDone", "false");
    localStorage.setItem("readerDone", "false");
    localStorage.setItem("jobsDoneToday", "false");
    localStorage.setItem("lastActiveDate", todayKey);
  }
}
checkDailyResets();

function completeSupplements() {
  if (localStorage.getItem("supplementsDone") !== "true") {
    localStorage.setItem("supplementsDone", "true");
    let currentStreak =
      parseInt(localStorage.getItem("supplementsStreak") || "0") + 1;
    localStorage.setItem("supplementsStreak", currentStreak);
    updateUI();
  }
}

function logJobs() {
  let inputVal = parseInt(document.getElementById("jobCountInput").value);
  if (!inputVal || inputVal <= 0) return;

  if (localStorage.getItem("jobsDoneToday") !== "true") {
    localStorage.setItem("jobsDoneToday", "true");
    let currentStreak =
      parseInt(localStorage.getItem("jobStreak") || "0") + 1;
    localStorage.setItem("jobStreak", currentStreak);
  }

  let totalJobs =
    parseInt(localStorage.getItem("totalJobsApplied") || "0") + inputVal;
  localStorage.setItem("totalJobsApplied", totalJobs);
  updateUI();
}

function completeFitness() {
  if (localStorage.getItem("fitnessDone") !== "true") {
    localStorage.setItem("fitnessDone", "true");
    let totalFitnessDays =
      parseInt(localStorage.getItem("totalFitnessDays") || "0") + 1;
    localStorage.setItem("totalFitnessDays", totalFitnessDays);
    updateUI();
  }
}

function completeReader() {
  if (localStorage.getItem("readerDone") !== "true") {
    localStorage.setItem("readerDone", "true");
    let totalReaderDays =
      parseInt(localStorage.getItem("totalReaderDays") || "0") + 1;
    localStorage.setItem("totalReaderDays", totalReaderDays);
    updateUI();
  }
}

function openObsidian() {
  try {
    window.location.href = "obsidian://open?vault=maccs";
    window.setTimeout(() => {
      window.open("https://obsidian.md", "_blank", "noopener,noreferrer");
    }, 1200);
  } catch (error) {
    window.open("https://obsidian.md", "_blank", "noopener,noreferrer");
  }
}

function updateUI() {
  const supplementsStatusEl = document.getElementById("supplementsStatus");
  if (supplementsStatusEl) {
    supplementsStatusEl.innerText =
      localStorage.getItem("supplementsDone") === "true"
        ? "Status: Taken"
        : "Status: Pending intake";
  }

  if (localStorage.getItem("supplementsDone") === "true") {
    let btn = document.getElementById("supplementsBtn");
    btn.innerText = "✓ Supplements Taken";
    btn.className = "action-btn completed";
  } else {
    let btn = document.getElementById("supplementsBtn");
    btn.innerText = "Take Supplements";
    btn.className = "action-btn";
  }

  if (localStorage.getItem("jobsDoneToday") === "true") {
    document.getElementById("jobInputSection").style.display = "none";
    document.getElementById("jobStatusMsg").style.display = "block";
  } else {
    document.getElementById("jobInputSection").style.display = "flex";
    document.getElementById("jobStatusMsg").style.display = "none";
  }

  if (localStorage.getItem("fitnessDone") === "true") {
    let btn = document.getElementById("fitnessBtn");
    btn.innerText = `✓ Circuit Completed`;
    btn.className = "action-btn completed";
  } else {
    let btn = document.getElementById("fitnessBtn");
    btn.innerText = "Mark Circuit Done";
    btn.className = "action-btn";
  }

  if (localStorage.getItem("readerDone") === "true") {
    let btn = document.getElementById("readerBtn");
    btn.innerText = "✓ Read Logged Today";
    btn.className = "action-btn completed";
  } else {
    let btn = document.getElementById("readerBtn");
    btn.innerText = "Read Today";
    btn.className = "action-btn";
  }

  let supplementStreak = localStorage.getItem("supplementsStreak") || "0";
  let jobStreak = localStorage.getItem("jobStreak") || "0";
  let totalJobs = localStorage.getItem("totalJobsApplied") || "0";

  document.getElementById("supplementsStats").innerText =
    `🔥 Streak: ${supplementStreak} days`;
  document.getElementById("jobStats").innerText =
    `Total Applied: ${totalJobs} | 🔥 Streak: ${jobStreak} days`;
  document.getElementById("fitnessStats").innerText =
    `🔥 Streak: ${localStorage.getItem("totalFitnessDays") || "0"} days`;
  document.getElementById("readerStats").innerText =
    `Tracked: ${localStorage.getItem("totalReaderDays") || "0"} / 61 days (Aug - Sept)`;
}

updateUI();

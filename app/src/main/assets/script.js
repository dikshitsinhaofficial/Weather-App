// Modern Glassmorphic Weather App Controller

const apiKey = "cb0a538cc68d4b2e4d51e2bf30c91a44";

// Global Unit and Query state
let units = "metric"; // 'metric' = °C, 'imperial' = °F
let lastQuery = { type: 'city', value: 'Delhi' }; // default fallback

// DOM Elements
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const gpsBtn = document.getElementById("gpsBtn");
const datetimeEl = document.getElementById("datetime");
const bgParticles = document.getElementById("bgParticles");
const unitToggle = document.getElementById("unitToggle");
const searchSuggestions = document.getElementById("searchSuggestions");

// States
const welcomeState = document.getElementById("welcomeState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const weatherResult = document.getElementById("weatherResult");

// Weather Fields
const cityNameEl = document.getElementById("cityName");
const countryEl = document.getElementById("country");
const tempEl = document.getElementById("temperature");
const weatherEmojiEl = document.getElementById("weatherEmoji");
const weatherDescEl = document.getElementById("weatherDesc");
const feelsLikeEl = document.getElementById("feelsLike");
const tempMaxEl = document.getElementById("tempMax");
const tempMinEl = document.getElementById("tempMin");
const humidityEl = document.getElementById("humidity");
const humidityBar = document.getElementById("humidityBar");
const windEl = document.getElementById("wind");
const compassArrow = document.getElementById("compassArrow");
const pressureEl = document.getElementById("pressure");
const visibilityEl = document.getElementById("visibility");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const aqiEl = document.getElementById("aqi");
const cloudCoverEl = document.getElementById("cloudCover");
const forecastContainer = document.getElementById("forecastContainer");

// Cache / History
let recentSearches = JSON.parse(localStorage.getItem('recent_searches')) || [];

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    generateAmbientParticles('default');
    renderSuggestions();

    // Add event listener for Enter key on search input
    cityInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            getWeather();
            searchSuggestions.style.display = "none";
        }
    });

    // Toggle units C/F
    unitToggle.addEventListener("change", () => {
        units = unitToggle.checked ? "imperial" : "metric";
        refreshWeather();
    });

    // Show suggestions on focus
    cityInput.addEventListener("focus", () => {
        if (recentSearches.length > 0) {
            renderSuggestions();
            searchSuggestions.style.display = "flex";
        }
    });

    // Dismiss suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if (!cityInput.contains(e.target) && !searchSuggestions.contains(e.target) && !gpsBtn.contains(e.target)) {
            searchSuggestions.style.display = "none";
        }
    });
});

// Update current date/time in the header
function updateDateTime() {
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    datetimeEl.textContent = new Date().toLocaleDateString('en-US', options);
}

// Search helper for Quick City chips
function searchCity(cityName) {
    cityInput.value = cityName;
    getWeather();
}

// Fetch weather from OpenWeatherMap API by City Name
async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    // Show loading, hide others
    showState(loadingState);

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== 200) {
            showError("City Not Found", `We couldn't find "${city}". Please double-check spelling.`);
            return;
        }

        // Cache last query
        lastQuery = { type: 'city', value: city };

        // Save to Local Search History
        saveToHistory(data.name);

        updateWeatherUI(data);
    } catch (error) {
        showError("Network Error", "Unable to retrieve weather data. Please check your connection.");
        console.error(error);
    }
}

// Fetch weather by Coordinates (GPS)
async function getWeatherByCoords(lat, lon) {
    showState(loadingState);
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== 200) {
            showError("GPS Error", "Failed to retrieve weather for current location.");
            return;
        }

        // Cache last query
        lastQuery = { type: 'coords', lat: lat, lon: lon };
        cityInput.value = ""; // clear input on GPS success

        updateWeatherUI(data);
    } catch (error) {
        showError("Network Error", "Unable to retrieve weather data. Please check your connection.");
        console.error(error);
    }
}

// Trigger GPS location search
function getWeatherByGPS() {
    if (!navigator.geolocation) {
        showError("GPS Not Supported", "Your browser or device does not support geolocation.");
        return;
    }

    showState(loadingState);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoords(lat, lon);
        },
        (error) => {
            let msg = "Please allow location access to use this feature.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Location permission denied.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = "Location information is unavailable.";
            } else if (error.code === error.TIMEOUT) {
                msg = "Location request timed out.";
            }
            showError("GPS Error", msg);
        },
        { timeout: 8000 }
    );
}

// Refresh weather when toggling units
function refreshWeather() {
    if (lastQuery.type === 'city') {
        getWeather();
    } else if (lastQuery.type === 'coords') {
        getWeatherByCoords(lastQuery.lat, lastQuery.lon);
    }
}

// Helper to switch view states
function showState(activeState) {
    // Hide all sections
    welcomeState.style.display = "none";
    loadingState.style.display = "none";
    errorState.style.display = "none";
    weatherResult.style.display = "none";
    weatherResult.classList.remove('show');

    // Show the requested state
    if (activeState === weatherResult) {
        weatherResult.classList.add('show');
    } else if (activeState) {
        activeState.style.display = "flex";
    }
}

// Show error messages
function showError(title, message) {
    document.getElementById("errorTitle").textContent = title;
    document.getElementById("errorMessage").textContent = message;
    showState(errorState);
}

// Format Unix Timestamp relative to the target city's timezone
function formatLocalTime(unixSeconds, timezoneOffsetSeconds) {
    const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Update the DOM with weather details
function updateWeatherUI(data) {
    // 1. Basic Information
    cityNameEl.textContent = data.name;
    countryEl.textContent = data.sys.country;
    tempEl.textContent = Math.round(data.main.temp);
    feelsLikeEl.textContent = Math.round(data.main.feels_like);
    tempMaxEl.textContent = Math.round(data.main.temp_max);
    tempMinEl.textContent = Math.round(data.main.temp_min);
    
    // Units description label
    const tempUnitLabels = document.querySelectorAll(".temp-unit");
    tempUnitLabels.forEach(el => el.textContent = units === 'metric' ? "°C" : "°F");
    
    // 2. Weather description
    const desc = data.weather[0].description;
    weatherDescEl.textContent = desc;

    // 3. Grid Metrics
    humidityEl.textContent = `${data.main.humidity}%`;
    setTimeout(() => {
        humidityBar.style.width = `${data.main.humidity}%`;
    }, 100);

    const windSpeedUnit = units === 'metric' ? 'm/s' : 'mph';
    windEl.textContent = `${data.wind.speed.toFixed(1)} ${windSpeedUnit}`;
    
    // Wind Compass
    if (data.wind.deg !== undefined) {
        compassArrow.style.transform = `rotate(${data.wind.deg}deg)`;
    } else {
        compassArrow.style.transform = `rotate(0deg)`;
    }

    pressureEl.textContent = `${data.main.pressure} hPa`;
    
    // Visibility
    const visibilityKm = data.visibility ? (data.visibility / 1000).toFixed(1) : "--";
    visibilityEl.textContent = `${visibilityKm} km`;

    // Cloud cover percentage
    cloudCoverEl.textContent = data.clouds ? `${data.clouds.all}%` : "0%";

    // Sunrise and Sunset Times
    const offset = data.timezone; // offset in seconds from UTC
    sunriseEl.textContent = formatLocalTime(data.sys.sunrise, offset);
    sunsetEl.textContent = formatLocalTime(data.sys.sunset, offset);

    // 4. Fetch 5-Day Forecast & Air Quality Pollution Index
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    fetchForecast(lat, lon);
    fetchAirQuality(lat, lon);

    // 5. Apply Background Theme
    const weatherCondition = data.weather[0].main;
    const weatherId = data.weather[0].id;
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const isNight = currentUnixTime < data.sys.sunrise || currentUnixTime > data.sys.sunset;

    applyTheme(weatherCondition, weatherId, isNight);

    // Show result container
    showState(weatherResult);
}

// Fetch 5-Day Forecast data
async function fetchForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === "200") {
            displayForecast(data);
        } else {
            forecastContainer.innerHTML = "<p class='error-msg'>Forecast unavailable</p>";
        }
    } catch (err) {
        console.error(err);
        forecastContainer.innerHTML = "<p class='error-msg'>Network error</p>";
    }
}

// Render 5-Day Forecast inside the horizontal scroll container
function displayForecast(data) {
    forecastContainer.innerHTML = "";
    
    const dailyForecasts = [];
    const seenDates = new Set();
    const todayStr = new Date().toDateString();
    
    // Filter down to 5 days (noon forecasts or first occurrences)
    for (const item of data.list) {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toDateString();
        
        if (dateStr !== todayStr && !seenDates.has(dateStr)) {
            seenDates.add(dateStr);
            dailyForecasts.push(item);
        }
        if (dailyForecasts.length >= 5) break;
    }
    
    dailyForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(item.main.temp);
        const icon = getForecastEmoji(item.weather[0].main, item.weather[0].id);
        
        const card = document.createElement("div");
        card.classList.add("forecast-card");
        card.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <span class="forecast-icon">${icon}</span>
            <span class="forecast-temp">${temp}°</span>
        `;
        forecastContainer.appendChild(card);
    });
}

function getForecastEmoji(condition, id) {
    switch (condition) {
        case 'Clear': return '☀️';
        case 'Clouds': return id === 801 ? '⛅' : '☁️';
        case 'Rain':
        case 'Drizzle': return '🌧️';
        case 'Thunderstorm': return '⛈️';
        case 'Snow': return '❄️';
        default: return '🌫️';
    }
}

// Fetch Air Quality Index from API
async function fetchAirQuality(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.list && data.list[0]) {
            const aqi = data.list[0].main.aqi;
            updateAQIUI(aqi);
        } else {
            aqiEl.textContent = "N/A";
            aqiEl.style.color = "inherit";
        }
    } catch (err) {
        console.error(err);
        aqiEl.textContent = "N/A";
        aqiEl.style.color = "inherit";
    }
}

// Update the Air Quality label with customized statuses and colors
function updateAQIUI(aqi) {
    let aqiText = "Unknown";
    let aqiColor = "inherit";

    switch (aqi) {
        case 1:
            aqiText = "Good";
            aqiColor = "#4ade80"; // Light Green
            break;
        case 2:
            aqiText = "Fair";
            aqiColor = "#a3e635"; // Lime Green
            break;
        case 3:
            aqiText = "Moderate";
            aqiColor = "#facc15"; // Yellow Gold
            break;
        case 4:
            aqiText = "Poor";
            aqiColor = "#fb923c"; // Soft Orange
            break;
        case 5:
            aqiText = "Very Poor";
            aqiColor = "#fca5a5"; // Soft Red
            break;
    }
    aqiEl.textContent = aqiText;
    aqiEl.style.color = aqiColor;
}

// Map conditions to backgrounds, icons, and particles
function applyTheme(condition, id, isNight) {
    let themeClass = 'weather-default';
    let emoji = '☀️';
    let particleType = 'default';

    // Clear theme classes on body
    document.body.className = '';

    if (isNight) {
        themeClass = 'weather-night';
        emoji = '🌙';
        particleType = 'night';
        document.body.style.background = 'var(--bg-gradient-night)';
    } else {
        switch (condition) {
            case 'Clear':
                themeClass = 'weather-clear';
                emoji = '☀️';
                particleType = 'clear';
                document.body.style.background = 'var(--bg-gradient-clear)';
                break;
            case 'Clouds':
                themeClass = 'weather-clouds';
                emoji = id === 801 ? '⛅' : '☁️';
                particleType = 'clouds';
                document.body.style.background = 'var(--bg-gradient-clouds)';
                break;
            case 'Rain':
            case 'Drizzle':
                themeClass = 'weather-rain';
                emoji = '🌧️';
                particleType = 'rain';
                document.body.style.background = 'var(--bg-gradient-rain)';
                break;
            case 'Thunderstorm':
                themeClass = 'weather-thunderstorm';
                emoji = '⛈️';
                particleType = 'thunderstorm';
                document.body.style.background = 'var(--bg-gradient-thunderstorm)';
                break;
            case 'Snow':
                themeClass = 'weather-snow';
                emoji = '❄️';
                particleType = 'snow';
                document.body.style.background = 'var(--bg-gradient-snow)';
                break;
            default:
                themeClass = 'weather-clouds';
                emoji = '🌫️';
                particleType = 'mist';
                document.body.style.background = 'var(--bg-gradient-clouds)';
                break;
        }
    }

    document.body.classList.add(themeClass);
    weatherEmojiEl.textContent = emoji;

    // Generate particles
    generateAmbientParticles(particleType);
}

// Generate animated background particles dynamically based on current weather condition
function generateAmbientParticles(type) {
    bgParticles.innerHTML = '';
    const particleCount = type === 'rain' || type === 'snow' ? 50 : 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        particle.style.left = `${Math.random() * 100}vw`;
        
        const duration = 5 + Math.random() * 15;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * -20}s`;

        if (type === 'rain' || type === 'thunderstorm') {
            particle.style.width = '1.5px';
            particle.style.height = `${15 + Math.random() * 15}px`;
            particle.style.background = 'rgba(156, 163, 175, 0.4)';
            particle.style.borderRadius = '0';
            particle.style.transform = 'rotate(15deg)';
            particle.style.animationName = 'fallRain';
        } else if (type === 'snow') {
            const size = 3 + Math.random() * 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = 'rgba(255, 255, 255, 0.8)';
            particle.style.borderRadius = '50%';
            particle.style.filter = 'blur(1px)';
            particle.style.animationName = 'fallSnow';
        } else if (type === 'night') {
            const size = 1 + Math.random() * 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = '#ffffff';
            particle.style.boxShadow = '0 0 4px #ffffff';
            particle.style.animationName = 'twinkleStar';
            particle.style.top = `${Math.random() * 80}vh`;
        } else {
            const size = 20 + Math.random() * 60;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = type === 'clear' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.05)';
            particle.style.filter = 'blur(10px)';
            particle.style.animationName = 'floatParticle';
        }

        bgParticles.appendChild(particle);
    }
}

// Search History autocomplete functions
function saveToHistory(cityName) {
    recentSearches = recentSearches.filter(c => c.toLowerCase() !== cityName.toLowerCase());
    recentSearches.unshift(cityName);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem('recent_searches', JSON.stringify(recentSearches));
    renderSuggestions();
}

function removeFromHistory(cityName) {
    recentSearches = recentSearches.filter(c => c !== cityName);
    localStorage.setItem('recent_searches', JSON.stringify(recentSearches));
    renderSuggestions();
    
    if (recentSearches.length === 0) {
        searchSuggestions.style.display = "none";
    }
}

function renderSuggestions() {
    searchSuggestions.innerHTML = "";
    if (recentSearches.length === 0) {
        searchSuggestions.style.display = "none";
        return;
    }

    recentSearches.forEach(city => {
        const item = document.createElement("div");
        item.classList.add("suggestion-item");

        const textDiv = document.createElement("div");
        textDiv.classList.add("suggestion-text");
        textDiv.innerHTML = `<span>⏳</span><span>${city}</span>`;

        const clearBtn = document.createElement("span");
        clearBtn.classList.add("suggestion-remove");
        clearBtn.textContent = "Clear";
        clearBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFromHistory(city);
        });

        item.appendChild(textDiv);
        item.appendChild(clearBtn);

        item.addEventListener("click", () => {
            cityInput.value = city;
            searchSuggestions.style.display = "none";
            getWeather();
        });

        searchSuggestions.appendChild(item);
    });
}

// Inject keyframes for custom animations at runtime if not present
if (!document.getElementById('ambientAnimations')) {
    const style = document.createElement('style');
    style.id = 'ambientAnimations';
    style.innerHTML = `
        @keyframes fallRain {
            0% { transform: translateY(-50px) translateX(0) rotate(15deg); opacity: 0; }
            10% { opacity: 0.7; }
            90% { opacity: 0.7; }
            100% { transform: translateY(105vh) translateX(100px) rotate(15deg); opacity: 0; }
        }
        @keyframes fallSnow {
            0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { transform: translateY(105vh) translateX(50px) rotate(360deg); opacity: 0; }
        }
        @keyframes twinkleStar {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
}
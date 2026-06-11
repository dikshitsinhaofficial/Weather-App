// Modern Glassmorphic Weather App Controller

const apiKey = "cb0a538cc68d4b2e4d51e2bf30c91a44";

// DOM Elements
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const datetimeEl = document.getElementById("datetime");
const bgParticles = document.getElementById("bgParticles");

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

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    generateAmbientParticles('default');

    // Add event listener for Enter key on search input
    cityInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            getWeather();
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

// Fetch weather from OpenWeatherMap API
async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    // Show loading, hide others
    showState(loadingState);

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== 200) {
            showError("City Not Found", `We couldn't find "${city}". Please double-check spelling.`);
            return;
        }

        updateWeatherUI(data);
    } catch (error) {
        showError("Network Error", "Unable to retrieve weather data. Please check your connection.");
        console.error(error);
    }
}

// Helper to switch view states
function showState(activeState) {
    welcomeState.style.display = "none";
    loadingState.style.display = "none";
    errorState.style.display = "none";
    weatherResult.style.display = "none";

    if (activeState === weatherResult) {
        activeState.style.display = "flex";
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
    // Offset is in seconds. JS Date uses ms, so we shift timestamp directly
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
    
    // 2. Weather description
    const desc = data.weather[0].description;
    weatherDescEl.textContent = desc;

    // 3. Grid Metrics
    humidityEl.textContent = `${data.main.humidity}%`;
    // Update progress bar
    setTimeout(() => {
        humidityBar.style.width = `${data.main.humidity}%`;
    }, 100);

    windEl.textContent = `${data.wind.speed.toFixed(1)} m/s`;
    
    // Wind Direction Compass Arrow
    if (data.wind.deg !== undefined) {
        compassArrow.style.transform = `rotate(${data.wind.deg}deg)`;
    } else {
        compassArrow.style.transform = `rotate(0deg)`;
    }

    pressureEl.textContent = `${data.main.pressure} hPa`;
    
    // Visibility (convert meters to km)
    const visibilityKm = data.visibility ? (data.visibility / 1000).toFixed(1) : "--";
    visibilityEl.textContent = `${visibilityKm} km`;

    // Local Sunrise and Sunset
    const offset = data.timezone; // offset in seconds from UTC
    sunriseEl.textContent = formatLocalTime(data.sys.sunrise, offset);
    sunsetEl.textContent = formatLocalTime(data.sys.sunset, offset);

    // 4. Set theme background gradient and emojis
    const weatherCondition = data.weather[0].main;
    const weatherId = data.weather[0].id;
    
    // Determine day or night in the local city timezone
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const isNight = currentUnixTime < data.sys.sunrise || currentUnixTime > data.sys.sunset;

    applyTheme(weatherCondition, weatherId, isNight);

    // Show result container
    showState(weatherResult);
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
                // Handle different clouds levels
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
                // Atmosphere (Mist, Smoke, Haze, Dust, Fog, Sand, Ash, Squall, Tornado)
                themeClass = 'weather-clouds';
                emoji = '🌫️';
                particleType = 'mist';
                document.body.style.background = 'var(--bg-gradient-clouds)';
                break;
        }
    }

    document.body.classList.add(themeClass);
    weatherEmojiEl.textContent = emoji;

    // Generate weather specific particle effects
    generateAmbientParticles(particleType);
}

// Generate animated background particles dynamically based on current weather condition
function generateAmbientParticles(type) {
    bgParticles.innerHTML = '';
    const particleCount = type === 'rain' || type === 'snow' ? 50 : 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random placement
        particle.style.left = `${Math.random() * 100}vw`;
        
        // Random delays and durations
        const duration = 5 + Math.random() * 15;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * -20}s`;

        // Styling based on particle type
        if (type === 'rain' || type === 'thunderstorm') {
            particle.style.width = '1.5px';
            particle.style.height = `${15 + Math.random() * 15}px`;
            particle.style.background = 'rgba(156, 163, 175, 0.4)';
            particle.style.borderRadius = '0';
            particle.style.transform = 'rotate(15deg)'; // falling diagonally
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
            // Tiny shining stars
            const size = 1 + Math.random() * 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = '#ffffff';
            particle.style.boxShadow = '0 0 4px #ffffff';
            particle.style.animationName = 'twinkleStar';
            particle.style.top = `${Math.random() * 80}vh`; // keep on upper screen
        } else {
            // General floating warm/cool bubbles
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
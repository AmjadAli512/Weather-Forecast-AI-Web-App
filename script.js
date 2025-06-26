const apiKey = 'ba88c7388d50e619933e7654f527d38b'; 
const weatherApiBase = 'https://api.openweathermap.org/data/2.5';
const units = 'metric';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const micBtn = document.getElementById('micBtn');
const locateBtn = document.getElementById('locateBtn');

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherData('city', city);
});

micBtn.addEventListener('click', startVoiceRecognition);
locateBtn.addEventListener('click', getDeviceLocation);

// ✅ Main Weather Fetch + AI Trigger
async function fetchWeatherData(type, ...args) {
    try {
        let url = '';

        if (type === 'city') {
            url = `weather.php?city=${encodeURIComponent(args[0])}`;
        } else {
            const [lat, lon] = args;
            url = `weather.php?lat=${lat}&lon=${lon}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        updateCurrentWeather(data.weather);
        updateForecast(data.forecast);

        // ✅ Auto Ask AI
        sendToAI(data.summary.city, {
            current: data.weather,
            forecast: data.forecast.list.slice(0, 8)
        });

    } catch (error) {
        showError('Something went wrong while fetching weather data.');
    }
}

function updateCurrentWeather(data) {
    const currentWeather = document.getElementById('currentWeather');
    currentWeather.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <div class="temp-container">
            <i class="${getWeatherIcon(data.weather[0].id)} weather-icon"></i>
            <div class="temp-details">
                <p class="current-temp">${Math.round(data.main.temp)}°C</p>
                <p class="feels-like">Feels like ${Math.round(data.main.feels_like)}°C</p>
            </div>
        </div>
        <p class="condition">${data.weather[0].description}</p>
        <div class="additional-info">
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Wind: ${data.wind.speed} m/s</p>
        </div>
    `;
}

function updateForecast(data) {
    const hourly = data.list.slice(0, 8);
    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    updateHourlyForecast(hourly);
    updateDailyForecast(daily);
}

function updateHourlyForecast(data) {
    document.getElementById('hourlyForecast').innerHTML = data.map(hour => `
        <div class="forecast-card">
            <p>${formatAMPM(new Date(hour.dt * 1000))}</p>
            <i class="${getWeatherIcon(hour.weather[0].id)}"></i>
            <p>${Math.round(hour.main.temp)}°C</p>
        </div>
    `).join('');
}

function updateDailyForecast(data) {
    document.getElementById('dailyForecast').innerHTML = data.map(day => `
        <div class="forecast-card">
            <p>${new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</p>
            <i class="${getWeatherIcon(day.weather[0].id)}"></i>
            <p>${Math.round(day.main.temp)}°C</p>
        </div>
    `).join('');
}

function getWeatherIcon(id) {
    if (id >= 200 && id < 300) return 'fas fa-bolt';
    if (id >= 300 && id < 600) return 'fas fa-cloud-rain';
    if (id >= 600 && id < 700) return 'fas fa-snowflake';
    if (id >= 700 && id < 800) return 'fas fa-smog';
    if (id === 800) return 'fas fa-sun';
    if (id > 800) return 'fas fa-cloud';
    return 'fas fa-question';
}

function formatAMPM(date) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:00 ${ampm}`;
}

function startVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            cityInput.value = transcript;
            fetchWeatherData('city', transcript);
        };
        recognition.onerror = () => alert('Voice recognition failed');
    } else {
        alert('Speech recognition not supported in this browser');
    }
}

function getDeviceLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => fetchWeatherData('coords', position.coords.latitude, position.coords.longitude),
            () => alert('Location access denied')
        );
    } else {
        alert('Geolocation not supported');
    }
}

// ✅ AI Prompt Function
function sendToAI(userCity, weatherData) {
    const forecastSummary = weatherData.forecast
        .map(item => {
            const date = new Date(item.dt * 1000);
            return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${formatAMPM(date)}: ${item.weather[0].description}, ${Math.round(item.main.temp)}°C`;
        }).join('; ');

    const prompt = `User asked about weather in ${userCity}. Current weather is ${weatherData.current.weather[0].description} with ${Math.round(weatherData.current.main.temp)}°C. Forecast: ${forecastSummary}. Suggest if it's suitable for hiking or not.`;

    document.getElementById('aiResponse').innerText = 'Thinking...';

    fetch('ai.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt })
    })
    .then(res => res.json())
    .then(data => {
        const response = data.response?.trim();
        if (response && !response.toLowerCase().includes("error")) {
            document.getElementById('aiResponse').innerText = response;
        } else {
            showDefaultAIMessage();
        }
    })
    .catch(() => {
        showDefaultAIMessage();
    });
}

function showDefaultAIMessage() {
    document.getElementById('aiResponse').innerText =
        "Based on current weather, you should use your own judgment before planning outdoor activities.";
}

function handleUserQuestion() {
    const question = cityInput.value.trim(); // You can use another input if needed
    if (!question) {
        document.getElementById('aiResponse').innerText = 'Please ask a valid question.';
        return;
    }

    document.getElementById('aiResponse').innerText = 'Thinking...';

    fetch('ai.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question })
    })
    .then(res => res.json())
    .then(data => {
        console.log('User AI response:', data);
        document.getElementById('aiResponse').innerText = data.response || 'No AI response';
    })
    .catch(error => {
        console.error('AI fetch error:', error);
        document.getElementById('aiResponse').innerText = 'AI service failed.';
    });
}

function showError(message) {
    document.getElementById('aiResponse').innerText = `Error: ${message}`;
}

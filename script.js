// Ultimate 3D Weather app using Open-Meteo (no API key needed).
// Flow: city name -> geocoding -> current weather with 3D effects.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('searchForm');
  const cityInput = document.getElementById('cityInput');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const card = document.querySelector('.card');
  const flipBackBtn = document.getElementById('flipBack');
  const searchBtn = document.getElementById('searchBtn');

  const cityNameEl = document.getElementById('cityName');
  const countryNameEl = document.getElementById('countryName');
  const tempNowEl = document.getElementById('tempNow');
  const feelsLikeEl = document.getElementById('feelsLike');
  const windEl = document.getElementById('wind');
  const humidityEl = document.getElementById('humidity');
  const emojiEl = document.getElementById('emoji');
  const descriptionEl = document.getElementById('description');
  const weatherIcon = document.getElementById('weatherIcon');

  // Create animated particles background
  createParticles();

  // Add 3D tilt effect to card
  initCardTilt();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = cityInput.value.trim();
    if(!query) return;
    
    // Add loading animation to button
    searchBtn.classList.add('loading');
    searchBtn.innerHTML = '<span class="btn-text">Searching...</span>';
    
    resultEl.hidden = true;
    setStatus(`Searching "${query}"...`);
    
    try{
      const loc = await fetchLocation(query);
      if(!loc){
        setStatus('City not found. Try another name.');
        resetButton();
        return;
      }
      const weather = await fetchWeather(loc.latitude, loc.longitude);
      if(!weather){
        setStatus('Weather data unavailable. Try again.');
        resetButton();
        return;
      }
      renderWeather(loc, weather);
      clearStatus();
      
      // Flip card to show results
      setTimeout(() => {
        card.classList.add('flipped');
        resetButton();
      }, 800);
    } catch(err){
      console.error(err);
      setStatus('Something went wrong. Please try again.');
      resetButton();
    }
  });

  // Flip back to search
  flipBackBtn.addEventListener('click', () => {
    card.classList.remove('flipped');
    cityInput.focus();
  });

  function resetButton() {
    searchBtn.classList.remove('loading');
    searchBtn.innerHTML = '<span class="btn-text">Get Weather</span>';
  }

  function setStatus(msg){
    statusEl.textContent = msg;
    statusEl.style.opacity = '1';
  }
  
  function clearStatus(){
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 300);
  }

  async function fetchLocation(name){
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if(!data.results || data.results.length === 0) return null;
    const loc = data.results[0];
    return {
      name: loc.name,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude
    };
  }

  async function fetchWeather(lat, lon){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Weather API failed');
    const data = await res.json();
    if(!data.current_weather) return null;

    // Get current humidity from hourly data (index 0 is current hour)
    let humidity = null;
    if(data.hourly && data.hourly.relativehumidity_2m && data.hourly.relativehumidity_2m.length > 0){
      // Use the first value which represents the current hour
      humidity = data.hourly.relativehumidity_2m[0];
    }

    return {
      temp: data.current_weather.temperature,
      wind: data.current_weather.windspeed,
      code: data.current_weather.weathercode,
      humidity
    };
  }

  function renderWeather(loc, w){
    cityNameEl.textContent = loc.name;
    countryNameEl.textContent = loc.country || '';
    tempNowEl.textContent = Math.round(w.temp ?? 0);
    // "feels like" = temp +/- small factor from wind (simple approximation)
    const feels = w.temp - (w.wind || 0) * 0.03;
    feelsLikeEl.textContent = `${Math.round(feels)} °C`;
    windEl.textContent = w.wind != null ? `${Math.round(w.wind)} km/h` : '--';
    // Handle humidity display more robustly
    if (w.humidity !== null && w.humidity !== undefined) {
      humidityEl.textContent = `${Math.round(w.humidity)} %`;
    } else {
      humidityEl.textContent = '-- %';
    }

    const desc = mapCodeToText(w.code);
    descriptionEl.textContent = desc.text;
    emojiEl.textContent = desc.emoji;

    // Add animation to weather icon
    weatherIcon.classList.add('animate');
    setTimeout(() => {
      weatherIcon.classList.remove('animate');
    }, 1000);

    resultEl.hidden = false;
  }

  function mapCodeToText(code){
    // Simple mapping based on Open-Meteo weather codes
    if(code === 0) return { text:'Clear sky', emoji:'☀️' };
    if([1,2].includes(code)) return { text:'Partly cloudy', emoji:'⛅' };
    if(code === 3) return { text:'Overcast', emoji:'☁️' };
    if([45,48].includes(code)) return { text:'Foggy', emoji:'🌫️' };
    if([51,53,55,56,57].includes(code)) return { text:'Drizzle', emoji:'🌦️' };
    if([61,63,65,66,67].includes(code)) return { text:'Rain', emoji:'🌧️' };
    if([71,73,75,77].includes(code)) return { text:'Snow', emoji:'❄️' };
    if([80,81,82].includes(code)) return { text:'Rain showers', emoji:'🌦️' };
    if([95,96,99].includes(code)) return { text:'Thunderstorm', emoji:'⛈️' };
    return { text:'Weather data', emoji:'🌍' };
  }

  // Create animated particles background
  function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random properties
      const size = Math.random() * 20 + 5;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = Math.random() * 20 + 15;
      const hue = Math.random() * 30 + 190; // Blue tones
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.background = `hsla(${hue}, 80%, 70%, ${Math.random() * 0.4 + 0.2})`;
      
      particlesContainer.appendChild(particle);
    }
  }

  // Initialize 3D tilt effect for card
  function initCardTilt() {
    const cardElement = document.querySelector('.glass-card');
    
    if (!cardElement) return;
    
    cardElement.addEventListener('mousemove', (e) => {
      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateY = (x - centerX) / 25;
      const rotateX = (centerY - y) / 25;
      
      cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    cardElement.addEventListener('mouseleave', () => {
      cardElement.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  }
});

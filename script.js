const weatherApp = {};
weatherApp.weatherURL = 'https://api.open-meteo.com/v1/forecast';
weatherApp.geolocationURL = 'https://services.grassriots.io/';

weatherApp.geolocateUser = async function() {
  try {
    const response = await fetch(weatherApp.geolocationURL);
    if (!response.ok) {
      throw new Error('Network response from fetching geolocationURL was not ok:' + response.statusText);
    }

    const data = await response.json();
    if (!data.data || !data.data.lat || !data.data.lng) {
      throw new Error('Invalid data received from geolocationURL');
    } 
    const isocode = data.data.isocode;
    const region = data.data.englishRegionName;
    const city = data.data.city;
    const lat = data.data.lat;
    const long = data.data.lng;
    const { todaysDate, endDate } = weatherApp.getDates();

    weatherApp.getTheWeather(lat, long, todaysDate, endDate, isocode, region, city);
  } catch (error) {
    console.error('Error fetching users coordinates:', error);
  }
}

weatherApp.getDates = function() {
  let today = new Date();
  let d = String(today.getDate()).padStart(2, '0');
  let m = String(today.getMonth() + 1).padStart(2, '0');
  let y = today.getFullYear();
  todaysDate = y + '-' + m + '-' + d;

  let endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  d = String(endDate.getDate()).padStart(2, '0');
  m = String(endDate.getMonth() + 1).padStart(2, '0');
  y = endDate.getFullYear();
  endDate = y + '-' + m + '-' + d;

  return { todaysDate, endDate };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const date = new Date(timeString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let meridiem = hours >= 12 ? 'PM' : 'AM';

    // convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return hours + ':' + formattedMinutes + meridiem;
}

// passing isocode variable here incase i have time to display hourly forecast on frontend
weatherApp.getTheWeather = async function(lat, long, todaysDate, endDate, isocode, region, city) {
  console.log(todaysDate, 'todays date')

  try {
    weatherApp.showLoadingAnimation();
    const newWeatherURL = new URL(weatherApp.weatherURL);
    newWeatherURL.searchParams.set('latitude', lat);
    newWeatherURL.searchParams.set('longitude', long);
    newWeatherURL.searchParams.set('temperature_unit', 'celsius');
    newWeatherURL.searchParams.set('wind_speed_unit', 'mph');
    newWeatherURL.searchParams.set('precipitation_unit', 'mm');
    newWeatherURL.searchParams.set('start_date', todaysDate);
    newWeatherURL.searchParams.set('end_date', endDate);
    newWeatherURL.searchParams.set('timezone', 'auto');
    newWeatherURL.searchParams.set('current', ['temperature', 'apparent_temperature', 'cloud_cover', 'precipitation_probability']);
    newWeatherURL.searchParams.set('daily', ['weather_code', 'apparent_temperature_max', 'apparent_temperature_min', 'precipitation_probability_mean', 'sunrise', 'sunset', 'wind_speed_10m_max', 'wind_speed_10m_min']);


    const response = await fetch(newWeatherURL);
    if (!response.ok) {
      throw new Error('Network response from fetching newWeatherURL was not ok:' + response.statusText);
    }

    const data = await response.json();
    if (!data) {
      throw new Error('Invalid data received from newWeatherURL');
    } 
    weatherApp.hideLoadingAnimation(); 
    // leaving this console.log here purposely as part of demonstrating my process
    console.log('Weather data:', data);
    weatherApp.displayWeather(data, city, region);

  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

weatherApp.showLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'block';
  }
}

weatherApp.hideLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');
  const weatherContainer = document.querySelector('#weatherContainer');

  if (loadingSpinner) {
    // apply fade-out animation of the loading spinner
    loadingSpinner.style.transition = 'opacity 0.5s ease';
    loadingSpinner.style.opacity = '0';

    // hide the spinner after the animation ends
    setTimeout(() => {
      loadingSpinner.style.display = 'none';

      if (weatherContainer) {
        weatherContainer.style.opacity = '0';
        weatherContainer.style.display = 'block';
        // apple fade-in animation of the weather container itself 
        weatherContainer.style.transition = 'opacity 0.5s ease';
        weatherContainer.style.opacity = '1';
      }
    }, 500);
  }
}

weatherApp.displayWeather = function(data, city, region) {
  // this is where we're going to write code that makes the variables passed/data fetched display on the front end
  const h1El = document.querySelector('h1');
  const timeEl = document.querySelector('time');
  const temperatureEl = document.querySelector('#temp');
  const highEl = document.querySelector('#high');
  const windEl = document.querySelector('#wind');
  const sunriseEl = document.querySelector('#sunrise');
  const lowEl = document.querySelector('#low');
  const rainEl = document.querySelector('#rain');
  const sunsetEl = document.querySelector('#sunset');

  let formattedDateData = formatDate(todaysDate);
  let formattedSunriseTime = formatTime(data.daily.sunrise[0]);
  let formattedSunsetTime = formatTime(data.daily.sunset[0]);
  let tempData = data.current.apparent_temperature;
  let tempDataUnit = data.current_units.apparent_temperature;
  let tempMaxData = data.daily.apparent_temperature_max[0];
  let tempLowData = data.daily.apparent_temperature_min[0];
  let windDailyData = data.daily.wind_speed_10m_max[0];
  let windDailyDataUnit = data.daily_units.wind_speed_10m_max;
  let rainData = data.daily.precipitation_probability_mean[0];
  let rainDataUnits = data.daily_units.precipitation_probability_mean;


  if (h1El) h1El.innerText = `${city}, ${region}`;
  if (timeEl) {
    timeEl.innerText = `${formattedDateData}`;
    timeEl.setAttribute('datetime', todaysDate);
  }
  if (temperatureEl) temperatureEl.innerText = `${tempData}${tempDataUnit}`;
  if (highEl) highEl.innerText = `${tempMaxData}${tempDataUnit}`;
  if (windEl) windEl.innerText = `${windDailyData}` + ' ' + `${windDailyDataUnit}`;
  if (sunriseEl) sunriseEl.innerText = `${formattedSunriseTime}`;
  if (lowEl) lowEl.innerText = `${tempLowData}${tempDataUnit}`;
  if (rainEl) rainEl.innerText = `${rainData}${rainDataUnits}`;
  if (sunsetEl) sunsetEl.innerText = `${formattedSunsetTime}`;
}

weatherApp.init = function() {
  weatherApp.geolocateUser();
}

weatherApp.init();
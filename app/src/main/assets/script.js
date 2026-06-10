async function getWeather() {
    let city = document.getElementById("city").value;
    
    let apiKey = "cb0a538cc68d4b2e4d51e2bf30c91a44"; 

    let url= `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    let response = await fetch(url);

    let data= await response.json();

    if (data.cod != 200) {

        document.getElementById("result").innerHTML =
        "Error: " + data.message;

        return;
    }
    document.getElementById("result").innerHTML=`
        <h2>${data.name}</h2>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Weather: ${data.weather[0].main}</p>
        <p>Humidity: ${data.main.humidity}%</p>`
    ;
}
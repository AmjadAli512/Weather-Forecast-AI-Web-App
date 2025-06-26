<?php
header('Content-Type: application/json');

$apiKey = 'ba88c7388d50e619933e7654f527d38b';

$city = $_GET['city'] ?? null;
$lat = $_GET['lat'] ?? null;
$lon = $_GET['lon'] ?? null;

$base = 'https://api.openweathermap.org/data/2.5/';
$units = 'metric';

if ($city) {
    $weatherUrl = "{$base}weather?q=" . urlencode($city) . "&units={$units}&appid={$apiKey}";
    $forecastUrl = "{$base}forecast?q=" . urlencode($city) . "&units={$units}&appid={$apiKey}";
} elseif ($lat && $lon) {
    $weatherUrl = "{$base}weather?lat={$lat}&lon={$lon}&units={$units}&appid={$apiKey}";
    $forecastUrl = "{$base}forecast?lat={$lat}&lon={$lon}&units={$units}&appid={$apiKey}";
} else {
    echo json_encode(['error' => 'No city or coordinates provided']);
    exit;
}

$weather = @file_get_contents($weatherUrl);
$forecast = @file_get_contents($forecastUrl);

if (!$weather || !$forecast) {
    echo json_encode(['error' => 'Failed to fetch weather data.']);
    exit;
}

$weatherData = json_decode($weather, true);
$forecastData = json_decode($forecast, true);

echo json_encode([
    'weather' => $weatherData,
    'forecast' => $forecastData,
    'summary' => [
        'temp' => $weatherData['main']['temp'] ?? null,
        'condition' => $weatherData['weather'][0]['description'] ?? '',
        'city' => $weatherData['name'] ?? $city
    ]
]);
?>

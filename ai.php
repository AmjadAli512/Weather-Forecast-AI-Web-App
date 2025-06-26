<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$question = $data['question'] ?? '';

if (empty($question)) {
    echo json_encode(['response' => 'No question provided.']);
    exit;
}

$apiKey = 'ba88c7388d50e619933e7654f527d38b'; // Your OpenAI API key here

$payload = [
    'model' => 'gpt-3.5-turbo',
    'messages' => [
        ['role' => 'system', 'content' => 'You help users with weather-based activity decisions.'],
        ['role' => 'user', 'content' => $question]
    ]
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(['response' => 'Curl error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

$result = json_decode($response, true);
$reply = $result['choices'][0]['message']['content'] ?? 'AI response error.';

echo json_encode(['response' => $reply]);
?>

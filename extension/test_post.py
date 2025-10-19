import requests

ENDPOINT_URL = 'https://li9e1bovvb.execute-api.us-east-1.amazonaws.com/Prod/AnalyzeOneLog'

# Correct payload assuming your model expects messages structure:
payload = {
    "messages": [
        {
            "role": "user",
            "content": [
                { "text": "Method: GET, URL: https://example.com/api/test, Body: N/A, Timestamp: 2025-10-19T14:00:00Z" }
            ]
        }
    ]
}

response = requests.post(ENDPOINT_URL, json=payload)
print("Status code:", response.status_code)
print("Response body:", response.text)

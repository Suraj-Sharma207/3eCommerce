import os
import requests

api_key = os.environ.get('GEMINI_API_KEY', 'AQ.Ab8RN6LHfhCSfV7KhIZrUcftrMS00-spZVJLQOE-qb1Xy4sj-A')
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
print(response.json())

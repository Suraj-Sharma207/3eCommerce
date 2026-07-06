import urllib.request
import time
import json

def test():
    req = urllib.request.Request(
        "http://localhost:8000/chat",
        data=json.dumps({"message": "hii"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    start = time.time()
    try:
        with urllib.request.urlopen(req) as f:
            resp = f.read()
        print(f"Request took {time.time() - start:.4f}s")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    for i in range(3):
        test()

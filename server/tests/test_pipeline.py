import requests
import os
import sys

# 1. Configuration
NODE_URL = "http://localhost:3001/api/scan/upload"
IMAGE_PATH = "test_leaf.jpg"

def test_cropguard_pipeline():
    print(f"🚀 Starting Test (Running from: {os.getcwd()})")
    
    # Check if image exists before even trying the network
    if not os.path.exists(IMAGE_PATH):
        print(f"❌ ERROR: File '{IMAGE_PATH}' not found in this folder!")
        return

    try:
        print(f"📡 Pinging Express at {NODE_URL}...")
        
        with open(IMAGE_PATH, "rb") as img:
            files = {"image": (IMAGE_PATH, img, "image/jpeg")}
            data = {"cropType": "Cassava"}

            # Increased timeout to 30s because Gemini + FastAPI can take a moment
            response = requests.post(NODE_URL, files=files, data=data, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print("✅ PIPELINE SUCCESS!")
            # Using .get() to prevent crashes if keys are slightly different
            data_res = result.get('data', {})
            print(f"🆔 Scan ID: {data_res.get('id')}")
            print(f"🦠 Custom Model: {data_res.get('detectedDisease')}")
            print(f"💡 Gemini Advice: {data_res.get('diseaseDescription', '')[:100]}...")
        else:
            print(f"❌ SERVER ERROR: {response.status_code}")
            print(f"📝 Message: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Is your Express server (Port 3001) running?")
    except Exception as e:
        print(f"⚠️ UNEXPECTED ERROR: {str(e)}")

if __name__ == "__main__":
    test_cropguard_pipeline()
    print("🏁 Test Finished.")
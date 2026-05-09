"""
CropGuard Python AI Backend — MobileNetV3-Small disease classifier
Run with:  uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
import os

app = FastAPI(title="CropGuard AI — Disease Detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Must match your training dataset folder order exactly
# Updated to match the training script
CLASS_NAMES = [
    'Bean_angular_leaf_spot', 'Bean_healthy', 'Bean_rust',
    'Cassava_Bacterial_Blight', 'Cassava_Brown_Streak_Disease',
    'Cassava_Green_Mottle', 'Cassava_Healthy', 'Cassava_Mosaic_Disease',
    'Corn_Common_rust', 'Corn_healthy',
    'Potato_Early_blight', 'Potato_healthy', 'Potato_Late_blight',
    'Tomato_Early_blight', 'Tomato_healthy', 'Tomato_Late_blight'
]

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

model = models.mobilenet_v3_small(weights=None)
num_ftrs = model.classifier[3].in_features
model.classifier[3] = torch.nn.Linear(num_ftrs, len(CLASS_NAMES))

MODEL_PATH = os.getenv("MODEL_PATH", "cropguard_model_v1.pth")

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()
    print(f"✅ Model loaded from {MODEL_PATH}")
else:
    print(f"⚠️  WARNING: {MODEL_PATH} not found — predictions will fail.")

@app.get("/")
def home():
    return {"status": "CropGuard AI online", "classes": len(CLASS_NAMES)}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        data       = await file.read()
        img        = Image.open(io.BytesIO(data)).convert("RGB")
        img_tensor = TRANSFORM(img).unsqueeze(0)

        with torch.no_grad():
            output        = model(img_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, prediction = torch.max(probabilities, 0)

        return {
            "disease":    CLASS_NAMES[prediction.item()],
            "confidence": f"{confidence.item() * 100:.2f}%",
            "status":     "success",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
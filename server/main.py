"""
CropGuard Python AI Backend — MobileNetV3-Small Disease Classifier
================================================================
Purpose: Provide AI-powered crop disease detection API for the CropGuard platform.
        Uses a pre-trained MobileNetV3-Small model fine-tuned on crop disease images.

Model Architecture: MobileNetV3-Small (lightweight, efficient for deployment)
Input Size: 224x224 pixels
Supported Crops: Bean, Cassava, Corn, Potato, Tomato
Disease Classes: 16 (including healthy states)

Run with: uvicorn main:app --reload --port 8000
Deployment: Hugging Face Spaces (free tier, auto-scaling)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
import os

# =============================================================================
# FastAPI Application Setup
# =============================================================================

# Initialize FastAPI app with metadata for API documentation
app = FastAPI(title="CropGuard AI — Disease Detection")

# Allow cross-origin requests from any domain (required for frontend integration)
# In production, you'd restrict this to your specific frontend URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins (dev-friendly)
    allow_methods=["*"],           # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],           # Allow all headers
)

# =============================================================================
# Model Configuration
# =============================================================================

# Disease class names - must match the training dataset folder order exactly
# When we trained the model, we organized images in folders with these names
# The model outputs index numbers that map to these classes
CLASS_NAMES = [
    # Bean diseases (3 classes)
    'Bean_angular_leaf_spot',      # Angular leaf spot on bean leaves
    'Bean_healthy',                 # Healthy bean plant
    'Bean_rust',                    # Rust disease on beans
    
    # Cassava diseases (5 classes)
    'Cassava_Bacterial_Blight',     # Bacterial blight on cassava
    'Cassava_Brown_Streak_Disease', # Brown streak virus
    'Cassava_Green_Mottle',         # Green mottle virus
    'Cassava_Healthy',              # Healthy cassava plant
    'Cassava_Mosaic_Disease',       # Mosaic virus (common in East Africa)
    
    # Corn diseases (2 classes)
    'Corn_Common_rust',             # Common rust on corn leaves
    'Corn_healthy',                 # Healthy corn plant
    
    # Potato diseases (3 classes)
    'Potato_Early_blight',          # Early blight on potato leaves
    'Potato_healthy',               # Healthy potato plant
    'Potato_Late_blight',           # Late blight (historically caused Irish famine)
    
    # Tomato diseases (3 classes)
    'Tomato_Early_blight',          # Early blight on tomato leaves
    'Tomato_healthy',               # Healthy tomato plant
    'Tomato_Late_blight'            # Late blight on tomatoes
]

# Image preprocessing pipeline
# Images must be transformed exactly as they were during training
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),              # MobileNetV3 expects 224x224 input
    transforms.ToTensor(),                      # Convert PIL image to PyTorch tensor
    transforms.Normalize(                       # Normalize using ImageNet stats
        [0.485, 0.456, 0.406],                 # Mean values (RGB)
        [0.229, 0.224, 0.225]                  # Standard deviation values (RGB)
    ),
])

# =============================================================================
# Model Loading
# =============================================================================

# Load MobileNetV3-Small architecture (no pre-trained weights yet)
model = models.mobilenet_v3_small(weights=None)

# Replace the classifier head for our specific use case
# Original classifier has 1000 classes (ImageNet), we need 16 classes
num_ftrs = model.classifier[3].in_features  # Get input features of last layer
model.classifier[3] = torch.nn.Linear(num_ftrs, len(CLASS_NAMES))

# Path to the trained model weights
# Can be overridden with environment variable for different deployments
MODEL_PATH = os.getenv("MODEL_PATH", "cropguard_model_v1.pth")

# Load trained weights if available
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()  # Set to evaluation mode (disables dropout, batch norm uses running stats)
    print(f"✅ Model loaded from {MODEL_PATH}")
else:
    print(f"⚠️  WARNING: {MODEL_PATH} not found — predictions will fail.")

# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
def home():
    """
    Root endpoint - provides basic service information
    
    Returns:
        JSON with service status and number of disease classes
        
    Used for:
    - Health monitoring
    - Service discovery
    - Quick verification that API is running
    """
    return {
        "status": "CropGuard AI online",
        "classes": len(CLASS_NAMES)  # Let frontend know how many classes we support
    }

@app.get("/health")
def health():
    """
    Simple health check endpoint
    
    Returns:
        JSON with 'ok' status
        
    Used by:
    - Render backend to verify AI service is available
    - Load balancers for health monitoring
    - Frontend to check API connectivity
    """
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Main prediction endpoint - analyzes crop disease from uploaded image
    
    Workflow:
    1. Validate uploaded file is an image
    2. Preprocess the image (resize, normalize)
    3. Run through MobileNetV3 model
    4. Get highest confidence prediction
    5. Return disease name and confidence score
    
    Args:
        file: Uploaded image file (JPG, PNG, WebP supported)
    
    Returns:
        JSON with disease name and confidence percentage
    
    Raises:
        HTTPException 400: If file is not an image
        HTTPException 500: If prediction fails due to internal error
    
    Example response:
        {
            "disease": "Cassava_Mosaic_Disease",
            "confidence": "87.34%",
            "status": "success"
        }
    """
    # Validate file type - only images allowed
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Step 1: Read uploaded file
        data = await file.read()
        
        # Step 2: Open image with PIL and convert to RGB (handles PNG transparency)
        img = Image.open(io.BytesIO(data)).convert("RGB")
        
        # Step 3: Apply preprocessing transforms
        img_tensor = TRANSFORM(img).unsqueeze(0)  # Add batch dimension
        
        # Step 4: Run inference (no gradients needed for prediction)
        with torch.no_grad():
            output = model(img_tensor)  # Raw model outputs (logits)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)  # Convert to probabilities
            confidence, prediction = torch.max(probabilities, 0)  # Get highest probability
        
        # Step 5: Format and return response
        return {
            "disease": CLASS_NAMES[prediction.item()],  # Map index to class name
            "confidence": f"{confidence.item() * 100:.2f}%",  # Format as percentage
            "status": "success",
        }
        
    except Exception as e:
        # Catch any unexpected errors (corrupted images, model issues, etc.)
        raise HTTPException(status_code=500, detail=str(e))
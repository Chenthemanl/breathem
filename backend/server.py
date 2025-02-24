# backend/server.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from deepface import DeepFace
import numpy as np
import cv2
import os
import shutil
from typing import List
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Happy Face Recognition API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure paths
KNOWN_FACES_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "known_faces")
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

def ensure_valid_image(image_data):
    """Validate and preprocess image data"""
    if image_data is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
    try:
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        return img
    except Exception as e:
        logger.error(f"Image validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid image format")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Happy Face Recognition API is running"}

@app.post("/add-known-face")
async def add_known_face(name: str, files: List[UploadFile] = File(...)):
    """Add reference photos for a person"""
    logger.info(f"Adding reference photos for {name}")
    try:
        # Create directory for this person
        person_dir = os.path.join(KNOWN_FACES_DIR, name)
        os.makedirs(person_dir, exist_ok=True)
        
        saved_files = []
        for file in files:
            # Generate unique filename using timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{name}_{timestamp}_{file.filename}"
            file_path = os.path.join(person_dir, filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_files.append(filename)
            
            # Validate saved image
            try:
                img = cv2.imread(file_path)
                # Attempt to detect face to validate image
                DeepFace.detect_face(img_path=img)
            except Exception as e:
                # If face detection fails, remove the file
                os.remove(file_path)
                logger.warning(f"Removed invalid face image: {filename}")
                continue
                
            logger.info(f"Successfully saved: {filename}")
            
        return {
            "status": "success",
            "message": f"Added {len(saved_files)} reference photos for {name}",
            "files": saved_files
        }
        
    except Exception as e:
        logger.error(f"Error adding known face: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/list-known-faces")
async def list_known_faces():
    """List all known faces and their reference photos"""
    try:
        faces = {}
        if os.path.exists(KNOWN_FACES_DIR):
            for person in os.listdir(KNOWN_FACES_DIR):
                person_dir = os.path.join(KNOWN_FACES_DIR, person)
                if os.path.isdir(person_dir):
                    faces[person] = [
                        f for f in os.listdir(person_dir)
                        if f.lower().endswith(('.png', '.jpg', '.jpeg'))
                    ]
        return faces
    except Exception as e:
        logger.error(f"Error listing known faces: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    """Analyze a face for recognition and emotion"""
    logger.info("Received face analysis request")
    try:
        # Read and validate image
        contents = await file.read()
        img = ensure_valid_image(contents)
        
        # Analyze emotion
        emotion_result = DeepFace.analyze(
            img_path=img,
            actions=['emotion'],
            enforce_detection=False
        )
        
        # Extract emotion data
        emotion_data = emotion_result[0] if isinstance(emotion_result, list) else emotion_result
        
        # Try to recognize face
        person_name = "Unknown"
        try:
            if os.path.exists(KNOWN_FACES_DIR):
                recognition_result = DeepFace.find(
                    img_path=img,
                    db_path=KNOWN_FACES_DIR,
                    enforce_detection=False
                )
                
                if len(recognition_result) > 0 and len(recognition_result[0]["identity"]) > 0:
                    matched_path = recognition_result[0]["identity"][0]
                    person_name = os.path.basename(os.path.dirname(matched_path))
                    logger.info(f"Recognized person: {person_name}")
                
        except Exception as e:
            logger.warning(f"Face recognition error (non-critical): {str(e)}")
            
        response_data = {
            "status": "success",
            "dominant_emotion": emotion_data["dominant_emotion"],
            "emotion_scores": emotion_data["emotion"],
            "person": person_name
        }
        
        logger.info(f"Analysis complete: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server... Known faces directory: {KNOWN_FACES_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=8000)

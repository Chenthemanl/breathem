from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import numpy as np
import cv2
import os
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory containing known faces
KNOWN_FACES_DIR = "public/known_faces"

@app.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    print("Received request to analyze face")
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Get emotion first
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
                print(f"Checking against known faces in {KNOWN_FACES_DIR}")
                recognition_result = DeepFace.find(
                    img_path=img,
                    db_path=KNOWN_FACES_DIR,
                    enforce_detection=False,
                    model_name='VGG-Face'
                )
                print("Recognition result:", recognition_result)
                
                if len(recognition_result) > 0 and len(recognition_result[0]["identity"]) > 0:
                    # Get person name from the path
                    matched_path = recognition_result[0]["identity"][0]
                    person_name = os.path.basename(os.path.dirname(matched_path))
                    print(f"Recognized person: {person_name}")

        except Exception as e:
            print(f"Face recognition error (non-critical): {str(e)}")
            # Continue with unknown person if recognition fails

        response_data = {
            "status": "success",
            "dominant_emotion": emotion_data["dominant_emotion"],
            "emotion_scores": emotion_data["emotion"],
            "person": person_name
        }
        print("Sending response:", response_data)
        return response_data

    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    print("Starting server...")
    if not os.path.exists(KNOWN_FACES_DIR):
        print(f"Warning: Known faces directory {KNOWN_FACES_DIR} does not exist")
    uvicorn.run(app, host="0.0.0.0", port=8000)
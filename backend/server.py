# Import necessary libraries for our face recognition server
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import cv2
import os
import uvicorn
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import tempfile
import shutil
import json

# Import encryption-related libraries
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import uuid
import dotenv

# Configure detailed logging for better debugging and monitoring
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('face_recognition.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ===== TensorFlow/Keras Compatibility Layer =====
# This must be done before importing DeepFace to fix dependency issues
try:
    logger.info("Setting up TensorFlow/Keras compatibility layer...")
    import tensorflow as tf
    import sys
    
    # Check if we need to add LocallyConnected2D for compatibility
    if not hasattr(tf.keras.layers, 'LocallyConnected2D'):
        logger.info("Adding LocallyConnected2D compatibility layer")
        
        # Create a functional placeholder class that mimics the original
        class LocallyConnected2DPlaceholder:
            def __init__(self, *args, **kwargs):
                self.filters = kwargs.get('filters', 32)
                self.kernel_size = kwargs.get('kernel_size', (3, 3))
                self.strides = kwargs.get('strides', (1, 1))
                self.padding = kwargs.get('padding', 'valid')
                self.activation = kwargs.get('activation', None)
                
            def __call__(self, inputs):
                # For models that actually try to use this layer, fall back to Conv2D
                # This provides similar functionality to keep the model working
                return tf.keras.layers.Conv2D(
                    filters=self.filters,
                    kernel_size=self.kernel_size,
                    strides=self.strides,
                    padding=self.padding,
                    activation=self.activation
                )(inputs)
                
        # Add the placeholder to tf.keras.layers
        setattr(tf.keras.layers, 'LocallyConnected2D', LocallyConnected2DPlaceholder)
        logger.info("LocallyConnected2D compatibility layer added successfully")
    
    # Now try to import DeepFace with our compatibility layer in place
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    logger.info("DeepFace successfully imported with compatibility layer")
    
except Exception as e:
    DEEPFACE_AVAILABLE = False
    logger.error(f"DeepFace import failed: {str(e)}")
    logger.info("Using mock data for emotion analysis")
# ===== End of Compatibility Layer =====

# Initialize FastAPI application with detailed metadata
app = FastAPI(
    title="Happy Face Recognition API",
    description="Advanced API for facial emotion analysis and person recognition",
    version="1.0.0"
)

# Configure CORS with strict settings for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Encryption service for secure data handling
class EncryptionService:
    """
    Handles encryption and decryption of sensitive data including images and personal information.
    Uses Fernet symmetric encryption with a key derived from an environment variable.
    """
    
    def __init__(self):
        """Initialize the encryption service with a key derived from the environment"""
        # Get the encryption key from environment or generate one if not present
        self.encryption_key = self._get_or_create_key()
        self.fernet = Fernet(self.encryption_key)
        
        # Create a directory to store the mapping between encrypted and original names
        self.mapping_file = os.path.join(DATA_DIR, "encryption_mapping.json")
        os.makedirs(os.path.dirname(self.mapping_file), exist_ok=True)
        
        # Load existing mappings or create new mapping file
        self.name_mapping = self._load_mapping()
        
        logger.info("Encryption service initialized")

    def _get_or_create_key(self):
        """Get existing key from environment or generate and save a new one"""
        # Try to load .env file if it exists
        dotenv.load_dotenv()
        
        env_key = os.getenv("HAPPY_ENCRYPTION_KEY")
        
        if env_key:
            try:
                # Try to decode the existing key
                return env_key.encode()
            except Exception as e:
                logger.error(f"Invalid encryption key in environment: {e}")
        
        # Generate a new encryption key
        logger.info("Generating new encryption key")
        salt = os.urandom(16)
        # Use a random passphrase as the password source
        password = os.urandom(32)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password))
        
        # Save instructions to set this in the environment
        with open(".env.example", "a") as f:
            f.write(f"\n# Add this to your .env file:\n")
            f.write(f"HAPPY_ENCRYPTION_KEY={key.decode()}\n")
            
        logger.info("A new encryption key has been generated. Copy from .env.example to your .env file")
        
        return key

    def _load_mapping(self):
        """Load the mapping of encrypted names to real names"""
        try:
            if os.path.exists(self.mapping_file):
                with open(self.mapping_file, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading encryption mapping: {e}")
            return {}

    def _save_mapping(self):
        """Save the mapping of encrypted names to real names"""
        try:
            with open(self.mapping_file, 'w') as f:
                json.dump(self.name_mapping, f)
        except Exception as e:
            logger.error(f"Error saving encryption mapping: {e}")

    def encrypt_name(self, name):
        """
        Encrypt a person's name and create a mapping to the original
        
        Args:
            name (str): The person's name to encrypt
            
        Returns:
            str: The encrypted identifier to use for storage
        """
        # Generate a random ID instead of encrypting the name directly
        # This provides better security as the encrypted name isn't stored directly in file paths
        encrypted_id = str(uuid.uuid4())
        
        # Store the mapping between the encrypted ID and the encrypted name
        encrypted_name = self.fernet.encrypt(name.encode()).decode()
        self.name_mapping[encrypted_id] = encrypted_name
        self._save_mapping()
        
        logger.info(f"Name encrypted and mapped to ID: {encrypted_id}")
        return encrypted_id

    def decrypt_name(self, encrypted_id):
        """
        Decrypt a person's name from the mapping
        
        Args:
            encrypted_id (str): The encrypted identifier
            
        Returns:
            str: The original name, or "Unknown" if not found
        """
        if encrypted_id not in self.name_mapping:
            return "Unknown"
            
        encrypted_name = self.name_mapping[encrypted_id]
        try:
            return self.fernet.decrypt(encrypted_name.encode()).decode()
        except Exception as e:
            logger.error(f"Error decrypting name: {e}")
            return "Unknown"

    def encrypt_image(self, image_data):
        """
        Encrypt image data
        
        Args:
            image_data (bytes): The raw image data to encrypt
            
        Returns:
            bytes: The encrypted image data
        """
        return self.fernet.encrypt(image_data)

    def decrypt_image(self, encrypted_data):
        """
        Decrypt image data
        
        Args:
            encrypted_data (bytes): The encrypted image data
            
        Returns:
            bytes: The original image data
        """
        try:
            return self.fernet.decrypt(encrypted_data)
        except Exception as e:
            logger.error(f"Error decrypting image: {e}")
            return None

# Application constants with enhanced precision settings and encryption storage
DATA_DIR = "data"
KNOWN_FACES_DIR = os.path.join(DATA_DIR, "known_faces")
ENCRYPTED_FACES_DIR = os.path.join(DATA_DIR, "encrypted_faces")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MIN_FACE_SIZE = (100, 100)  # Minimum face size for reliable detection
EMOTION_CONFIDENCE_THRESHOLD = 0.65  # Increased threshold for higher precision
SECONDARY_EMOTION_THRESHOLD = 0.25  # Threshold for secondary emotions
FACE_DETECTION_MODELS = ['opencv', 'retinaface', 'mtcnn']  # Multiple detection models

# Initialize our encryption service
encryption_service = EncryptionService()

class FaceRecognitionError(Exception):
    """Custom exception for face recognition specific errors"""
    pass

def get_mock_emotion_data(random_variance=True):
    """
    Generate mock emotion data when face recognition is unavailable
    
    Args:
        random_variance (bool): Whether to add random variation to the emotion scores
        
    Returns:
        dict: Mock emotion analysis data
    """
    import random
    
    # Base emotion scores
    emotions = {
        "angry": 0.05,
        "disgust": 0.02,
        "fear": 0.03,
        "happy": 0.35,
        "sad": 0.05,
        "surprise": 0.05,
        "neutral": 0.45
    }
    
    # Add random variance if requested
    if random_variance:
        # Get a random dominant emotion
        dominant = random.choice(["happy", "neutral", "sad", "surprise"])
        
        # Reset scores
        for emotion in emotions:
            emotions[emotion] = max(0.01, random.random() * 0.1)
            
        # Boost the dominant emotion
        emotions[dominant] = 0.4 + random.random() * 0.3
        
        # Normalize to ensure sum is close to 1
        total = sum(emotions.values())
        for emotion in emotions:
            emotions[emotion] = emotions[emotion] / total
    
    # Get dominant emotion
    dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0]
    
    return {
        "status": "success (mock data)",
        "dominant_emotion": dominant_emotion,
        "emotion_scores": emotions,
        "person": "Unknown",
        "confidence_level": emotions[dominant_emotion],
        "note": "This is mock data because face recognition is unavailable"
    }

def get_image_resolution(image_path: str) -> Tuple[int, int]:
    """Get image dimensions for quality assessment"""
    img = cv2.imread(image_path)
    if img is not None:
        height, width = img.shape[:2]
        return (width, height)
    return (0, 0)

def ensure_directories() -> str:
    """Create and verify necessary directories for both original and encrypted data"""
    try:
        # Create all required directories
        for directory in [DATA_DIR, KNOWN_FACES_DIR, ENCRYPTED_FACES_DIR]:
            os.makedirs(directory, exist_ok=True)
            logger.info(f"Directory verified: {directory}")
        
        return os.path.abspath(KNOWN_FACES_DIR)
    except Exception as e:
        logger.error(f"Failed to create directories: {str(e)}")
        raise FaceRecognitionError("Failed to initialize storage directories")

def cleanup_temp_file(file_path: str) -> None:
    """Safely remove temporary files"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        logger.warning(f"Failed to cleanup temporary file {file_path}: {str(e)}")

async def process_image(file: UploadFile) -> str:
    """Process and validate uploaded image with enhanced checks"""
    try:
        # Validate file size
        file.file.seek(0, 2)
        size = file.file.tell()
        if size > MAX_IMAGE_SIZE:
            raise FaceRecognitionError("Image size exceeds maximum allowed size (10MB)")
        file.file.seek(0)

        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise FaceRecognitionError("Invalid image format. Please upload JPEG or PNG")

        # Create temporary file with enhanced error handling
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        try:
            shutil.copyfileobj(file.file, temp_file)
            temp_file.close()

            # Verify image quality
            img = cv2.imread(temp_file.name)
            if img is None:
                raise FaceRecognitionError("Failed to decode image")

            # Check image dimensions
            height, width = img.shape[:2]
            if width < MIN_FACE_SIZE[0] or height < MIN_FACE_SIZE[1]:
                raise FaceRecognitionError(
                    f"Image dimensions too small. Minimum size required: {MIN_FACE_SIZE}"
                )

            return temp_file.name
        except Exception as e:
            cleanup_temp_file(temp_file.name)
            raise FaceRecognitionError(f"Failed to process image: {str(e)}")

    except Exception as e:
        logger.error(f"Image processing error: {str(e)}")
        raise FaceRecognitionError(str(e))

async def analyze_emotions(image_path: str) -> Dict[str, Any]:
    """
    Enhanced emotion analysis using multiple models and validation
    """
    if not DEEPFACE_AVAILABLE:
        logger.warning("DeepFace not available, returning mock emotion data")
        return get_mock_emotion_data()
        
    try:
        # Verify image can be processed
        img = cv2.imread(image_path)
        if img is None:
            raise FaceRecognitionError("Could not read image for emotion analysis")

        # Collect results from multiple analysis attempts
        results = []
        for model in ['opencv', 'retinaface']:
            try:
                result = DeepFace.analyze(
                    img_path=image_path,
                    actions=['emotion'],
                    enforce_detection=True,
                    detector_backend=model,
                    prog_bar=False
                )
                results.append(result[0] if isinstance(result, list) else result)
            except Exception as e:
                logger.warning(f"Analysis with {model} failed: {str(e)}")

        if not results:
            raise FaceRecognitionError("Could not perform reliable emotion analysis")

        # Average emotion scores across models
        emotion_scores = {
            'angry': 0, 'disgust': 0, 'fear': 0, 'happy': 0,
            'sad': 0, 'surprise': 0, 'neutral': 0
        }
        
        for result in results:
            for emotion, score in result['emotion'].items():
                emotion_scores[emotion] += score / len(results)

        # Determine dominant emotion with confidence check
        dominant_emotion = max(emotion_scores.items(), key=lambda x: x[1])
        
        # Identify secondary emotions
        secondary_emotions = [
            emotion for emotion, score in emotion_scores.items()
            if score >= SECONDARY_EMOTION_THRESHOLD 
            and emotion != dominant_emotion[0]
        ]

        # Prepare detailed analysis results
        return {
            "status": "success" if dominant_emotion[1] >= EMOTION_CONFIDENCE_THRESHOLD else "low_confidence",
            "dominant_emotion": dominant_emotion[0],
            "emotion_scores": emotion_scores,
            "confidence_level": dominant_emotion[1],
            "secondary_emotions": secondary_emotions,
            "analysis_method": "multi_model_consensus"
        }

    except Exception as e:
        logger.error(f"Error in emotion analysis: {str(e)}")
        raise FaceRecognitionError(f"Failed to analyze emotions: {str(e)}")

async def detect_face(image_path: str) -> Dict[str, Any]:
    """
    Enhanced face detection using multiple methods and quality assessment
    """
    try:
        detection_results = {model: False for model in FACE_DETECTION_MODELS}
        face_details = None

        # Try OpenCV Haar Cascade
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=MIN_FACE_SIZE
        )
        
        if len(faces) > 0:
            detection_results['opencv'] = True
            face_details = {
                'count': len(faces),
                'locations': faces.tolist(),
                'method': 'opencv'
            }

        # Try other detection methods if DeepFace is available
        if not detection_results['opencv'] and DEEPFACE_AVAILABLE:
            for model in ['retinaface', 'mtcnn']:
                try:
                    result = DeepFace.detect_face(
                        img_path=image_path,
                        detector_backend=model,
                        enforce_detection=False
                    )
                    if result:
                        detection_results[model] = True
                        face_details = {
                            'count': 1,
                            'method': model
                        }
                        break
                except Exception as e:
                    logger.warning(f"{model} detection failed: {str(e)}")

        # Determine overall detection success
        detection_successful = any(detection_results.values())
        
        if detection_successful:
            logger.info(f"Face detected using method: {face_details['method']}")
            return {
                'detected': True,
                'details': face_details,
                'methods_tried': detection_results
            }
        else:
            logger.warning("No face detected with any method")
            return {
                'detected': False,
                'details': None,
                'methods_tried': detection_results
            }

    except Exception as e:
        logger.error(f"Face detection error: {str(e)}")
        return {
            'detected': False,
            'details': None,
            'error': str(e)
        }

async def detect_emotions(image_path: str) -> Dict[str, Any]:
    """
    Enhanced emotion detection with multiple attempts and validation
    """
    if not DEEPFACE_AVAILABLE:
        logger.warning("DeepFace not available, returning mock emotion data")
        return get_mock_emotion_data()
        
    try:
        # Try different detection backends in order of reliability
        backends = ['retinaface', 'opencv', 'mtcnn']
        
        for backend in backends:
            try:
                result = DeepFace.analyze(
                    img_path=image_path,
                    actions=['emotion'],
                    enforce_detection=False,
                    detector_backend=backend
                )
                
                emotion_data = result[0] if isinstance(result, list) else result
                scores = emotion_data["emotion"]
                
                # Validate emotion scores
                if any(scores.values()):  # Check if we got any non-zero scores
                    return {
                        "success": True,
                        "dominant_emotion": emotion_data["dominant_emotion"],
                        "emotion_scores": scores,
                        "detector_used": backend
                    }
            except Exception as e:
                logger.warning(f"{backend} detection failed: {str(e)}")
                continue
                
        # If all detectors failed, return a more informative response
        return {
            "success": False,
            "error": "No reliable emotion detection possible",
            "dominant_emotion": "neutral",
            "emotion_scores": {
                "angry": 0, "disgust": 0, "fear": 0,
                "happy": 0, "sad": 0, "surprise": 0,
                "neutral": 1
            }
        }
        
    except Exception as e:
        logger.error(f"Emotion detection error: {str(e)}")
        raise

# API Endpoints

@app.get("/")
async def read_root() -> Dict[str, str]:
    """Root endpoint to verify server is running"""
    return {
        "status": "ok",
        "message": "Face recognition server is running",
        "version": "1.0.0",
        "deepface_available": DEEPFACE_AVAILABLE
    }

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Enhanced health check endpoint"""
    try:
        known_faces_dir = ensure_directories()
        # Count directories instead of files since we're using directories for each person
        face_count = len([d for d in Path(known_faces_dir).iterdir() if d.is_dir()])

        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "known_faces_count": face_count,
            "storage_accessible": True,
            "models_available": FACE_DETECTION_MODELS,
            "encryption_enabled": True,
            "deepface_available": DEEPFACE_AVAILABLE
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/add-known-face")
async def add_known_face(
    file: UploadFile = File(...),
    name: str = Form(...),
    background_tasks: BackgroundTasks = None
) -> Dict[str, str]:
    """Add a new known face with encryption for privacy protection"""
    logger.info(f"Received request to add known face. Name: {name}, File: {file.filename}")
    temp_file_path = None

    try:
        if not name or not name.strip():
            raise HTTPException(status_code=400, detail="Name is required")

        # Process and validate the image
        temp_file_path = await process_image(file)

        # Enhanced face detection to ensure image quality
        detection_result = await detect_face(temp_file_path)
        if not detection_result['detected']:
            raise HTTPException(
                status_code=400,
                detail="No face detected in image. Please ensure the face is clearly visible, well-lit, and facing the camera."
            )

        # Step 1: Encrypt the person's name to get a secure identifier
        encrypted_name = encryption_service.encrypt_name(name.strip())
        
        # Step 2: Create a directory for this person using the encrypted identifier
        person_dir = os.path.join(KNOWN_FACES_DIR, encrypted_name)
        os.makedirs(person_dir, exist_ok=True)

        # Step 3: Save an unencrypted copy for DeepFace to use (needed for face recognition)
        reference_path = os.path.join(person_dir, "reference.jpg")
        shutil.copy2(temp_file_path, reference_path)
        
        # Step 4: Read the image for encryption
        with open(temp_file_path, "rb") as f:
            image_data = f.read()
        
        # Step 5: Encrypt the original image for secure storage
        encrypted_image = encryption_service.encrypt_image(image_data)
        
        # Step 6: Store the encrypted image in a separate directory
        encrypted_dir = os.path.join(ENCRYPTED_FACES_DIR, encrypted_name)
        os.makedirs(encrypted_dir, exist_ok=True)
        encrypted_path = os.path.join(encrypted_dir, "encrypted.bin")
        
        with open(encrypted_path, "wb") as f:
            f.write(encrypted_image)

        logger.info(f"Successfully added face with encrypted name ID: {encrypted_name}")
        
        # Clean up the temporary file
        if background_tasks:
            background_tasks.add_task(cleanup_temp_file, temp_file_path)

        return {
            "status": "success",
            "message": f"Successfully added face for {name}",
            "fileName": file.filename,
            "detection_details": detection_result,
            "encryption_status": "encrypted" # Don't return the actual encrypted ID for security
        }

    except HTTPException as he:
        if temp_file_path:
            cleanup_temp_file(temp_file_path)
        raise he
    except Exception as e:
        if temp_file_path:
            cleanup_temp_file(temp_file_path)
        error_msg = f"Error adding known face: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/known-faces")
async def list_known_faces() -> Dict[str, Any]:
    """List known faces with decrypted names for display"""
    try:
        known_faces_path = Path(KNOWN_FACES_DIR)
        if not known_faces_path.exists():
            return {
                "count": 0,
                "faces": [],
                "status": "success"
            }

        faces = []
        # Scan directories rather than files since we're now using directories for each person
        for person_dir in [d for d in known_faces_path.iterdir() if d.is_dir()]:
            try:
                # The directory name is the encrypted ID
                encrypted_id = person_dir.name
                
                # Decrypt the name for display using our encryption service
                original_name = encryption_service.decrypt_name(encrypted_id)
                
                # Find the reference image to get metadata
                reference_file = person_dir / "reference.jpg"
                if reference_file.exists():
                    stat = reference_file.stat()
                    faces.append({
                        "name": original_name,
                        "added_date": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "file_size": stat.st_size
                    })
            except Exception as e:
                logger.warning(f"Error getting metadata for {person_dir}: {str(e)}")

        return {
            "count": len(faces),
            "faces": sorted(faces, key=lambda x: x["added_date"], reverse=True),
            "status": "success"
        }

    except Exception as e:
        logger.error(f"Error listing known faces: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list known faces")

@app.delete("/known-faces/{name}")
async def delete_known_face(name: str) -> Dict[str, str]:
    """Delete a known face from the database, including encrypted data"""
    try:
        # Find the encrypted ID matching this name from the mapping
        encrypted_id = None
        for id, encrypted_name in encryption_service.name_mapping.items():
            try:
                decrypted = encryption_service.decrypt_name(id)
                if decrypted == name:
                    encrypted_id = id
                    break
            except Exception:
                continue
        
        if not encrypted_id:
            raise HTTPException(
                status_code=404,
                detail=f"No known face found for {name}"
            )

        # Delete reference directory
        person_dir = Path(KNOWN_FACES_DIR) / encrypted_id
        if person_dir.exists():
            shutil.rmtree(person_dir)
        
        # Delete encrypted directory
        encrypted_dir = Path(ENCRYPTED_FACES_DIR) / encrypted_id
        if encrypted_dir.exists():
            shutil.rmtree(encrypted_dir)
            
        # Delete from mapping
        if encrypted_id in encryption_service.name_mapping:
            del encryption_service.name_mapping[encrypted_id]
            encryption_service._save_mapping()
        
        logger.info(f"Successfully deleted face for {name}")
        
        return {
            "status": "success",
            "message": f"Successfully deleted face for {name}"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        error_msg = f"Error deleting known face: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/analyze-face")
async def analyze_face(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    Analyzes a face image with enhanced error handling and decrypts any recognized person's name
    """
    start_time = time.time()
    logger.info(f"Starting face analysis for file: {file.filename}")
    temp_file_path = None

    try:
        # Process and validate the image
        temp_file_path = await process_image(file)
        
        # Log image properties for debugging
        img = cv2.imread(temp_file_path)
        if img is not None:
            height, width = img.shape[:2]
            logger.info(f"Image dimensions: {width}x{height}")

        # If DeepFace is not available, return mock data
        if not DEEPFACE_AVAILABLE:
            mock_data = get_mock_emotion_data()
            logger.info("DeepFace not available, returning mock data")
            
            # Clean up temporary file
            if temp_file_path and background_tasks:
                background_tasks.add_task(cleanup_temp_file, temp_file_path)
                
            return mock_data

        # Try multiple face detection methods
        logger.info("Starting DeepFace analysis...")
        try:
            result = DeepFace.analyze(
                img_path=temp_file_path,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='retinaface'  # Try a more robust detector
            )
        except Exception as e:
            logger.warning(f"RetinaFace detection failed: {str(e)}")
            # Fallback to OpenCV
            result = DeepFace.analyze(
                img_path=temp_file_path,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='opencv'
            )

# Extract emotion data with detailed logging
        emotion_data = result[0] if isinstance(result, list) else result
        dominant_emotion = emotion_data["dominant_emotion"]
        emotion_scores = emotion_data["emotion"]

        logger.info(f"Detected emotion scores: {emotion_scores}")
        logger.info(f"Dominant emotion: {dominant_emotion}")
        
        # Attempt to recognize person using face recognition
        recognized_person = "Unknown"
        recognized_id = None
        
        try:
            # We'll search through the reference directories for matches
            for person_dir in Path(KNOWN_FACES_DIR).iterdir():
                if not person_dir.is_dir():
                    continue
                
                encrypted_id = person_dir.name
                reference_file = person_dir / "reference.jpg"
                
                if not reference_file.exists():
                    continue
                
                try:
                    # Compare the uploaded face to this reference
                    verify_result = DeepFace.verify(
                        img1_path=temp_file_path,
                        img2_path=str(reference_file),
                        enforce_detection=False,
                        model_name='VGG-Face'
                    )
                    
                    if verify_result.get("verified", False):
                        # We found a match! Decrypt the name
                        recognized_id = encrypted_id
                        recognized_person = encryption_service.decrypt_name(encrypted_id)
                        logger.info(f"Recognized person: {recognized_person}")
                        break
                except Exception as e:
                    logger.warning(f"Error comparing with reference {reference_file}: {str(e)}")
        except Exception as e:
            logger.warning(f"Error during face recognition: {str(e)}")
            # Continue with unknown person if recognition fails

        # Prepare response with detailed information
        response_data = {
            "status": "success",
            "dominant_emotion": dominant_emotion,
            "emotion_scores": emotion_scores,
            "person": recognized_person,  # Return the decrypted name
            "processing_time": round(time.time() - start_time, 2),
            "debug_info": {
                "image_size": os.path.getsize(temp_file_path),
                "image_dimensions": f"{width}x{height}" if 'width' in locals() else "unknown"
            }
        }
        
        # Clean up temporary file
        if temp_file_path and background_tasks:
            background_tasks.add_task(cleanup_temp_file, temp_file_path)

        return response_data

    except Exception as e:
        logger.error(f"Error during face analysis: {str(e)}")
        error_details = str(e)
        if temp_file_path:
            try:
                img = cv2.imread(temp_file_path)
                if img is not None:
                    error_details += f" Image dimensions: {img.shape}"
            except:
                pass
            cleanup_temp_file(temp_file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Face analysis failed: {error_details}"
        )

def initialize_server() -> None:
    """
    Initialize server with necessary setup, validation, and encryption
    """
    try:
        # Ensure required directories exist
        known_faces_path = ensure_directories()
        logger.info(f"Initialized known faces directory: {known_faces_path}")
        logger.info(f"Initialized encrypted faces directory: {os.path.abspath(ENCRYPTED_FACES_DIR)}")

        # Verify OpenCV installation and face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if face_cascade.empty():
            raise FaceRecognitionError("Failed to load face detection model")
        logger.info("Face detection model loaded successfully")

        # Log configuration settings
        logger.info("Server configuration:")
        logger.info(f"- Emotion confidence threshold: {EMOTION_CONFIDENCE_THRESHOLD}")
        logger.info(f"- Secondary emotion threshold: {SECONDARY_EMOTION_THRESHOLD}")
        logger.info(f"- Minimum face size: {MIN_FACE_SIZE}")
        logger.info(f"- Available detection models: {FACE_DETECTION_MODELS}")
        logger.info(f"- Encryption enabled: {True}")
        logger.info(f"- DeepFace available: {DEEPFACE_AVAILABLE}")

    except Exception as e:
        logger.error(f"Server initialization failed: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        print("Initializing Face Recognition Server with encryption...")
        initialize_server()
        print("Server initialized successfully. Starting...")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            access_log=True,
            workers=1  # For facial recognition, single worker is more stable
        )
    except Exception as e:
        print(f"Failed to start server: {str(e)}")
        logger.critical(f"Server startup failed: {str(e)}")
        raise
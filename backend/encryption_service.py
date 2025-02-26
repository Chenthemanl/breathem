# encryption_service.py
from cryptography.fernet import Fernet
import base64
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import uuid
import json

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
        
        # Create a directory to store the mapping between encrypted and original filenames
        self.mapping_file = "data/encryption_mapping.json"
        os.makedirs(os.path.dirname(self.mapping_file), exist_ok=True)
        
        # Load existing mappings or create new mapping file
        self.name_mapping = self._load_mapping()

    def _get_or_create_key(self):
        """Get existing key from environment or generate and save a new one"""
        env_key = os.getenv("HAPPY_ENCRYPTION_KEY")
        
        if env_key:
            try:
                # Try to decode the existing key
                return env_key.encode()
            except Exception:
                print("Invalid encryption key in environment, generating new key")
        
        # Generate a new encryption key
        print("Generating new encryption key")
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
            
        print("A new encryption key has been generated.")
        print("Please copy the key from .env.example to your .env file.")
        
        return key

    def _load_mapping(self):
        """Load the mapping of encrypted names to real names"""
        try:
            if os.path.exists(self.mapping_file):
                with open(self.mapping_file, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            print(f"Error loading encryption mapping: {e}")
            return {}

    def _save_mapping(self):
        """Save the mapping of encrypted names to real names"""
        try:
            with open(self.mapping_file, 'w') as f:
                json.dump(self.name_mapping, f)
        except Exception as e:
            print(f"Error saving encryption mapping: {e}")

    def encrypt_name(self, name):
        """
        Encrypt a person's name and create a mapping to the original
        
        Args:
            name (str): The person's name to encrypt
            
        Returns:
            str: The encrypted identifier to use for storage
        """
        # Generate a random ID instead of encrypting the name directly
        # This provides better security as the encrypted name isn't stored
        encrypted_id = str(uuid.uuid4())
        
        # Store the mapping between the encrypted ID and the encrypted name
        encrypted_name = self.fernet.encrypt(name.encode()).decode()
        self.name_mapping[encrypted_id] = encrypted_name
        self._save_mapping()
        
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
            print(f"Error decrypting name: {e}")
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
            print(f"Error decrypting image: {e}")
            return None
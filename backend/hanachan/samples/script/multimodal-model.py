import base64
import yaml
import sys
from pathlib import Path
from PIL import Image
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
import os

# --- Configuration Loading ---

def load_config(config_path: str) -> dict:
    """Loads configuration from a YAML file."""
    # Resolve path relative to this script file
    script_dir = Path(__file__).parent.resolve()
    path = script_dir / config_path
    
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with open(path, "r") as f:
        return yaml.safe_load(f)

# --- Image Preprocessor Class ---

class ImagePreprocessor:
    """Handles image loading, resizing, and encoding."""
    
    def __init__(self, max_dimension: int = 1024):
        self.max_dimension = max_dimension

    def process_and_encode(self, image_path: str) -> str:
        """
        Validates, potentially resizes, and encodes an image to Base64.
        Returns the Base64 encoded string.
        """
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found at {image_path}")
        
        if os.path.getsize(image_path) == 0:
            raise ValueError("Image file is empty.")

        print(f"✅ Processing image: {image_path}")
        
        try:
            with Image.open(path) as img:
                # Check if resize is needed
                if max(img.size) > self.max_dimension:
                    print(f"   Resizing image from {img.size} to max dimension {self.max_dimension}...")
                    img.thumbnail((self.max_dimension, self.max_dimension))
                    
                    # Save to a temporary buffer to encode
                    from io import BytesIO
                    buffered = BytesIO()
                    # Preserve format if possible, default to PNG if not
                    fmt = img.format if img.format else 'PNG'
                    img.save(buffered, format=fmt)
                    return base64.b64encode(buffered.getvalue()).decode('utf-8')
                else:
                    # If no resize needed, just read the file directly
                    with open(path, "rb") as image_file:
                        return base64.b64encode(image_file.read()).decode('utf-8')
                        
        except Exception as e:
            raise ValueError(f"Failed to process image: {e}")

# --- Main Execution ---

def run_qwen_multimodal_agent():
    """Initializes the Ollama model and sends a multimodal request."""
    try:
        # 1. Load Configuration
        config = load_config("qwen3-vl.config")
        
        model_name = config['model']['name']
        base_url = config['model']['base_url']
        num_ctx = config['model'].get('num_ctx', 2048)
        image_path = config['image']['path']
        # Resolve image path relative to script directory if it's not absolute
        script_dir = Path(__file__).parent.resolve()
        if not Path(image_path).is_absolute():
            image_path = str(script_dir / image_path)
            
        max_dim = config['image'].get('max_dimension', 1024)
        text_prompt = config['prompt']

        # 2. Initialize LangChain ChatOllama connector
        print(f"🤖 Initializing ChatOllama with model: {model_name}")
        llm = ChatOllama(
            model=model_name, 
            base_url=base_url,
            num_ctx=num_ctx,
        )

        # 3. Preprocess and Encode the image
        preprocessor = ImagePreprocessor(max_dimension=max_dim)
        base64_image = preprocessor.process_and_encode(image_path)

        # 4. Create the Multimodal Message
        multimodal_message = HumanMessage(
            content=[
                {"type": "text", "text": text_prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
            ]
        )
        
        print("\n🚀 Invoking Multimodal Model...")
        
        # 5. Invoke the model and get the response
        response = llm.invoke([multimodal_message])

        # 6. Output the result
        print("\n--- Model Response ---")
        print(response.content)
        print("----------------------")

    except FileNotFoundError as e:
        print(f"Error: {e}")
    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    run_qwen_multimodal_agent()
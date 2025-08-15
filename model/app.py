import os
import tarfile
import cv2
import numpy as np
import tensorflow as tf
from mtcnn.mtcnn import MTCNN
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

# =========================
# Model Extraction & Loading
# =========================
def extract_model(tar_path: str, extract_to: str):
    """Extract a tar.gz model file to a target folder."""
    if not os.path.exists(extract_to):
        os.makedirs(extract_to)
    with tarfile.open(tar_path, "r:gz") as tar:
        tar.extractall(path=extract_to)


def load_facenet_model(model_dir: str):
    """Load a TensorFlow SavedModel and return the inference function."""
    model = tf.saved_model.load(model_dir)
    return model.signatures['serving_default']


# =========================
# Face Detection & Preprocessing
# =========================
detector = MTCNN()

def detect_and_crop_face(img_bytes: bytes):
    """Detect and crop the face from the image using MTCNN."""
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    detections = detector.detect_faces(img_rgb)
    if not detections:
        raise ValueError("No face detected in image")

    x, y, width, height = detections[0]['box']
    return img_rgb[y:y + height, x:x + width]


def preprocess_pipeline(img_bytes: bytes, target_size=(160, 160)):
    """Detect, crop, resize, and normalize a face image for Facenet."""
    face_img = detect_and_crop_face(img_bytes)
    face_img = cv2.resize(face_img, target_size)
    face_img = np.expand_dims(face_img, axis=0)
    face_img = (face_img / 127.5) - 1.0  # Normalize to [-1, 1]
    return tf.convert_to_tensor(face_img, dtype=tf.float32)


# =========================
# Embedding & Compression
# =========================
def get_face_embedding(img_bytes: bytes, infer, target_size=(160, 160)):
    """Generate a normalized face embedding from an image."""
    img_tensor = preprocess_pipeline(img_bytes, target_size)
    result = infer(img_tensor)
    embedding = result['Bottleneck_BatchNorm'].numpy()
    embedding = embedding[0] / np.linalg.norm(embedding)
    return embedding


def compress_embedding(embedding, base=1.00049, bias=50):
    """Apply logarithmic compression to a face embedding."""
    embedding = np.array(embedding)
    biased = embedding + bias
    log_base = np.log(biased) / np.log(base)
    return np.floor(log_base)


# =========================
# FastAPI App
# =========================
app = FastAPI()

# Load model once at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # folder where app.py is
TAR_PATH = os.path.join(BASE_DIR, "facenet-tensorflow-tensorflow2-default-v2.tar.gz")
MODEL_DIR = os.path.join(BASE_DIR, "facenet-tensorflow")
#if not os.path.exists(MODEL_DIR):
#extract_model(TAR_PATH, MODEL_DIR)
infer_fn = load_facenet_model(MODEL_DIR)


@app.post("/get-embedding")
async def get_embedding(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        embedding = get_face_embedding(img_bytes, infer_fn)
        compressed = compress_embedding(embedding)

        return JSONResponse(
            content={
                "embedding_compressed": compressed.astype(int).tolist()
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)

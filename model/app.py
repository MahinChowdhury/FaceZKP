import os
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
import uvicorn
from insightface.app import FaceAnalysis
from sklearn.decomposition import PCA
import joblib


#InsightFace

app_insight = FaceAnalysis(name="buffalo_l")  # pre-trained ArcFace + SCRFD
app_insight.prepare(ctx_id=0, det_size=(640, 640))  # ctx_id=-1 for CPU

# =========================
# Embedding & Compression
# =========================
def get_face_embedding(img_bytes: bytes):
    """Extract face embedding using InsightFace ArcFace model."""
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    faces = app_insight.get(img)
    if not faces:
        raise ValueError("No face detected in image")

    embedding = faces[0].embedding
    embedding = embedding / np.linalg.norm(embedding)  # Normalize
    return embedding


def compress_embedding(embedding, base=1.00049, bias=50):
    """Apply logarithmic compression to a face embedding."""
    embedding = np.array(embedding)
    biased = embedding + bias
    log_base = np.log(biased) / np.log(base)
    return np.floor(log_base)


def calculate_similarity(emb1, emb2, threshold=1.0):
    """Compute cosine similarity or Euclidean distance."""
    emb1 = np.array(emb1)
    emb2 = np.array(emb2)
    distance = np.linalg.norm(emb1 - emb2)
    is_same = distance < threshold
    return distance, is_same


# =========================
# FastAPI App
# =========================
app = FastAPI()
pca = joblib.load("pca_64.pkl")

@app.post("/get-embedding")
async def get_embedding_api(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        embedding = get_face_embedding(img_bytes)
        compressed = compress_embedding(embedding)
        reduced = pca.transform([compressed])[0]

        print(reduced)

        return JSONResponse(
            content={
                "reduced_emb": reduced.tolist()
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/compare-embeddings")
async def compare_embeddings_api(data: dict = Body(...)):
    try:
        # Extract embeddings from payload
        emb1 = data["face_login"]
        emb2 = data["face_reg"]

        # Use default threshold (no need to send from client)
        default_threshold = 7.0
        distance, is_same = calculate_similarity(emb1, emb2, threshold=default_threshold)

        print("distandce : ",distance,is_same)

        return JSONResponse(
            content={
                "distance": float(distance),
                "match": bool(is_same)
            }
        )
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing key: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
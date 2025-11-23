import os
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple

import numpy as np

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover
    faiss = None  # Allow module import even if faiss is missing at runtime

from dotenv import load_dotenv
from django.conf import settings

load_dotenv()


# Embedding settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")


def _ensure_dirs() -> Path:
    base_dir = Path(settings.BASE_DIR) / "dbtxt" / "faiss"
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir


def _index_paths(user_id: int) -> Tuple[Path, Path]:
    base = _ensure_dirs()
    return base / f"{user_id}.index", base / f"{user_id}.meta.json"


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True) + 1e-12
    return vectors / norms


def _embed_texts(texts: List[str]) -> np.ndarray:
    """Create embeddings with OpenAI. Returns np.ndarray with shape (n, d)."""
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is missing; cannot compute embeddings for RAG.")

    # Lazy import to avoid hard dependency at import time
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    vectors = np.array([d.embedding for d in response.data], dtype=np.float32)
    return _normalize(vectors)


def _load_or_create_index(user_id: int, dim: int) -> Any:
    if faiss is None:
        raise RuntimeError("faiss-cpu is not installed. Please install faiss-cpu.")

    index_path, _ = _index_paths(user_id)
    if index_path.exists():
        return faiss.read_index(str(index_path))

    # Use inner product (cosine via normalized vectors)
    index = faiss.IndexFlatIP(dim)
    return index


def _save_index(user_id: int, index: Any) -> None:
    index_path, _ = _index_paths(user_id)
    faiss.write_index(index, str(index_path))


def _load_meta(user_id: int) -> Dict[str, Any]:
    _, meta_path = _index_paths(user_id)
    if meta_path.exists():
        with meta_path.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {"ids": [], "payloads": []}


def _save_meta(user_id: int, meta: Dict[str, Any]) -> None:
    _, meta_path = _index_paths(user_id)
    with meta_path.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def add_texts(user_id: int, texts: List[str], payloads: List[Dict[str, Any]]) -> None:
    """Add texts to the user's FAISS index with given payload metadata.

    payloads should be same length as texts; items can include e.g. {"type": "user|assistant", "message_id": int}
    """
    if not texts:
        return

    vectors = _embed_texts(texts)
    dim = vectors.shape[1]
    index = _load_or_create_index(user_id, dim)

    # Add to index
    index.add(vectors)
    _save_index(user_id, index)

    # Update metadata
    meta = _load_meta(user_id)
    # Track added ids as a simple incremental range
    start_id = len(meta.get("ids", []))
    new_ids = list(range(start_id, start_id + len(texts)))
    meta.setdefault("ids", []).extend(new_ids)
    meta.setdefault("payloads", []).extend(payloads)
    _save_meta(user_id, meta)


def search(user_id: int, query: str, k: int = 5) -> List[Dict[str, Any]]:
    if not query.strip():
        return []

    query_vec = _embed_texts([query])
    dim = query_vec.shape[1]
    index = _load_or_create_index(user_id, dim)

    if index.ntotal == 0:
        return []

    distances, indices = index.search(query_vec, min(k, index.ntotal))
    idxs = indices[0].tolist()
    dists = distances[0].tolist()

    meta = _load_meta(user_id)
    results: List[Dict[str, Any]] = []
    for rank, (i, score) in enumerate(zip(idxs, dists)):
        if i < len(meta.get("payloads", [])):
            payload = meta["payloads"][i]
            results.append({"score": float(score), "payload": payload, "rank": rank})
    return results


def build_context_from_history(items: List[Dict[str, Any]], limit_chars: int = 1500) -> str:
    if not items:
        return ""
    # Convert to short transcript
    parts: List[str] = []
    for item in items:
        p = item.get("payload", {})
        role = p.get("type", "user")
        text = p.get("text", "")
        parts.append(f"{role}: {text}")
    context = "\n".join(parts)
    if len(context) > limit_chars:
        context = context[-limit_chars:]
    return context


def add_interaction(user_id: int, user_message: str, ai_reply: str, message_id: int | None = None) -> None:
    texts = [user_message, ai_reply]
    payloads = [
        {"type": "user", "text": user_message, "message_id": message_id},
        {"type": "assistant", "text": ai_reply, "message_id": message_id},
    ]
    add_texts(user_id, texts, payloads)




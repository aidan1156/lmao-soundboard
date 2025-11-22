from sentence_transformers import SentenceTransformer
import numpy as np
import time
import json
import simpleaudio
import time

class Soundboard:
    def __init__(self):
        model_name = "all-MiniLM-L6-v2" 
        self._model = SentenceTransformer(model_name)

        with open('sounds.json', 'r') as f:
            sounds = json.load(f)

        self._embeddings = self._model.encode(list(map(lambda x: x['description'], sounds)))
        self._sounds = [simpleaudio.WaveObject.from_wave_file("sounds/" + filename) for filename in map(lambda x: x['name'], sounds)]
        
        self._last_played_index = None
        self._last_played_at = 0

    def _distance(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Compute Euclidean distance between two vectors."""
        return np.linalg.norm(vec1 - vec2)

    def log_sentence(self, sentence: str):
        sentence_embedding = self._model.encode([sentence])[0]

        distances = [self._distance(sentence_embedding, emb) for emb in self._embeddings]
        closest_index = np.argmin(distances)
        closest_distance = distances[closest_index]
        print(f"Closest distance: {closest_distance:.4f}")
        if closest_distance < 1.15 and (self._last_played_index != closest_index or time.time() - self._last_played_at > 5):
            self._sounds[closest_index].play()
            self._last_played_index = closest_index
            self._last_played_at = time.time()
    

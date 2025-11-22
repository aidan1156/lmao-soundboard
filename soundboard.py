from sentence_transformers import SentenceTransformer
import numpy as np
import time
import json
import simpleaudio
import time
import wave
import pygame

pygame.init() 

pygame.mixer.init()

class Soundboard:
    def __init__(self):
        model_name = "all-MiniLM-L6-v2" 
        self._model = SentenceTransformer(model_name)

        with open('sounds.json', 'r') as f:
            sounds = json.load(f)

        self._embeddings = self._model.encode(list(map(lambda x: x['description'], sounds)))
        self._sounds = [pygame.mixer.Sound("sounds/" + filename) for filename in map(lambda x: x['name'], sounds)]
        self._sound_names = [x['name'] for x in sounds]
        self._sound_descriptions = [x['description'] for x in sounds]
        self._sound_lengths = [self._get_wav_duration("sounds/" + filename) for filename in map(lambda x: x['name'], sounds)]
        self._sound_last_played = [0.0 for _ in self._sounds]

        self._last_played_index = None
        self._last_played_at = 0

    def _get_wav_duration(self, filename) -> float:
        """
        Calculates the duration of a WAV file in seconds.
        """
        with wave.open(filename, 'rb') as wf:
            
            # 2. Get the necessary parameters
            # wf.getnframes() returns the total number of audio frames
            n_frames = wf.getnframes()
            
            # wf.getframerate() returns the sample rate (frames per second)
            frame_rate = wf.getframerate()
            
            # 3. Calculate the duration
            duration_seconds = n_frames / frame_rate
            
            return duration_seconds

    def _distance(self, A: np.ndarray, B: np.ndarray) -> float:
        """Compute Euclidean distance between two vectors."""
        return np.linalg.norm(A - B)
        dot_product = np.dot(A, B)
    
        # 2. Calculate the norm (magnitude) of each vector (||A|| and ||B||)
        # np.linalg.norm is used for the Euclidean norm
        norm_A = np.linalg.norm(A)
        norm_B = np.linalg.norm(B)
        
        # Handle the case where one or both vectors are zero-length
        if norm_A == 0 or norm_B == 0:
            return 0.0
        
        # 3. Calculate the cosine similarity
        similarity = dot_product / (norm_A * norm_B)
        
        return similarity
    
    def _get_sound_index(self, sentence: str) -> tuple[int, float]:
        sentence_embedding = self._model.encode([sentence])[0]

        distances = [self._distance(sentence_embedding, emb) for emb in self._embeddings]
        closest_index = np.argmin(distances)
        return closest_index, distances[closest_index]

    def play_sound_for(self, sentence: str):
        closest_index, closest_distance = self._get_sound_index(sentence)
        print(f"Closest distance: {closest_distance:.4f}")
        if closest_distance > 1.2:
            return
        if (self._last_played_index == closest_index and time.time() - self._last_played_at < 5):
            return
        if time.time() - self._sound_last_played[closest_index] < self._sound_lengths[closest_index] + 1:
            return
        
        self._sounds[closest_index].play()
            
        print(f"Playing sound: {self._sound_names[closest_index]}")
        self._last_played_index = closest_index
        self._last_played_at = time.time()

    
    def get_description_for(self, sentence: str) -> str:
        closest_index, _ = self._get_sound_index(sentence)
        return self._sound_descriptions[closest_index]
    

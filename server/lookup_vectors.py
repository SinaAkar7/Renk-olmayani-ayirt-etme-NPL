#!/usr/bin/env python3
"""
Word2Vec Turkish Model Vector & Similarity Extractor
Uses trModel100 from word2vecTRmodel100 and word_index.db
"""
import sys
import json
import sqlite3
import struct
import math
import os

DB_PATH = '.model/word_index.db'
MODEL_PATH = '.model/word2vecTRmodel100/trModel100'

def dot(v1, v2):
    return sum(a * b for a, b in zip(v1, v2))

def normalize(vec):
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return vec
    return [x / norm for x in vec]

def project_to_2d(vectors_dict):
    """Simple 2D projection using Gram-Schmidt / pseudo PCA for visualization"""
    words = list(vectors_dict.keys())
    if not words:
        return {}
    
    # If we have "renk", use it as X axis guide, else first word
    axis1_word = 'renk' if 'renk' in vectors_dict else words[0]
    axis1 = list(vectors_dict[axis1_word])
    
    # Find word with lowest similarity to axis1 for axis 2
    min_sim = 1.0
    axis2_word = words[-1]
    for w in words:
        if w != axis1_word:
            s = dot(axis1, vectors_dict[w])
            if s < min_sim:
                min_sim = s
                axis2_word = w
                
    axis2_raw = list(vectors_dict[axis2_word])
    # Orthogonalize axis2 against axis1
    proj = dot(axis2_raw, axis1)
    axis2 = [axis2_raw[i] - proj * axis1[i] for i in range(len(axis1))]
    axis2 = normalize(axis2)

    coords = {}
    for w, v in vectors_dict.items():
        x = round(dot(v, axis1), 4)
        y = round(dot(v, axis2), 4)
        coords[w] = {"x": x, "y": y}
    return coords

def main():
    if len(sys.argv) < 2:
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"error": "No words provided"}))
            return
        words = json.loads(input_data)
    else:
        words = sys.argv[1:]

    # Clean and lowercase words in Turkish
    clean_words = []
    for w in words:
        w_clean = w.strip().replace('I', 'ı').replace('İ', 'i').lower()
        if w_clean and w_clean not in clean_words:
            clean_words.append(w_clean)

    # Always include 'renk' for baseline comparison
    lookup_list = list(clean_words)
    if 'renk' not in lookup_list:
        lookup_list.append('renk')

    vectors = {}
    if os.path.exists(DB_PATH) and os.path.exists(MODEL_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            placeholders = ','.join(['?'] * len(lookup_list))
            cur.execute(f"SELECT word, offset FROM words WHERE word IN ({placeholders})", lookup_list)
            rows = dict(cur.fetchall())
            conn.close()

            with open(MODEL_PATH, 'rb') as f:
                for w in lookup_list:
                    if w in rows:
                        f.seek(rows[w])
                        raw = f.read(100 * 4)
                        floats = struct.unpack('100f', raw)
                        vectors[w] = normalize(floats)
        except Exception as e:
            sys.stderr.write(f"Error reading model: {e}\n")

    # Calculate similarity with 'renk'
    renk_vec = vectors.get('renk')
    similarities_to_renk = {}
    for w in clean_words:
        if w in vectors and renk_vec:
            similarities_to_renk[w] = round(dot(vectors[w], renk_vec), 4)
        else:
            similarities_to_renk[w] = None

    # Calculate pairwise similarity matrix
    matrix = {}
    for w1 in clean_words:
        matrix[w1] = {}
        for w2 in clean_words:
            if w1 == w2:
                matrix[w1][w2] = 1.0
            elif w1 in vectors and w2 in vectors:
                matrix[w1][w2] = round(dot(vectors[w1], vectors[w2]), 4)
            else:
                matrix[w1][w2] = 0.0

    # Calculate average affinity for each word among the 4 words
    average_affinities = {}
    for w1 in clean_words:
        other_scores = [matrix[w1][w2] for w2 in clean_words if w2 != w1]
        if other_scores:
            average_affinities[w1] = round(sum(other_scores) / len(other_scores), 4)
        else:
            average_affinities[w1] = 0.0

    # Outlier detection based on Word2Vec: lowest average affinity or lowest to 'renk'
    if average_affinities:
        w2v_outlier = min(average_affinities, key=average_affinities.get)
    else:
        w2v_outlier = None

    # 2D projection
    coords_2d = project_to_2d(vectors)

    result = {
        "words": clean_words,
        "foundInModel": {w: (w in vectors) for w in clean_words},
        "similaritiesToRenk": similarities_to_renk,
        "matrix": matrix,
        "averageAffinities": average_affinities,
        "w2vOutlier": w2v_outlier,
        "coordinates2D": coords_2d,
        "vectorDimension": 100
    }
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()

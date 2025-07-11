import sys, json, os
import numpy as np
import librosa
from scipy.signal import find_peaks
from yt_dlp import YoutubeDL

def download_and_analyze(youtube_id, cache_dir='./cache'):
    os.makedirs(cache_dir, exist_ok=True)
    wav_file = os.path.join(cache_dir, f'{youtube_id}.wav')
    if not os.path.isfile(wav_file):
        output_path = os.path.join(cache_dir, f'{youtube_id}.%(ext)s')
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'quiet': True,
            'noplaylist': True
        }

        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([f'https://www.youtube.com/watch?v={youtube_id}'])

        if not os.path.isfile(wav_file):
            raise FileNotFoundError(f"Expected audio file not found: {wav_file}")

    return analyze_audio_peaks(wav_file)

def analyze_audio_peaks(file_path, db_threshold=-18, prominence=8):
    y, sr = librosa.load(file_path, sr=None)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    times = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=512)

    def bucket_idx(freq_range):
        return np.where((freqs >= freq_range[0]) & (freqs < freq_range[1]))[0]

    buckets = {
        'L': bucket_idx((20, 250)),
        'M': bucket_idx((250, 5500)),
        'H': bucket_idx((15000, 30000)),
    }

    peaks = []
    for bucket_name, idxs in buckets.items():
        if len(idxs) == 0:
            continue
        power = S[idxs, :].mean(axis=0)
        db_series = librosa.amplitude_to_db(power, ref=np.max)
        peak_indices, _ = find_peaks(db_series, height=db_threshold, prominence=prominence)
        for idx in peak_indices:
            if times[idx] < 1: continue
            peaks.append({
                't': round(float(times[idx]), 3),
                'd': round(float(db_series[idx]), 2),
                'f': bucket_name
            })

    peaks.sort(key=lambda p: p['t'])
    return peaks

def custom_json_dump(data, file):
    def dump_array(arr):
        file.write('[\n')
        for i, item in enumerate(arr):
            json_str = json.dumps(item, separators=(',', ':'))
            file.write('    ' + json_str)
            if i < len(arr) - 1:
                file.write(',\n')
            else:
                file.write('\n')
        file.write('  ]')

    file.write('{\n')
    keys = list(data.keys())
    for i, key in enumerate(keys):
        val = data[key]
        file.write(f'  "{key}": ')
        if isinstance(val, list):
            dump_array(val)
        elif isinstance(val, dict):
            file.write(json.dumps(val, separators=(',', ':')))
        else:
            file.write(json.dumps(val))
        if i < len(keys) - 1:
            file.write(',\n')
        else:
            file.write('\n')
    file.write('}\n')

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 main.py <input.json>")
        sys.exit(1)

    input_path = sys.argv[1]
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    youtube_id = data.get('youtubeId')
    if not youtube_id:
        print("Error: 'youtubeId' not found in JSON.")
        sys.exit(1)

    peaks = download_and_analyze(youtube_id)
    data['peaks'] = peaks

    with open(input_path, 'w', encoding='utf-8') as f:
        custom_json_dump(data, f)

    print(f'Wrote "{input_path}"')

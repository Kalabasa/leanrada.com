import sys
import yt_dlp
import os

def get_srt_from_youtube_id(video_id):
    langs = ['tl', 'fil']
    srt_path = None

    ydl_opts = {
        'skip_download': True,
        'writeautomaticsub': True,
        'subtitleslangs': langs,
        'subtitlesformat': 'srt',
        'outtmpl': f'{video_id}.%(ext)s',
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

        for lang in langs:
            path = f"{video_id}.{lang}.srt"
            if os.path.exists(path):
                srt_path = path
                break

        if not srt_path:
            raise Exception("No SRT subtitle file found on disk.")

        with open(srt_path, encoding='utf-8') as f:
            sys.stdout.write(f.read())

    finally:
        if srt_path and os.path.exists(srt_path):
            os.remove(srt_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python script.py <YOUTUBE_ID>\n")
        sys.exit(1)

    get_srt_from_youtube_id(sys.argv[1])

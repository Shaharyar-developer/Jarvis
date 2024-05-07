import numpy as np
import sounddevice as sd
import webrtcvad
from fastapi import FastAPI
import threading

app = FastAPI()

vad = webrtcvad.Vad()
vad.set_mode(0)

sample_rate = 16000
frame_duration = 30
blocksize = sample_rate * frame_duration // 1000

speech_frames = []
non_speech_frames = []


def audio_callback(indata, frames, time, status):
    global speech_frames, non_speech_frames
    if len(non_speech_frames) > 15:
        speech_frames = []
        non_speech_frames = []
    vad_result = vad.is_speech(bytes(np.int16(indata * 32768)), sample_rate)
    if vad_result:
        speech_frames.append(1)
    else:
        non_speech_frames.append(1)


@app.get("/")
def check_speech():
    if len(speech_frames) > 5:
        return {"speech": True}
    else:
        return {"speech": False}


def start_stream():
    while True:
        with sd.InputStream(
            callback=audio_callback,
            channels=1,
            samplerate=sample_rate,
            blocksize=blocksize,
        ):
            sd.sleep(100)


stream_thread = threading.Thread(target=start_stream)
stream_thread.start()

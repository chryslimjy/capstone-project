# #speech to text
# from vosk import Model, KaldiRecognizer
# import pyaudio
# import time

# model = Model("vosk-model-small-en-us-0.15")

# r = KaldiRecognizer(model, 48000)


# # Find the device index of the microphone you want to use
# def find_microphone_index():
#     audio = pyaudio.PyAudio()
#     for index in range(audio.get_device_count()):
#         if audio.get_device_info_by_index(index).get('maxInputChannels') > 0:
#             print(f"Microphone found at index {index}: {audio.get_device_info_by_index(index).get('name')}")
#             return index
#     print("No microphone found")
#     return None

# # Get the microphone index
# mic_index = find_microphone_index()
# if mic_index is None:
#     print("No microphone found, exiting")
#     exit()

# def recognize_speech():
#     data = stream.read(4096)
#     if r.AcceptWaveform(data):
#             text = r.Result()
            
#             print(text[14:-3])
    

        

# mic = pyaudio.PyAudio()
# stream = mic.open(format=pyaudio.paInt16, channels=1, rate=48000, input=True, input_device_index=mic_index, frames_per_buffer=8192)
# stream.start_stream()



# while True:
#    recognize_speech()




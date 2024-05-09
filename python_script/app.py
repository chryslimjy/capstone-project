# speech to text
import os
from vosk import Model, KaldiRecognizer
import pyaudio
from flask import Flask, render_template
from flask_socketio import SocketIO
#NLP stuff
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')  # Enable CORS for all origins

# Initialize NLTK stopwords
nltk.download('punkt')
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

@app.route('/')
def index():
    return render_template('index.html')

#model = Model("vosk-model-small-en-us-0.15")
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vosk-model-small-en-us-0.15")
model = Model(model_path)
r = KaldiRecognizer(model, 48000)

# Find the device index of the microphone you want to use
def find_microphone_index():
    audio = pyaudio.PyAudio()
    for index in range(audio.get_device_count()):
        if audio.get_device_info_by_index(index).get('maxInputChannels') > 0:
            print(f"Microphone found at index {index}: {audio.get_device_info_by_index(index).get('name')}")
            return index
    print("No microphone found")
    return None

# Get the microphone index
mic_index = find_microphone_index()
if mic_index is None:
    print("No microphone found, exiting")
    exit()

mic = pyaudio.PyAudio()
stream = mic.open(format=pyaudio.paInt16, channels=1, rate=48000, input=True, input_device_index=mic_index, frames_per_buffer=8192)
stream.start_stream()

def recognize_speech():
    while True:
        data = stream.read(4096)
        if r.AcceptWaveform(data):
            text = r.Result()
            recognized_text = text[14:-3]
            print("Socket-IO Speech:", recognized_text)
            tokens = word_tokenize(str(recognized_text))
            # Remove stop words
            tokens = [word for word in tokens if word.lower() not in stop_words]
            # Perform intent classification
            intent = classify_intent(tokens)
            handle_intent(intent, tokens)
            socketio.emit('speech_recognition', {'text': recognized_text})

# Update the socketio.on_event to handle events from the Node.js application
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Start the Flask SocketIO server
# if __name__ == '__main__':
#     socketio.run(app, host='0.0.0.0', port=5000)  # Change host to allow connections from external sources

#############################################################################
##NLP IMPLEMENTATION###########################################################
#############################################################################

def classify_intent(tokens):
    # Simple rule-based intent classification
    if 'open' in tokens and 'website' in tokens:
        return 'open_website'
    elif 'search' in tokens and 'for' in tokens:
        return 'web_search'
    elif 'scroll' in tokens or 'refresh':
        return 'action'
    else:
        return 'unknown'

def handle_intent(intent, tokens):
    if intent == 'open_website':
        print("The intent is to open a website")
        # website_index = tokens.index('website')
        # website = tokens[website_index + 1]
        # print(f"Opening website: {website}")

        # Code to open the specified website
        #add code to call socket to open website
    elif intent == 'web_search':
        print("The intent is to perform a search")
        
        # search_index = tokens.index('for')
        # query = ' '.join(tokens[search_index + 1:])
        # print(f"Searching for: {query}")
        # Code to perform a web search
    else:
        print("Intent not recognized. Please try again")


socketio.start_background_task(target=recognize_speech)

if __name__ == '__main__':
    try:
        socketio.run(app, host='localhost', port=5000, allow_unsafe_werkzeug=True)
    except Exception as e:
        print("An error occurred:", e)

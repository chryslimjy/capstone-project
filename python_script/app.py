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
socketio = SocketIO(app, cors_allowed_origins='*')  

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
stream = mic.open(format=pyaudio.paInt16, channels=1, rate=48000, input=True, input_device_index=mic_index, frames_per_buffer=2048)
stream.start_stream()

#dictonary of common misrecognised words
misrecognitions = {
    "such": "search",
    "dutch": "search",
    "screw": "scroll",
    "search": "search"
}

# Function to correct misrecognized words
def correct_misrecognized_words(tokens, misrecognitions):
    corrected_tokens = []
    for token in tokens:
        if token.lower() in misrecognitions:
            corrected_tokens.append(misrecognitions[token.lower()])
        else:
            corrected_tokens.append(token)
    return corrected_tokens



def recognize_speech():
    while True:
        data = stream.read(4096)
        if r.AcceptWaveform(data):
            text = r.Result()
            recognized_text = text[14:-3]
            print("Speech detected:", recognized_text)
            tokens = word_tokenize(str(recognized_text))
            #process recognized_text correction
            tokens = correct_misrecognized_words(tokens, misrecognitions)
            ###############################
            # Remove stop words
            tokens = [word for word in tokens if word.lower() not in stop_words]
            print("Tokens list:", tokens)
            # Perform intent classification
            intent = classify_intent(tokens)

            #handle intent and emit to socket io based on intent sent over
            #the front end will execute based on intent
            handle_intent(intent, recognized_text)

            #socketio.emit('speech_recognition', {'text': recognized_text})

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

###to declare functions
# def check_tokens_for_common_websites(tokens):
#     action_words = ["facebook", "youtube", "instagram"]
#     for token in tokens:
#         if token.lower() in action_words:
#             return True
#     return False

def check_tokens_for_search_commands(tokens):
    action_words = ["search", "google"]
    for token in tokens:
        if token.lower() in action_words:
            return True
    return False

def check_tokens_for_open_search_results(tokens):
    action_words = ["open","click"]
    for token in tokens:
        if token.lower() in action_words:
            return True
    return False

def check_tokens_for_commands(tokens):
    action_words = ["scroll", "scroll", "next", "refresh","previous","back"]
    for token in tokens:
        if token.lower() in action_words:
            return True
    return False



############################

#############################################################################
##NLP IMPLEMENTATION###########################################################
#############################################################################



def classify_intent(tokens):  #(improve this)
    # Simple rule-based intent classification
    if check_tokens_for_search_commands(tokens):
        return 'web_search'
    #elif check_tokens_for_common_websites(tokens):
        return 'web_search'
        #return 'open_website'
    elif check_tokens_for_commands(tokens):
        return 'action'
    elif check_tokens_for_open_search_results(tokens):
        return 'open_search_result'
    else:
        return 'unknown'

#pass intent over to web
def handle_intent(intent, recognized_text): #tokens
    if intent == 'open_website':
        print(recognized_text)
        print("The intent is to open a website")
        socketio.emit('intent-open-website', {'text': recognized_text})
        
    elif intent == 'web_search':
        print("The intent is to perform a search")
        socketio.emit('intent-search-query', {'text': recognized_text})

    elif intent == 'open_search_result':
        tokens = word_tokenize(str(recognized_text))
        print("The intent is to open a search result")
        socketio.emit('intent-open-search-result', {'text': tokens})
    
    elif intent =='action':
        print("The intent is to carry out action commands")
        socketio.emit('intent-browser-command', {'text': recognized_text})
    else:
        print("Intent not recognized. Please try again")
        socketio.emit('intent-error-msg', {'text': recognized_text})


socketio.start_background_task(target=recognize_speech)

if __name__ == '__main__':
    try:
        socketio.run(app, host='localhost', port=5000, allow_unsafe_werkzeug=True)
    except Exception as e:
        print("An error occurred:", e)

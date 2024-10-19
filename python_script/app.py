# speech to text
import os
# from vosk import Model, KaldiRecognizer
import pyaudio
from flask import Flask, render_template
from flask_socketio import SocketIO
#speech-recognition
import speech_recognition as sr
#NLP stuff
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import re

#MODEL
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
import numpy as np
import pickle
###########################

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
# model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vosk-model-small-en-us-0.15")
# model = Model(model_path)
# r = KaldiRecognizer(model, 48000)

r = sr.Recognizer()

#Updated
r.energy_threshold = 300  # Adjust sensitivity to detect speech
r.pause_threshold = 0.8   # Duration of pause to consider as speech end

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




def recognize_speech():
    # Use the default microphone as the audio source
    with sr.Microphone(sample_rate=48000) as source:
        print("Adjusting for ambient noise... Please wait.")
        r.adjust_for_ambient_noise(source)  # Adjust for background noise

        while True:
            print("Waiting for audio")

            try:
                # Capture the speech (starts automatically when speaking)
                audio_data = r.listen(source)  # Automatically stops when speech ends

                # Convert audio data to text
                recognized_text = r.recognize_google(audio_data)
                print("Speech detected:", recognized_text)
                
                # Tokenize and process recognized text
                tokens = word_tokenize(str(recognized_text))
                
                # Remove stop words
                tokens = [word for word in tokens if word.lower() not in stop_words]
                print("Tokens list:", tokens)
                
                # Perform intent classification
                intent = classify_intent(recognized_text)
                
                # Handle intent and emit to socket io based on intent
                handle_intent(intent, recognized_text)
                
            except sr.UnknownValueError:
                print("Could not understand audio")
            except sr.RequestError as e:
                print(f"Could not request results; {e}")

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
    action_words = ["open","click","go"]
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
############################
def remove_search_phrases(text):
    # Define the phrases to be removed
    phrases_to_remove = ['search for']
    
    # Tokenize the input string
    tokens = text.split()
    
    # Join tokens to form the string
    tokenized_text = ' '.join(tokens)
    
    # Remove the phrases from the tokenized text
    for phrase in phrases_to_remove:
        tokenized_text = re.sub(r'\b' + re.escape(phrase) + r'\b', '', tokenized_text, flags=re.IGNORECASE)
    
    # Tokenize again to remove any extra spaces
    cleaned_tokens = tokenized_text.split()
    cleaned_sentence = ' '.join(cleaned_tokens)
    
    return cleaned_sentence
    


#############################################################################
##NLP IMPLEMENTATION###########################################################
#############################################################################



# def classify_intent(tokens):  #(improve this)
#     # Simple rule-based intent classification
#     if check_tokens_for_search_commands(tokens):
#         return 'web_search'
#     elif check_tokens_for_commands(tokens):
#         return 'action'
#     elif check_tokens_for_open_search_results(tokens):
#         return 'open_search_result'
#     else:
#         return 'unknown'

# Load the tokenizer
with open('model/tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)

# Load the model
model_path = 'model/classify_intent.keras'
#model_path = 'model/classify_intent_word2vec.keras'
model = load_model(model_path)

# Load the label encoder
label_encoder = LabelEncoder()
label_encoder.classes_ = np.load('model/classes.npy', allow_pickle=True)

max_sequence_length = 100  # Same max_sequence_length as used during training

def classify_intent(tokens):
    # Tokenize and pad the input tokens
    sequences = tokenizer.texts_to_sequences([tokens])
    padded_sequences = pad_sequences(sequences, maxlen=max_sequence_length)
    
    # Make predictions
    predictions = model.predict(padded_sequences)
    
    # Convert predictions to class labels (indices)
    predicted_class = predictions.argmax(axis=-1)[0]
    
    # Decode the predicted class to get the intent label
    predicted_label = label_encoder.inverse_transform([predicted_class])[0]
    print(predicted_label)
    return predicted_label

#pass intent over to web
def handle_intent(intent, recognized_text): #tokens
    if intent == 'SearchQuery':
        cleaned_tokens = remove_search_phrases(recognized_text)
        print(recognized_text) 
        print("The intent is to perform a search")
        socketio.emit('intent-search-query', {'text': cleaned_tokens})

    elif intent == 'OpenSearchResult':
        tokens = word_tokenize(str(recognized_text))
        print("The intent is to open a search result")
        print(tokens)
        socketio.emit('intent-open-search-result', {'text': tokens})
    
    elif intent =='BrowserCommand':
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

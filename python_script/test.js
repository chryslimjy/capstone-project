// // Import the Vosk library (WebAssembly version)
// import Vosk from 'vosk';

// // Create a Vosk model
// const model = new Vosk.Model("vosk-model-small-en-us-0.15");

// // Create a KaldiRecognizer
// const recognizer = new Vosk.KaldiRecognizer(model, 48000);

// // Function to find the microphone index
// function findMicrophoneIndex() {
//     return navigator.mediaDevices.enumerateDevices()
//         .then(devices => devices.find(device => device.kind === 'audioinput'))
//         .then(microphone => {
//             if (microphone) {
//                 console.log(`Microphone found: ${microphone.label}`);
//                 return microphone.deviceId;
//             } else {
//                 console.log('No microphone found');
//                 return null;
//             }
//         });
// }

// // Main function to start speech recognition
// async function startSpeechRecognition() {
//     // Get the microphone index
//     const micIndex = await findMicrophoneIndex();
//     if (micIndex === null) {
//         console.log('No microphone found, exiting');
//         return;
//     }

//     // Create an AudioContext
//     const audioContext = new (window.AudioContext || window.webkitAudioContext)();

//     // Get user media stream
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: micIndex } });

//     // Create an audio input node from the media stream
//     const source = audioContext.createMediaStreamSource(stream);

//     // Connect the audio input node to the Vosk recognizer
//     source.connect(recognizer);

//     // Start the recognition process
//     recognizer.on('data', (data) => {
//         const result = JSON.parse(data);
//         console.log(result.text);
//     });

//     recognizer.on('error', (err) => {
//         console.error(err);
//     });
// }

// // Call the main function to start speech recognition
// startSpeechRecognition();

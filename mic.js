const Vosk = require('vosk-js');
const { Readable } = require('stream');

const model = Vosk.Model("./vosk-model-small-en-us-0.15");

const mic = require('mic');

const micInstance = mic({
  rate: '48000',
  channels: '1',
  debug: false,
  exitOnSilence: 6,
});

const micInputStream = micInstance.getAudioStream();

micInputStream.on('data', function (data) {
  if (recognizer.acceptWaveform(data)) {
    const result = recognizer.result();
    const text = result.text ? result.text.trim() : '';
    if (text.length > 0) {
      console.log(text);
    }
  }
});

micInputStream.on('error', function (err) {
  console.error("Error in Input Stream: " + err);
});

const recognizer = new Vosk.Recognizer({ model: model, sampleRate: 48000 });

micInstance.start();

process.on('SIGINT', function () {
  micInstance.stop();
  process.exit();
});

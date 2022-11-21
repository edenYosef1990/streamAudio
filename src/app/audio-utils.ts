
import {saveAs as importedSaveAs} from 'file-saver';

export function sliceAudioBuffer(
  buffer: AudioBuffer,
  audioContext: AudioContext,
  begin: number,
  end: number
): AudioBuffer {
  console.log(`start ${begin} end ${end}`);
  var error = null;

  var duration = buffer.duration;
  var channels = buffer.numberOfChannels;
  var rate = buffer.sampleRate;

  var startOffset = rate * begin;
  var endOffset = rate * end;
  var frameCount = endOffset - startOffset;
  var newArrayBuffer;

  newArrayBuffer = audioContext.createBuffer(
    channels,
    endOffset - startOffset,
    rate
  );
  var anotherArray = new Float32Array(frameCount);
  var offset = 0;

  for (var channel = 0; channel < channels; channel++) {
    buffer.copyFromChannel(anotherArray, channel, startOffset);
    newArrayBuffer.copyToChannel(anotherArray, channel, offset);
  }

  return newArrayBuffer;
}

export function donwloadAudioBuffer(audioBuffer: AudioBuffer, filename: string) {
  // Float32Array samples

  console.log(audioBuffer.sampleRate);
  const interleaved = audioBuffer.getChannelData(0);

  // get WAV file bytes and audio params of your audio source
  const wavBytes = getWavBytes(interleaved.buffer, {
    isFloat: true, // floating point or 16-bit integer
    numChannels: 1,
    sampleRate: 48000,
  });
  const wav = new Blob([wavBytes], { type: 'audio/wav' });
  importedSaveAs(wav,`${filename}.wav`);
  //let url = URL.createObjectURL(wav);
  //window.open(url);

  //console.log(wav);
  // create download link and append to Dom
  //const downloadLink = document.createElement('a');
  //downloadLink.href = URL.createObjectURL(wav);
  //downloadLink.setAttribute('download', 'my-audio.wav'); // name file
}

// Returns Uint8Array of WAV bytes
export function getWavBytes(buffer: ArrayBufferLike, options: any) {
  const type = options.isFloat ? Float32Array : Uint16Array;
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT;

  const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }));
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0);
  wavBytes.set(new Uint8Array(buffer), headerBytes.length);

  return wavBytes;
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
export function getWavHeader(options: any) {
  const numFrames = options.numFrames;
  const numChannels = options.numChannels || 2;
  const sampleRate = options.sampleRate || 44100;
  const bytesPerSample = options.isFloat ? 4 : 2;
  const format = options.isFloat ? 3 : 1;

  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44);
  const dv = new DataView(buffer);

  let p = 0;

  function writeString(s: string) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i));
    }
    p += s.length;
  }

  function writeUint32(d: number) {
    dv.setUint32(p, d, true);
    p += 4;
  }

  function writeUint16(d: number) {
    dv.setUint16(p, d, true);
    p += 2;
  }

  writeString('RIFF'); // ChunkID
  writeUint32(dataSize + 36); // ChunkSize
  writeString('WAVE'); // Format
  writeString('fmt '); // Subchunk1ID
  writeUint32(16); // Subchunk1Size
  writeUint16(format); // AudioFormat https://i.stack.imgur.com/BuSmb.png
  writeUint16(numChannels); // NumChannels
  writeUint32(sampleRate); // SampleRate
  writeUint32(byteRate); // ByteRate
  writeUint16(blockAlign); // BlockAlign
  writeUint16(bytesPerSample * 8); // BitsPerSample
  writeString('data'); // Subchunk2ID
  writeUint32(dataSize); // Subchunk2Size

  return new Uint8Array(buffer);
}

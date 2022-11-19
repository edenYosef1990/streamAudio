import {
  Component,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { donwloadAudioBuffer } from './audio-utils';
import { DomSanitizer } from '@angular/platform-browser';

declare var MediaRecorder: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  mediaRecorder: MediaRecorder | null = null;
  chunks: Blob[] = [];
  audioFiles = [];
  link: string = '';

  constructor(private cd: ChangeDetectorRef, private dom: DomSanitizer) {}

  ngOnInit() {
    const constraints = { audio: true };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      this.mediaRecorder = new MediaRecorder(stream);
      console.log('loaded!');
    });
  }

  startRecording() {
    if (this.mediaRecorder === null)
      throw new Error('media recorder not initalized!');
    this.mediaRecorder.start(1000);
    this.mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
      this.chunks.push(event.data);
    });
    console.log('recorder started');
  }

  // Convert an AudioBuffer to a Blob using WAVE representation
  sliceAudioBuffer(
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

    // milliseconds to seconds
    //begin = begin / 1000;
    //end = end / 1000;

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

  async sliceLastSecondFromAudioFile(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const startOffset = audioBuffer.duration - 1;
    const endOffset = audioBuffer.duration;

    let sliced = this.sliceAudioBuffer(
      audioBuffer,
      audioCtx,
      startOffset,
      endOffset
    );
    
    //let wav = audioBufferToWav(audioBuffer);
    //let blob= new Blob([new DataView(wav) ],{type: 'audio/wav'});
    //let url = URL.createObjectURL(blob);
    //window.open(url);
    //donwloadAudioBuffer(sliced);
  }
  stopRecording() {
    if (this.mediaRecorder === null)
      throw new Error('media recorder not initalized!');
    //this.mediaRecorder.stop();
    this.mediaRecorder.stop();
    console.log(this.chunks.length);
    this.chunks.slice(2,1);
    let blob = new Blob(this.chunks, { type: 'audio/ogg; codecs=opus' });
    let file = new File([blob], 'bla.webm');
    let url = URL.createObjectURL(blob);
    window.open(url);
    //let slicedLastSec = this.sliceLastSecondFromAudioFile(file);
    //console.log('recorder stopped');
  }
}

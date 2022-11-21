import {saveAs as importedSaveAs} from 'file-saver';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { donwloadAudioBuffer , sliceAudioBuffer} from './audio-utils';
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
  filenameCounter = 0;

  firstBlob: Blob | null = null;

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
      if (this.firstBlob === null) {
        this.firstBlob = event.data;
        return;
      }
      this.handleDataAvailable(event.data);
      this.chunks.push(event.data);
    });
    console.log('recorder started');
  }

  handleDataAvailable(inputBlob: Blob) {
    if (this.mediaRecorder === null)
      throw new Error('media recorder not initalized!');
    if (this.firstBlob === null)
      throw new Error('not blob containing header found!');
    let chunks = [this.firstBlob, inputBlob];
    let blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
    let file = new File([blob], 'bla.webm');
    this.downloadLastSecondFromAudioFile(file,`audio${this.filenameCounter++}`);
  }

  async downloadLastSecondFromAudioFile(file: File, filename: string) {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new window.AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const startOffset = audioBuffer.duration - 1;
    const endOffset = audioBuffer.duration;

    let sliced = sliceAudioBuffer(
      audioBuffer,
      audioCtx,
      startOffset,
      endOffset
    );

    donwloadAudioBuffer(sliced,filename);
  }
  stopRecording() {
    if (this.mediaRecorder === null)
      throw new Error('media recorder not initalized!');
    this.mediaRecorder.stop();
    this.firstBlob = null;
    this.filenameCounter = 0;
  }
}

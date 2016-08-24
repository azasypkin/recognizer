import Defer from './defer';
import VideoManager from './video-manager';
import TextRecognizer from './text-recognizer';
import TextReader from './text-reader';
import LocalStorage from './local-storage';
import InMemoryStorage from './in-memory-storage';

const canPlayDefer = new Defer();
const videoManager = new VideoManager();
const textReader = new TextReader();
const textRecognizer = new TextRecognizer();
const storage = LocalStorage.isSupported() ?
  new LocalStorage() : new InMemoryStorage();

const samples = new Map();

const sampleIds = new Uint32Array(100);
window.crypto.getRandomValues(sampleIds);
let currentSampleIndex = 0;

const apiKeyComponent = document.querySelector('.access__api-key');

apiKeyComponent.addEventListener('change', () => {
  storage.set('access', 'api-key', apiKeyComponent.value);
  textRecognizer.setAPIKey(apiKeyComponent.value);
});

storage.getByKey('access', 'api-key').catch((e) => {
  console.warn('Could not retrieve API key from the storage', e);
  return '';
}).then((apiKey) => {
  apiKeyComponent.value = apiKey;
  textRecognizer.setAPIKey(apiKey);
});
const samplesListComponent = document.querySelector('.samples-list');

samplesListComponent.addEventListener('click', (e) => {
  if (!apiKeyComponent.value) {
    alert('Please provide Microsoft Vision API key.');
    return;
  }

  const sampleId = e.target.dataset.sampleId;
  if (e.target.nodeName.toUpperCase() !== 'BUTTON' || !sampleId) {
    return;
  }

  const sample = samples.get(Number.parseInt(sampleId));

  if (e.target.dataset.isRecognize) {
    textRecognizer.recognize(sample.image).then((data) => {
      console.log('Success: %o', data);

      sample.text = data;
      samples.set(sample.id, sample);

      textReader.read(data);

      const container = document.getElementById(sample.id);
      container.classList.add('sample__container--recognized');
    }).catch((err) => {
      console.error('Failure %o', err);
    });
  } else {
    textReader.read(sample.text);
  }
});

const videoPreviewComponent = document.querySelector('.video__preview');

const videoShotPreviewRendererComponent = document.querySelector(
    '.video__shot-preview-renderer'
);
const context = videoShotPreviewRendererComponent.getContext('2d');
context.fillStyle = '#aaa';
context.fillRect(
    0,
    0,
    videoShotPreviewRendererComponent.width,
    videoShotPreviewRendererComponent.height
);

videoManager.getMediaStream().then((stream) => {
  videoPreviewComponent.src = window.URL.createObjectURL(stream);
  videoPreviewComponent.play();

  videoPreviewComponent.addEventListener('loadedmetadata', () => {
    const width = 320;
    let height = videoPreviewComponent.videoHeight /
        (videoPreviewComponent.videoWidth / width);

    // Firefox currently has a bug where the height can't be read from
    // the video, so we will make assumptions if this happens.
    if (isNaN(height)) {
      height = width / (4 / 3);
    }

    videoPreviewComponent.setAttribute('width', width);
    videoPreviewComponent.setAttribute('height', height);

    videoShotPreviewRendererComponent.setAttribute('width', width);
    videoShotPreviewRendererComponent.setAttribute('height', height);

    canPlayDefer.resolve({ width, height });
  }, false);
}).catch((err) => {
  canPlayDefer.reject(err);
});

function addSample(sampleBlob) {
  const sampleId = sampleIds[currentSampleIndex++];

  const sampleContainer = document.createElement('div');
  sampleContainer.classList = 'sample__container';
  sampleContainer.id = sampleId;

  const samplePreview = document.createElement('img');
  samplePreview.classList = 'sample__preview';
  samplePreview.src = window.URL.createObjectURL(sampleBlob);

  const recognizeButton = document.createElement('button');
  recognizeButton.type = 'button';
  recognizeButton.textContent = 'Recognize';
  recognizeButton.classList = 'sample__recognize-button';
  recognizeButton.dataset.sampleId = sampleId;
  recognizeButton.dataset.isRecognize = true;

  const repeatButton = document.createElement('button');
  repeatButton.type = 'button';
  repeatButton.textContent = 'Repeat text';
  repeatButton.classList = 'sample__repeat-button';
  repeatButton.dataset.sampleId = sampleId;

  sampleContainer.appendChild(samplePreview);
  sampleContainer.appendChild(recognizeButton);
  sampleContainer.appendChild(repeatButton);

  samplesListComponent.appendChild(sampleContainer);

  samples.set(sampleId, { id: sampleId, image: sampleBlob, text: null });
}

/** Sample Camera provider **/

const shotButton = document.querySelector('.video__shot-button');
shotButton.setAttribute('disabled', 'disabled');
shotButton.addEventListener('click', () => {
  videoShotPreviewRendererComponent.getContext('2d').drawImage(
    videoPreviewComponent, 0, 0,
    Number(videoPreviewComponent.getAttribute('width')),
    Number(videoPreviewComponent.getAttribute('height'))
  );

  videoShotPreviewRendererComponent.toBlob((imageBlob) => {
    addSample(imageBlob);
  });
});

canPlayDefer.promise.then(() => {
  shotButton.removeAttribute('disabled');
});

/** End of Sample Camera provider **/


/** Sample URL provider **/
const urlProviderURL = document.querySelector('.sample-url-provider__url');
const urlProviderSubmit = document.querySelector(
  '.sample-url-provider__submit'
);

urlProviderSubmit.addEventListener('click', () => {
  const sampleURL = urlProviderURL.value;
  if (!sampleURL) {
    alert('Please provide a valid image URL!');
    return;
  }

  return fetch(sampleURL).then((response) => {
    return response.blob();
  }).then((blob) => {
    addSample(blob);
  }).catch((e) => {
    console.error('Failed to add sample from URL: ', e);
    alert('Failed to add sample! See log for more details...');
  });
});


/** End of Sample URL provider **/


/** Sample Local File provider **/

const localFileProviderPath = document.querySelector(
  '.local-file-provider__path'
);

const localFileProviderUpload = document.querySelector(
  '.local-file-provider__upload'
);

localFileProviderPath.addEventListener('change', (e) => {
  for (const file of e.target.files) {
    addSample(file);
  }
});

localFileProviderUpload.addEventListener('click', () => {
  localFileProviderPath.click();
});

/** End of Sample URL provider **/

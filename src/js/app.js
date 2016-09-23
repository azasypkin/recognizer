import Defer from './defer';
import VideoManager from './video-manager';
import ThingRecognizer from './thing-recognizer';
import ThingDescriber from './thing-describer';
import LocalStorage from './local-storage';
import InMemoryStorage from './in-memory-storage';
import SessionStore from './session-store';
import Painter from './painter';

const sampleActions = Object.freeze({
  RECOGNIZE: 'RECOGNIZE',
  REPEAT: 'REPEAT',
  ROTATE: 'ROTATE'
});

const canPlayDefer = new Defer();
const videoManager = new VideoManager();
const thingDescriber = new ThingDescriber();
const thingRecognizer = new ThingRecognizer();
const storage = LocalStorage.isSupported() ?
  new LocalStorage() : new InMemoryStorage();

const samples = new Map();

const sampleIds = new Uint32Array(100);
window.crypto.getRandomValues(sampleIds);
let currentSampleIndex = 0;

const apiKeyComponent = document.querySelector('.access__api-key');

apiKeyComponent.addEventListener('change', () => {
  storage.set('access', 'api-key', apiKeyComponent.value);
  SessionStore.set('ms-api-key', apiKeyComponent.value);
});

storage.getByKey('access', 'api-key').catch((e) => {
  console.warn('Could not retrieve API key from the storage', e);
  return '';
}).then((apiKey) => {
  apiKeyComponent.value = apiKey;
  SessionStore.set('ms-api-key', apiKey);
});

const samplesListComponent = document.querySelector('.samples-list');
const blobRendererComponent = document.querySelector('.blob__renderer');
const blobLoaderComponent = document.querySelector('.blob__loader');

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
  const buttonKind = e.target.dataset.kind;

  if (buttonKind === sampleActions.RECOGNIZE) {
    thingRecognizer.recognize(sample.image).then((textMetadata) => {
      console.log('Success: %o', textMetadata);

      sample.text = textMetadata;
      samples.set(sample.id, sample);

      const container = document.getElementById(sample.id);
      container.classList.add('sample__container--recognized');

      return getSampleCanvas(sample).then((textCanvas) => {
        thingDescriber.describe(textMetadata, textCanvas);

        blobRendererComponent.toBlob((imageBlob) => {
          document.getElementById(sample.id).querySelector('img').src =
            window.URL.createObjectURL(imageBlob);
        });
      });
    }).catch((err) => {
      console.error('Failure %o', err);
    });
  } else if (buttonKind === sampleActions.REPEAT) {
    thingDescriber.describe(sample.text);
  }
});

const videoPreviewComponent = document.querySelector('.video__preview');

const context = blobRendererComponent.getContext('2d');
context.fillStyle = '#aaa';
context.fillRect(
    0,
    0,
    blobRendererComponent.width,
    blobRendererComponent.height
);

videoManager.getMediaStream().then((stream) => {
  videoPreviewComponent.src = window.URL.createObjectURL(stream);

  videoPreviewComponent.addEventListener('loadedmetadata', () => {
    videoPreviewComponent.play();

    canPlayDefer.resolve({
      width: videoPreviewComponent.videoWidth,
      height: videoPreviewComponent.videoHeight
    });
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
  recognizeButton.classList = 'sample__recognize-button action-button';
  recognizeButton.dataset.sampleId = sampleId;
  recognizeButton.dataset.kind = sampleActions.RECOGNIZE;

  const repeatButton = document.createElement('button');
  repeatButton.type = 'button';
  repeatButton.textContent = 'Repeat text';
  repeatButton.classList = 'sample__repeat-button action-button';
  repeatButton.dataset.sampleId = sampleId;
  repeatButton.dataset.kind = sampleActions.REPEAT;

  sampleContainer.appendChild(samplePreview);
  sampleContainer.appendChild(recognizeButton);
  sampleContainer.appendChild(repeatButton);

  samplesListComponent.appendChild(sampleContainer);

  samples.set(sampleId, { id: sampleId, image: sampleBlob, text: null });
}

function getSampleCanvas(sample) {
  const defer = new Defer();

  blobLoaderComponent.src = window.URL.createObjectURL(sample.image);

  blobLoaderComponent.onload = () => {
    const canvasContext = blobRendererComponent.getContext('2d');

    canvasContext.clearRect(
      0, 0, Number(blobRendererComponent.getAttribute('width')),
      Number(blobRendererComponent.getAttribute('height'))
    );

    blobRendererComponent.setAttribute('width', blobLoaderComponent.width);
    blobRendererComponent.setAttribute('height', blobLoaderComponent.height);

    canvasContext.drawImage(
      blobLoaderComponent, 0, 0, blobLoaderComponent.width,
      blobLoaderComponent.height
    );

    defer.resolve({
      context: canvasContext,
      width: blobLoaderComponent.width,
      height: blobLoaderComponent.height
    });
  };

  blobLoaderComponent.onerror = (e) => defer.reject(e);

  return defer.promise;
}

/** Sample Camera provider **/

const shotButton = document.querySelector('.video__shot-button');
shotButton.setAttribute('disabled', 'disabled');
shotButton.addEventListener('click', () => {
  const width = videoPreviewComponent.clientWidth;
  const height = videoPreviewComponent.clientHeight;

  blobRendererComponent.setAttribute('width', width);
  blobRendererComponent.setAttribute('height', height);

  blobRendererComponent.getContext('2d').drawImage(
    videoPreviewComponent, 0, 0, Number(width), Number(height)
  );

  blobRendererComponent.toBlob((imageBlob) => {
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

function addSampleFromURL(url) {
  return fetch(url).catch((e) => {
    console.warn('Can not load image directly, trying through the proxy: ', e);

    const proxyURL = `https://recognizer-ocr-proxy.herokuapp.com/?${url}`;
    const headers = new Headers();
    headers.append('Target-URL', url);

    return fetch(proxyURL, { headers });
  }).then((response) => {
    return response.blob();
  }).then((blob) => {
    addSample(blob);
  }).catch((e) => {
    console.error('Failed to add sample from URL: ', e);
    alert('Failed to add sample! See log for more details...');
  });
}

urlProviderSubmit.addEventListener('click', () => {
  const sampleURL = urlProviderURL.value;
  if (!sampleURL) {
    alert('Please provide a valid image URL!');
    return;
  }

  addSampleFromURL(sampleURL);
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


/** Manual Sample provider **/
const manualSampleCanvas = document.querySelector(
  '.manual-sample-provider__canvas'
);

const manualSampleColorPicker = document.querySelector(
  '.manual-sample-provider__color-picker'
);

const manualSampleWidth = document.querySelector(
  '.manual-sample-provider__width'
);

const manualSampleClearButton = document.querySelector(
  '.manual-sample-provider__clear-button'
);

const manualSampleSubmit = document.querySelector(
  '.manual-sample-provider__submit'
);

const painter = new Painter(manualSampleCanvas);

manualSampleColorPicker.addEventListener('change', () => {
  painter.setStyle(
    manualSampleColorPicker.value,
    Number(manualSampleWidth.value)
  );
});

manualSampleWidth.addEventListener('change', () => {
  painter.setStyle(
    manualSampleColorPicker.value,
    Number(manualSampleWidth.value)
  );
});

manualSampleClearButton.addEventListener('click', () => {
  painter.clear();
});

manualSampleSubmit.addEventListener('click', () => {
  manualSampleCanvas.toBlob((imageBlob) => addSample(imageBlob));
});

/** End of Manual Sample provider **/

function addSampleFromHash() {
  if (!location.hash || location.hash.length < 2) {
    return;
  }

  addSampleFromURL(location.hash.slice(1).trim());
}

window.addEventListener('hashchange', () => {
  addSampleFromHash();
});

addSampleFromHash();
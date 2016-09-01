import Defer from './defer';
import VideoManager from './video-manager';
import TextRecognizer from './text-recognizer';
import TextReader from './text-reader';
import LocalStorage from './local-storage';
import InMemoryStorage from './in-memory-storage';
import Painter from './painter';

const sampleActions = Object.freeze({
  RECOGNIZE: 'RECOGNIZE',
  REPEAT: 'REPEAT',
  ROTATE: 'ROTATE'
});

const orientation = Object.freeze({
  LEFT: 'Left',
  RIGHT: 'Right',
  UP: 'Up',
  DOWN: 'Down'
});

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
  const buttonKind = e.target.dataset.kind;

  if (buttonKind === sampleActions.RECOGNIZE) {
    textRecognizer.recognize(sample.image).then((data) => {
      console.log('Success: %o', data);

      sample.text = data;
      samples.set(sample.id, sample);

      outlineSampleWords(sample);

      textReader.read(data);

      const container = document.getElementById(sample.id);
      container.classList.add('sample__container--recognized');
    }).catch((err) => {
      console.error('Failure %o', err);
    });
  } else if (buttonKind === sampleActions.REPEAT) {
    textReader.read(sample.text);
  }
});

const videoPreviewComponent = document.querySelector('.video__preview');

const blobRendererComponent = document.querySelector('.blob__renderer');
const blobLoaderComponent = document.querySelector('.blob__loader');

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

  setTimeout(() => {
    sampleContainer.scrollIntoView();
  }, 1000);
}

function outlineSampleWords(sample) {
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

    canvasContext.translate(
      blobLoaderComponent.width / 2, blobLoaderComponent.height / 2
    );

    let textAngle = sample.text.textAngle;

    if (sample.text.orientation === orientation.LEFT) {
      textAngle -= 90;
    } else if (sample.text.orientation === orientation.RIGHT) {
      textAngle += 90;
    } else if (sample.text.orientation === orientation.DOWN) {
      textAngle += 180;
    }

    canvasContext.rotate(textAngle * Math.PI / 180);

    for (const region of sample.text.regions) {
      for (const line of region.lines) {
        for (const word of line.words) {
          const boundingBox = word.boundingBox.split(',').map((dimension) => {
            return Number(dimension.trim());
          });

          canvasContext.rect(
            boundingBox[0] - blobLoaderComponent.width / 2,
            boundingBox[1] - blobLoaderComponent.height / 2,
            boundingBox[2], boundingBox[3]
          );
          canvasContext.stroke();
        }
      }
    }

    blobRendererComponent.toBlob((imageBlob) => {
      document.getElementById(sample.id).querySelector('img').src =
        window.URL.createObjectURL(imageBlob);
    });
  };

  document.body.appendChild(blobLoaderComponent);
}

/** Sample Camera provider **/

const shotButton = document.querySelector('.video__shot-button');
shotButton.setAttribute('disabled', 'disabled');
shotButton.addEventListener('click', () => {
  const width = videoPreviewComponent.getAttribute('width');
  const height = videoPreviewComponent.getAttribute('height');

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
const examplesList = document.querySelector('.sample-url-provider__examples');

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

examplesList.addEventListener('click', (e) => {
  if (e.target.nodeName.toUpperCase() !== 'LI') {
    return;
  }

  addSampleFromURL(e.target.textContent.trim());
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

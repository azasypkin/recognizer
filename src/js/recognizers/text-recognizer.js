'use strict';

import SessionStore from '../session-store';

const p = Object.freeze({
  apiURL: Symbol('apiURL')
});

export default class TextRecognizer {
  constructor(language = 'unk', detectOrientation = true) {
    this[p.apiURL] = 'https://api.projectoxford.ai/vision/v1.0/ocr?' +
      `language=${language}&detectOrientation=${detectOrientation}`;
  }

  recognize(imageBlob) {
    return SessionStore.get('ms-api-key').then((apiKey) => {
      const headers = new Headers();
      headers.append('Ocp-Apim-Subscription-Key', apiKey);

      const formData = new FormData();
      formData.append('image', imageBlob, 'image.png');

      return fetch(this[p.apiURL], {
        method: 'POST',
        headers,
        body: formData
      }).then((response) => response.json());
    });
  }
}

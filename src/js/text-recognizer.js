const p = Object.freeze({
  // Properties
  apiURL: Symbol('apiURL'),
  apiKey: Symbol('apiKey')
});

export default class TextRecognizer {
  constructor(apikey = '', language = 'unk', detectOrientation = true) {
    this[p.apiURL] = 'https://api.projectoxford.ai/vision/v1.0/ocr?' +
        `language=${language}&detectOrientation=${detectOrientation}`;
    this[p.apiKey] = apikey;
  }

  recognize(imageBlob) {
    const headers = new Headers();
    headers.append('Ocp-Apim-Subscription-Key', this[p.apiKey]);

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');

    return fetch(this[p.apiURL], {
      method: 'POST',
      headers,
      body: formData
    }).then((response) => response.json());
  }

  setAPIKey(apiKey) {
    this[p.apiKey] = apiKey;
  }
}

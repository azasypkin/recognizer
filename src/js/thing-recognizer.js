import TextRecognizer from './recognizers/text-recognizer';
import BarcodeRecognizer from './recognizers/barcode-recognizer';

const p = Object.freeze({
  synthesizer: Symbol('synthesizer'),
  recognizers: Symbol('recognizers'),

  recognize: Symbol('recognize')
});

export default class ThingRecognizer {
  constructor() {
    this[p.recognizers] = [new BarcodeRecognizer(), new TextRecognizer()];
  }

  recognize(imageBlob) {
    return this[p.recognize](imageBlob);
  }

  [p.recognize](imageBlob, recognizerIndex = 0) {
    const recognizers = this[p.recognizers];
    if (recognizerIndex >= recognizers.length) {
      return Promise.reject();
    }

    return recognizers[recognizerIndex].recognize(imageBlob).catch((e) => {
      console.warn('Recognizer did not recognize image', e);
      return this[p.recognize](imageBlob, recognizerIndex + 1);
    });
  }
}

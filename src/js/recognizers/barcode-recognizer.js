/* global Quagga */

/*const config = Object.freeze({
  inputStream: {
  name: 'Test',
    type: 'ImageStream',
    length: 10,
    size: 800
  },
  locator: {
    patchSize: 'medium',
      halfSample: true
  }
});*/

export default class BarcodeRecognizer {
  constructor() {
  }

  recognize(imageBlob) {
    return new Promise((resolve, reject) => {
      Quagga.decodeSingle({
        src: window.URL.createObjectURL(imageBlob),
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader'
          ],
        }
      }, (result) => {
        console.log('Quagga: ', result);
        if (result) {
          resolve(result);
        } else {
          reject();
        }
      });
    });
  }
}

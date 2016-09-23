const p = Object.freeze({
  synthesizer: Symbol('synthesizer')
});

export default class BarcodeDescriber {
  constructor(synthesizer) {
    if (!synthesizer) {
      throw new Error('Speech Synthesizer should be provided!');
    }

    this[p.synthesizer] = synthesizer;
  }

  canDescribe(textMetadata) {
    if (textMetadata.codeResult ||
      (textMetadata.boxes && textMetadata.boxes.length > 0)) {
      return true;
    }
  }

  describe(textMetadata, textCanvas) {
    const synthesizer = this[p.synthesizer];
    synthesizer.speak('I see the barcode on this picture.');

    if (!textMetadata.codeResult || !textMetadata.codeResult.code) {
      synthesizer.speak('But I could not recognize the numbers on it.');
      synthesizer.speak('Please try to make better picture.');
    } else {
      if (textMetadata.codeResult.format) {
        let format = textMetadata.codeResult.format.toLowerCase().replace(
          '_', ' '
        );

        format = format.replace('ean', 'International Article Number (or EAN)');
        format = format.replace('upc', 'Universal Product Code (or UPC)');

        synthesizer.speak(`Barcode format is ${format}`);
      }

      const number = Array.from(textMetadata.codeResult.code).reduce(
        (result, digit) => `${result} ${digit}`, ''
      );

      synthesizer.speak(`Barcode number is ${number}`);
    }

    if (textCanvas) {
      textCanvas.context.lineWidth = 3;
      textCanvas.context.strokeStyle = '#FF0000';
    }
  }
}
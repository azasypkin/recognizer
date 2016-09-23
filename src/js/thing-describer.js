import SpeechSynthesizer from './speech-synthesizer';
import UnknownThingDescriber from './describers/unknown-thing-describer';
import NutritionFactsDescriber from './describers/nutrition-facts-describer';
import BarcodeDescriber from './describers/barcode-describer';

const p = Object.freeze({
  synthesizer: Symbol('synthesizer'),
  recognizers: Symbol('recognizers')
});

const DEFAULT_VOICE_PITCH = 0.8;
const DEFAULT_VOICE_RATE = 0.9;

export default class ThingDescriber {
  constructor(pitch = DEFAULT_VOICE_PITCH, rate = DEFAULT_VOICE_RATE) {
    const synthesizer = this[p.synthesizer] =
      new SpeechSynthesizer(pitch, rate);

    this[p.recognizers] = [
      new BarcodeDescriber(synthesizer),
      new NutritionFactsDescriber(synthesizer),
      new UnknownThingDescriber(synthesizer)
    ];
  }

  describe(textMetadata, textCanvas) {
    for (const describer of this[p.recognizers]) {
      if (describer.canDescribe(textMetadata)) {
        describer.describe(textMetadata, textCanvas);
        return;
      }
    }

    this[p.synthesizer].speak(
      'Sorry! I do not recognize anything on this picture.'
    );
  }
}

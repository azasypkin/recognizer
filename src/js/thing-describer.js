import SpeechSynthesizer from './speech-synthesizer';
import UnknownThingDescriber from './describers/unknown-thing-describer';

const p = Object.freeze({
  synthesizer: Symbol('synthesizer'),
  describers: Symbol('describers')
});

const DEFAULT_VOICE_PITCH = 0.8;
const DEFAULT_VOICE_RATE = 0.9;

export default class ThingDescriber {
  constructor(pitch = DEFAULT_VOICE_PITCH, rate = DEFAULT_VOICE_RATE) {
    this[p.synthesizer] = new SpeechSynthesizer(pitch, rate);
    this[p.describers] = [new UnknownThingDescriber(this[p.synthesizer])];
  }

  describe(textMetadata, textCanvas) {
    if (textMetadata.regions.length === 0) {
      this[p.synthesizer].speak('Sorry! I did not recognize any text.');
      return;
    }

    for (const describer of this[p.describers]) {
      if (describer.canDescribe(textMetadata)) {
        describer.describe(textMetadata, textCanvas);
        break;
      }
    }
  }
}

import SpeechSynthesizer from './speech-synthesizer';

const LANGUAGES = new Map([
  ['unk', 'Unknown'],
  ['ar', 'Arabic'],
  ['zh-Hans', 'Simplified Chinese'],
  ['zh-Hant', 'Traditional Chinese'],
  ['cs', 'Czech'],
  ['da', 'Danish'],
  ['nl', 'Dutch'],
  ['en', 'English'],
  ['fi', 'Finnish'],
  ['fr', 'French'],
  ['de', 'German'],
  ['el', 'Greek'],
  ['hu', 'Hungarian'],
  ['it', 'Italian'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['nb', 'Norwegian'],
  ['pl', 'Polish'],
  ['pt', 'Portuguese'],
  ['ru', 'Russian'],
  ['es', 'Spanish'],
  ['sv', 'Swedish'],
  ['tr', 'Turkish']
]);

const p = Object.freeze({
  synthesizer: Symbol('synthesizer')
});

const DEFAULT_VOICE_PITCH = 0.8;
const DEFAULT_VOICE_RATE = 0.9;

export default class TextReader {
  constructor(pitch = DEFAULT_VOICE_PITCH, rate = DEFAULT_VOICE_RATE) {
    this[p.synthesizer] = new SpeechSynthesizer(pitch, rate);
  }

  read(textDescription) {
    const numberOfTextRegions = textDescription.regions.length;
    const synthesizer = this[p.synthesizer];

    if (numberOfTextRegions === 0) {
      synthesizer.speak('Sorry! I did not recognize any text.');
      return;
    }

    if (numberOfTextRegions === 1) {
      synthesizer.speak('I see just one region of text.');
    } else {
      synthesizer.speak(`I see ${numberOfTextRegions} regions of text.`);
    }

    const language = textDescription.language;

    if (!language || language === 'unk') {
      synthesizer.speak('I can not recognize the language.');
    } else {
      synthesizer.speak(
        `I think this is ${LANGUAGES.get(language)} language.`
      );
    }

    if (textDescription.textAngle < 5) {
      synthesizer.speak('Text is almost perfectly aligned!');
    } else {
      synthesizer.speak('Text is skewed a bit');
    }

    for (let i = 0; i < numberOfTextRegions; i++) {
      const region = textDescription.regions[i];
      synthesizer.speak(
        `Region number ${i + 1} consists of ` +
        `${region.lines.length} lines of text.`
      );

      for (let l = 0; l < region.lines.length; l++) {
        const line = region.lines[l];
        synthesizer.speak(
          `Let me read words from the line number ${l + 1}:`
        );

        for (let w = 0; w < line.words.length; w++) {
          synthesizer.speak(line.words[w].text, language);
        }
      }

    }
  }
}

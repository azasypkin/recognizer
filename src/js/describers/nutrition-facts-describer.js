const p = Object.freeze({
  synthesizer: Symbol('synthesizer')
});

// List of the keywords that should be located in the same line with a
// confidence level.
const patterns = [
  /nutr(.)+(?=fact)/i,
  /servi(.)+(?=size)(.)+(?=cup)/i,
  /amoun(.)+(?=servi)/i,
  /calori(.)+(?=fro)(.)+(?=fat)/i,
  /satura(.)+(?=fat)/i,
  /trans(.)+(?=fat)/i,
];

const generalPattern = new RegExp('(vitamin|iron|protein|sodium|fat|sugar|' +
    'fiber|calori|diet|choleste|carbo|mg|nutri|daily|calcium|potassi)', 'g');

export default class NutritionFactsDescriber {
  constructor(synthesizer) {
    if (!synthesizer) {
      throw new Error('Speech Synthesizer should be provided!');
    }

    this[p.synthesizer] = synthesizer;
  }

  canDescribe(textMetadata) {
    const numberOfTextRegions = textMetadata.regions ?
      textMetadata.regions.length : 0;
    if (numberOfTextRegions === 0) {
      return false;
    }

    let fullText = '';
    for (const region of textMetadata.regions) {
      for (const line of region.lines) {
        const sentence = line.words.reduce((sentence, word) => {
          return `${sentence} ${word.text}`;
        }, '');

        for (const pattern of patterns) {
          if (pattern.test(sentence)) {
            return true;
          }
        }

        fullText += sentence;
      }
    }

    const generalMatches = fullText.match(generalPattern);

    return generalMatches && generalMatches.length > 8;
  }

  describe(textMetadata, textCanvas) {
    const numberOfTextRegions = textMetadata.regions.length;
    if (numberOfTextRegions === 0) {
      throw new Error('Text metadata is not provided!');
    }

    const synthesizer = this[p.synthesizer];
    synthesizer.speak('I think this is a nutrition facts label.');

    if (textCanvas) {
      textCanvas.context.lineWidth = 3;
      textCanvas.context.strokeStyle = '#FF0000';
    }
  }
}
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

const orientation = Object.freeze({
  LEFT: 'Left',
  RIGHT: 'Right',
  UP: 'Up',
  DOWN: 'Down'
});

const p = Object.freeze({
  synthesizer: Symbol('synthesizer')
});

export default class UnknownThingDescriber {
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

    return true;
  }

  describe(textMetadata, textCanvas) {
    const numberOfTextRegions = textMetadata.regions ?
      textMetadata.regions.length : 0;
    if (numberOfTextRegions === 0) {
      throw new Error('Text metadata is not provided!');
    }

    const synthesizer = this[p.synthesizer];
    let horizontalDimension, verticalDimension;

    if (textCanvas) {
      textCanvas.context.translate(textCanvas.width / 2, textCanvas.height / 2);

      horizontalDimension = textCanvas.width;
      verticalDimension = textCanvas.height;

      let textAngle = textMetadata.textAngle;
      if (textMetadata.orientation === orientation.LEFT) {
        textAngle -= 90;
        horizontalDimension = textCanvas.height;
        verticalDimension = textCanvas.width;
      } else if (textMetadata.orientation === orientation.RIGHT) {
        textAngle += 90;
        horizontalDimension = textCanvas.height;
        verticalDimension = textCanvas.width;
      } else if (textMetadata.orientation === orientation.DOWN) {
        textAngle += 180;
      }

      textCanvas.context.rotate(textAngle * Math.PI / 180);
      textCanvas.context.lineWidth = 3;
      textCanvas.context.strokeStyle = '#FF0000';
    }

    if (numberOfTextRegions === 1) {
      synthesizer.speak('I see just one region of text.');
    } else {
      synthesizer.speak(`I see ${numberOfTextRegions} regions of text.`);
    }

    const language = textMetadata.language;

    if (!language || language === 'unk') {
      synthesizer.speak('I can not recognize the language.');
    } else {
      synthesizer.speak(
        `I think this is ${LANGUAGES.get(language)} language.`
      );
    }

    if (textMetadata.textAngle === 0) {
      synthesizer.speak('Text is perfectly aligned.');
    } else if (textMetadata.textAngle < 10) {
      synthesizer.speak('Text is almost perfectly aligned.');
    } else {
      synthesizer.speak('Text is skewed.');
    }

    for (let i = 0; i < numberOfTextRegions; i++) {
      const region = textMetadata.regions[i];
      synthesizer.speak(
        `Region number ${i + 1} consists of ` +
        `${region.lines.length} lines of text.`
      );

      for (let l = 0; l < region.lines.length; l++) {
        const line = region.lines[l];
        synthesizer.speak(
          `Let me read words from the line number ${l + 1}:`
        );

        const sentence = line.words.reduce((sentence, word) => {
          const boundingBox = word.boundingBox.split(',').map((dimension) => {
            return Number(dimension.trim());
          });

          if (textCanvas) {
            textCanvas.context.rect(
              boundingBox[0] - horizontalDimension / 2,
              boundingBox[1] - verticalDimension / 2,
              boundingBox[2], boundingBox[3]
            );

            textCanvas.context.stroke();
          }

          return `${sentence} ${word.text}`;
        }, '');

        synthesizer.speak(sentence, language);
      }
    }
  }
}
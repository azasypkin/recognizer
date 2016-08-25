'use strict';

const p = Object.freeze({
  canvas: Symbol('canvas'),
  context: Symbol('context'),
  width: Symbol('width'),
  height: Symbol('height'),
  currentPoint: Symbol('currentPoint'),
  previousPoint: Symbol('previousPoint'),
  flag: Symbol('flag'),
  styleColor: Symbol('styleColor'),
  styleWidth: Symbol('styleWidth'),

  // Methods.
  findXY: Symbol('findXY'),
  draw: Symbol('draw')
});

/**
 * Instance of the Defer class is just a handy wrapper around native Promise
 * object intended to provide dedicated 'resolve' and 'reject' methods.
 */
export default class Painter {
  constructor(canvas) {
    this[p.canvas] = canvas;
    this[p.context] = canvas.getContext('2d');
    this[p.width] = canvas.width;
    this[p.height] = canvas.height;

    this[p.styleColor] = '#000';
    this[p.styleWidth] = 2;

    this[p.currentPoint] = { x: 0, y: 0 };
    this[p.previousPoint] = { x: 0, y: 0 };
    this[p.flag] = false;

    canvas.addEventListener('mousemove', (e) => this[p.findXY]('move', e));
    canvas.addEventListener('mousedown', (e) => this[p.findXY]('down', e));
    canvas.addEventListener('mouseup', (e) => this[p.findXY]('up', e));
    canvas.addEventListener('mouseout', (e) => this[p.findXY]('out', e));

    Object.seal(this);
  }

  setStyle(color, width) {
    if (!color) {
      throw new Error('Color should a valid non-empty HEX color string!');
    }

    if (!Number.isInteger(width) || width < 0) {
      throw Error('Width should a valid positive integer!');
    }

    this[p.styleColor] = color;
    this[p.styleWidth] = width;
  }

  clear() {
    this[p.context].clearRect(0, 0, this[p.width], this[p.height]);
  }

  [p.findXY](res, e) {
    //const canvas = this[p.canvas];

    //let x, y;
    /*if (e.layerX || e.layerX === 0) {
      x = e.layerX;
      y = e.layerY;
    } else if (e.offsetX || e.offsetX === 0) {*/
      const x = e.offsetX;
      const y = e.offsetY;

    //}

    if (res === 'down') {
      console.log(`e.offsetX: ${e.offsetX}, e.offsetY: ${e.offsetY}`);
      this[p.previousPoint] = this[p.currentPoint];
      this[p.currentPoint] = {x, y};
      //  x: x, //e.clientX - canvas.offsetLeft,
      //  y: y//e.clientY - canvas.offsetTop
      //};

      this[p.flag] = true;

      const context = this[p.context];
      context.beginPath();
      context.fillStyle = this[p.styleColor];
      context.fillRect(
        this[p.currentPoint].x, this[p.currentPoint].y, this[p.styleWidth],
        this[p.styleWidth]
      );
      context.closePath();
    } else if (res === 'up' || res === 'out') {
      this[p.flag] = false;
    } else if (res === 'move' && this[p.flag]) {
      this[p.previousPoint] = this[p.currentPoint];
      this[p.currentPoint] = {x, y};
      //  x: x,//e.clientX - canvas.offsetLeft,
      //  y: y//e.clientY - canvas.offsetTop
      // };

      this[p.draw]();
    }
  }

  [p.draw]() {
    const context = this[p.context];

    context.beginPath();
    context.moveTo(this[p.previousPoint].x, this[p.previousPoint].y);
    context.lineTo(this[p.currentPoint].x, this[p.currentPoint].y);
    context.strokeStyle = this[p.styleColor];
    context.lineWidth = this[p.styleWidth];
    context.stroke();
    context.closePath();
  }
}

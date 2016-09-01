const p = Object.freeze({
  getUserMediaOld: Symbol('getUserMediaOld')
});

export default class VideoManager {
  getMediaStream(video = { facingMode: 'environment' }, audio = false) {
    // Older browsers might not implement mediaDevices at all, so we set an
    // empty object first.
    if(navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an
    // object with getUserMedia as it would overwrite existing properties. Here,
    // we will just add the getUserMedia property if it's missing.
    if(navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = this[p.getUserMediaOld];
    }

    return navigator.mediaDevices.getUserMedia({ audio, video }).then(
      (stream) => {
        console.log('[VideoManager]: Media stream is available.');

        return stream;
      }
    ).catch((err) => {
      console.error('[VideoManager]: Media stream is not available.', err);

      throw err;
    });
  }

  [p.getUserMediaOld](constraints) {
    const getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia);

    // Some browsers just don't implement it - return a rejected promise with an
    // error to keep a consistent interface.
    if(!getUserMedia) {
      return Promise.reject(
        new Error('getUserMedia is not implemented in this browser')
      );
    }

    return new Promise((resolve, reject) => {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}

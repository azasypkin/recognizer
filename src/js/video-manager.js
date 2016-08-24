export default class VideoManager {
  getMediaStream(video = true, audio = false) {
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
}

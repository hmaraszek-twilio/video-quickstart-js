'use strict';

/**
 * Set the snapshot dimensions to match the LocalVideoTrack.
 * @param {HTMLCanvasElement|HTMLImageElement} snapshot
 * @param {LocalVideoTrack} localVideoTrack
 */
function setSnapshotSizeToVideo(snapshot, localVideoTrack) {
  const { width, height } = localVideoTrack.dimensions;
  snapshot.width = width;
  snapshot.height = height;
}

/**
 * Take a snapshot of the local video and render it into the supplied element.
 * ImageCapture is preferred where available; the canvas path is the fallback.
 * @param {HTMLVideoElement} video
 * @param {LocalVideoTrack} localVideoTrack
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} image
 * @returns {Promise<void>}
 */
async function takeLocalVideoSnapshot(video, localVideoTrack, canvas, image) {
  setSnapshotSizeToVideo(canvas, localVideoTrack);
  setSnapshotSizeToVideo(image, localVideoTrack);

  if (window.ImageCapture) {
    const imageCapture = new ImageCapture(localVideoTrack.mediaStreamTrack);
    const blob = await imageCapture.takePhoto();
    image.src = URL.createObjectURL(blob);
    image.classList.remove('d-none');
    canvas.classList.add('d-none');
    return;
  }

  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.classList.remove('d-none');
  image.classList.add('d-none');
}

module.exports = takeLocalVideoSnapshot;

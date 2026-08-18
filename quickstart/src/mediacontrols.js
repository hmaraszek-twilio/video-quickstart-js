'use strict';

const $muteAudio = $('#mute-audio');
const $muteVideo = $('#mute-video');

function updateButton($button, track, enabledLabel, disabledLabel, kind) {
  const isEnabled = !!track && track.isEnabled;
  const label = isEnabled ? enabledLabel : disabledLabel;
  const state = isEnabled ? 'enabled' : 'disabled';

  $button
    .text(label)
    .attr('aria-label', label)
    .attr('aria-pressed', !isEnabled)
    .attr('title', `${kind} ${state}`)
    .toggleClass('media-control-disabled', !isEnabled);
}

/**
 * Set up local microphone and camera controls for a connected Room.
 * @param {Object} tracks - LocalTrack accessors
 * @param {Function} onError - Error callback
 * @returns {Object} Cleanup and state-refresh functions
 */
function setupMediaControls(tracks, onError) {
  const getAudioTrack = tracks.getAudioTrack;
  const getVideoTrack = tracks.getVideoTrack;

  const update = () => {
    updateButton($muteAudio, getAudioTrack(), 'Mute mic', 'Unmute mic', 'Microphone');
    updateButton($muteVideo, getVideoTrack(), 'Turn camera off', 'Turn camera on', 'Camera');
  };

  const toggleTrack = (getTrack, kind) => {
    const track = getTrack();
    if (!track) {
      return;
    }

    try {
      if (track.isEnabled) {
        track.disable();
      } else {
        track.enable();
      }
      update();
    } catch (error) {
      onError(error);
    }
  };

  const audioClickHandler = () => toggleTrack(getAudioTrack, 'audio');
  const videoClickHandler = () => toggleTrack(getVideoTrack, 'video');
  const audioStateHandler = () => update();
  const videoStateHandler = () => update();

  $muteAudio.prop('disabled', false).click(audioClickHandler);
  $muteVideo.prop('disabled', false).click(videoClickHandler);

  const audioTrack = getAudioTrack();
  const videoTrack = getVideoTrack();
  if (audioTrack) {
    audioTrack.on('enabled', audioStateHandler);
    audioTrack.on('disabled', audioStateHandler);
  }
  if (videoTrack) {
    videoTrack.on('enabled', videoStateHandler);
    videoTrack.on('disabled', videoStateHandler);
  }
  update();

  return {
    cleanup: () => {
      $muteAudio.off('click', audioClickHandler).prop('disabled', true);
      $muteVideo.off('click', videoClickHandler).prop('disabled', true);
      if (audioTrack) {
        audioTrack.off('enabled', audioStateHandler);
        audioTrack.off('disabled', audioStateHandler);
      }
      if (videoTrack) {
        videoTrack.off('enabled', videoStateHandler);
        videoTrack.off('disabled', videoStateHandler);
      }
    },
    update
  };
}

module.exports = setupMediaControls;

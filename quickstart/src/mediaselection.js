'use strict';

const {
  applyAudioOutputDeviceSelection,
  applyInputDeviceSelection,
  getDeviceSelectionOptions,
  getTrackDeviceId
} = require('./mediadevices');

const $selectMedia = $('#select-media');
const $modal = $('#select-media-modal');
const $audioInput = $('#audio-input', $modal);
const $videoInput = $('#video-input', $modal);
const $audioOutput = $('#audio-output', $modal);
const $apply = $('#apply-media-devices', $modal);
const $error = $('#media-device-error', $modal);
const $audioOutputHelp = $('#audio-output-help', $modal);

function deviceLabel(device) {
  return device.label || `Device [ id: ${device.deviceId.substr(0, 5)}... ]`;
}

function populateSelect($select, devices, selectedDeviceId) {
  $select.empty();
  devices.forEach(device => {
    const option = $('<option>')
      .val(device.deviceId)
      .text(deviceLabel(device));
    if (device.deviceId === selectedDeviceId) {
      option.prop('selected', true);
    }
    $select.append(option);
  });
  $select.prop('disabled', devices.length === 0);
}

function setError(error) {
  $error
    .text(error ? error.message : '')
    .toggleClass('d-none', !error);
}

async function populateDeviceSelectors(getAudioTrack, getVideoTrack) {
  const devices = await getDeviceSelectionOptions();
  populateSelect($audioInput, devices.audioinput, getTrackDeviceId(getAudioTrack()));
  populateSelect($videoInput, devices.videoinput, getTrackDeviceId(getVideoTrack()));

  if (typeof HTMLMediaElement.prototype.setSinkId === 'function') {
    populateSelect($audioOutput, devices.audiooutput, localStorage.getItem('audioOutputDeviceId'));
    $audioOutputHelp.text('');
  } else {
    $audioOutput.empty().append($('<option>').text('Not supported by this browser'));
    $audioOutput.prop('disabled', true);
    $audioOutputHelp.text('Audio output selection is not supported by this browser.');
  }
}

/**
 * Set up live media input and output selection for a connected Room.
 * @param {Object} tracks - Track accessors and mutators
 * @param {Function} onError - Error callback
 * @returns {Function} Cleanup callback
 */
function setupMediaDeviceSelection(tracks, onError) {
  const getAudioTrack = tracks.getAudioTrack;
  const getVideoTrack = tracks.getVideoTrack;
  const setAudioTrack = tracks.setAudioTrack;
  const setVideoTrack = tracks.setVideoTrack;

  const showModal = async () => {
    setError(null);
    try {
      await populateDeviceSelectors(getAudioTrack, getVideoTrack);
      $modal.modal({ focus: true, show: true });
    } catch (error) {
      onError(error);
    }
  };

  const applySelection = async () => {
    $apply.prop('disabled', true);
    setError(null);
    try {
      const audioTrack = getAudioTrack();
      const videoTrack = getVideoTrack();
      const selectedAudioId = $audioInput.val();
      const selectedVideoId = $videoInput.val();
      const selectedOutputId = $audioOutput.val();

      if (audioTrack && selectedAudioId && selectedAudioId !== getTrackDeviceId(audioTrack)) {
        await applyInputDeviceSelection(
          audioTrack,
          selectedAudioId,
          'audio',
          audioTrack.mediaStreamTrack.getConstraints());
        setAudioTrack(audioTrack);
        localStorage.setItem('audioDeviceId', selectedAudioId);
      }

      if (videoTrack && selectedVideoId && selectedVideoId !== getTrackDeviceId(videoTrack)) {
        await applyInputDeviceSelection(
          videoTrack,
          selectedVideoId,
          'video',
          videoTrack.mediaStreamTrack.getConstraints());
        setVideoTrack(videoTrack);
        localStorage.setItem('videoDeviceId', selectedVideoId);
      }

      if (selectedOutputId && typeof HTMLMediaElement.prototype.setSinkId === 'function') {
        const outputElements = $participantsAudioElements();
        await Promise.all(outputElements.map(audio => (
          applyAudioOutputDeviceSelection(audio, selectedOutputId)
        )));
        localStorage.setItem('audioOutputDeviceId', selectedOutputId);
      }

      $modal.modal('hide');
    } catch (error) {
      setError(error);
      onError(error, true);
    } finally {
      $apply.prop('disabled', false);
    }
  };

  const $participantsAudioElements = () => Array.from(
    document.querySelectorAll('#participants audio')
  );
  const deviceChangeHandler = () => {
    if ($modal.hasClass('show')) {
      populateDeviceSelectors(getAudioTrack, getVideoTrack).catch(onError);
    }
  };

  $selectMedia.prop('disabled', false).click(showModal);
  $apply.click(applySelection);
  navigator.mediaDevices.addEventListener('devicechange', deviceChangeHandler);

  return () => {
    $selectMedia.off('click', showModal).prop('disabled', true);
    $apply.off('click', applySelection);
    navigator.mediaDevices.removeEventListener('devicechange', deviceChangeHandler);
  };
}

module.exports = setupMediaDeviceSelection;

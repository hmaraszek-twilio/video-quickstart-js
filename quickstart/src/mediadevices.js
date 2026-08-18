'use strict';

const { createLocalAudioTrack, createLocalVideoTrack } = require('twilio-video');

/**
 * Get media devices grouped by the kinds used by the selector.
 * @returns {Promise<Object>} Available audio and video devices.
 */
async function getDeviceSelectionOptions() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.reduce((options, device) => {
    if (device.kind === 'audioinput') {
      options.audioinput.push(device);
    } else if (device.kind === 'videoinput') {
      options.videoinput.push(device);
    } else if (device.kind === 'audiooutput') {
      options.audiooutput.push(device);
    }
    return options;
  }, { audioinput: [], audiooutput: [], videoinput: [] });
}

/**
 * Get the active input device ID for a LocalTrack.
 * @param {LocalTrack|null} track
 * @returns {string|null}
 */
function getTrackDeviceId(track) {
  if (!track || !track.mediaStreamTrack || !track.mediaStreamTrack.getSettings) {
    return null;
  }
  return track.mediaStreamTrack.getSettings().deviceId || null;
}

/**
 * Restart an existing LocalTrack on a selected input, or create one if absent.
 * @param {LocalTrack|null} track
 * @param {string} deviceId
 * @param {'audio'|'video'} kind
 * @param {Object} [baseConstraints] - Existing capture constraints to preserve
 * @returns {Promise<LocalTrack>}
 */
async function applyInputDeviceSelection(track, deviceId, kind, baseConstraints = {}) {
  const constraints = Object.assign({}, baseConstraints, { deviceId: { exact: deviceId } });
  if (track) {
    await track.restart(constraints);
    return track;
  }
  return kind === 'audio'
    ? createLocalAudioTrack(constraints)
    : createLocalVideoTrack(constraints);
}

/**
 * Apply an audio output device to an audio element.
 * @param {HTMLAudioElement} audio
 * @param {string} deviceId
 * @returns {Promise<void>}
 */
function applyAudioOutputDeviceSelection(audio, deviceId) {
  if (typeof audio.setSinkId !== 'function') {
    return Promise.reject(new Error('This browser does not support selecting an audio output device.'));
  }
  return audio.setSinkId(deviceId);
}

module.exports = {
  applyAudioOutputDeviceSelection,
  applyInputDeviceSelection,
  getDeviceSelectionOptions,
  getTrackDeviceId
};

'use strict';

/**
 * Render the LocalParticipant's Network Quality level.
 * @param {jQuery} $indicator - Network Quality indicator element
 * @param {number|null} level - Network Quality level from 0 to 5
 */
function updateNetworkQualityIndicator($indicator, level) {
  const normalizedLevel = Number(level);
  const isKnown = Number.isInteger(normalizedLevel)
    && normalizedLevel >= 1
    && normalizedLevel <= 5;
  const qualityClass = !isKnown
    ? 'network-quality-unknown'
    : normalizedLevel >= 4
      ? 'network-quality-good'
      : normalizedLevel >= 2
        ? 'network-quality-fair'
        : 'network-quality-poor';
  const text = isKnown ? `Network: ${normalizedLevel}/5` : 'Network: —';
  const accessibleText = isKnown
    ? `Network quality ${normalizedLevel} out of 5`
    : 'Network quality unavailable';

  $indicator
    .removeClass('network-quality-unknown network-quality-good network-quality-fair network-quality-poor')
    .addClass(qualityClass)
    .text(text)
    .attr('aria-label', accessibleText)
    .attr('title', accessibleText);
}

module.exports = updateNetworkQualityIndicator;

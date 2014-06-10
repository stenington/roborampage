window.addEventListener('load', function() {
  // Steal focus in viewing mode, not editing mode
  if (window.self.frameElement && window.self.frameElement.hasAttribute('allowfullscreen')) {
    document.getElementById('canvas').focus();
  }
});

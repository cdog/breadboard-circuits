(function ($) {
  'use strict';

  function loadParts() {
    var parts = localStorage.getItem('parts');

    if (parts !== null) {
      Wyliodrin.breadboard.parts = JSON.parse(parts);

      $(window).trigger('loaded.wyliodrin.parts');

      return;
    }

    $.ajax({
      success: function (data) {
        try {
          localStorage.setItem('parts', JSON.stringify(data));
        } catch (exception) {
          // Nothing to do.
        }

        Wyliodrin.breadboard.parts = data;

        $(window).trigger('loaded.wyliodrin.parts');
      },
      url: Wyliodrin.breadboard.partsPath,
      xhr: function () {
        var xhr = new window.XMLHttpRequest();

        xhr.addEventListener('progress', function (event) {
          if (event.lengthComputable) {
            /* eslint no-unused-vars: 0 */
            var progress = event.loaded / event.total;
          }
        }, false);

        return xhr;
      }
    });
  }

  loadParts();
})(jQuery);

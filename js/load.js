(function ($) {
  'use strict';

  function loadParts() {
    var parts = localStorage.getItem('parts');

    if (parts !== null) {
      Wyliodrin.breadboard.parts = JSON.parse(parts);

      return;
    }

    NProgress.configure({
      showSpinner: false
    });

    $.ajax({
      success: function (data) {
        localStorage.setItem('parts', JSON.stringify(data));

        Wyliodrin.breadboard.parts = data;
      },
      url: Wyliodrin.breadboard.partsPath,
      xhr: function () {
        var xhr = new window.XMLHttpRequest();

        xhr.addEventListener('progress', function (event) {
          if (event.lengthComputable) {
            var progress = event.loaded / event.total;

            NProgress.set(progress);
          }
        }, false);

        return xhr;
      }
    });
  }

  loadParts();
})(jQuery);

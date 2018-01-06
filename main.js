
// Check for service worker
if (navigator.serviceWorker) {
  // Register service worker
  navigator.serviceWorker.register('sw.js').catch(console.error);

  // Giphy cache clean
  function giphyCacheClean(giphysArray) {
    // Get service worker registration
    navigator.serviceWorker.getRegistration().then(function(reg) {
      // Only send to the currently active service worker
      if (reg.active) reg.active.postMessage({ action: 'cleanGiphyCache', giphysArray:giphysArray })
    });
  }
}

// Giphy API object
var giphy = {
  url: 'https://api.giphy.com/v1/gifs/trending',
  query: {
    api_key: '54452c59b31e4d14aca213ec76014baa',
    limit: 12
  }
};

// Update trending giphys
function update() {
  // Toggle refresh state
  $('#update .icon').toggleClass('d-none');

  // Call Giphy API
  $.get( giphy.url, giphy.query)
    // Success
    .done( function (res) {
      // Empty Element
      $('#giphys').empty();

      // Populate array of latest Giphy's
      var latestGiphys = [];

      // Loop Giphys
      $.each( res.data, function (i, giphy) {
          // Add latest Giphy's
          latestGiphys.push(giphy.images.downsized_large.url);

          // Add Giphy HTML
          $('#giphys').prepend(
              '<div class="col-sm-6 col-md-4 col-lg-3 p-1">' +
                  '<img class="w-100 img-fluid" src="' + giphy.images.downsized_large.url + '">' +
              '</div>'
          );
      });

      if (navigator.serviceWorker) giphyCacheClean(latestGiphys);
    })

    // Failure
    .fail(function(){
      $('.alert').slideDown();
      setTimeout( function() { $('.alert').slideUp() }, 2000);
    })

    // Complete
    .always(function() {
      // Re-Toggle refresh state
      $('#update .icon').toggleClass('d-none');
    });

  // Prevent submission if originates from click
  return false;
}

// Manual refresh
$('#update a').click(update);

// Update trending giphys on load
update();

var $s = (function () {
  var me = {
  };


  me.fetchSongs = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:8085/data/songs.json');
    xhr.onload = function() {
      if (xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        console.info('songs found ' + json.length);
        me.songs = json;
        app.songs = me.songs;
      } else {
        console.error('Request failed.  Returned status of ' + xhr.status);
      }
    };
    xhr.send();

  }

  me.fetchSongs();
  return me;
}());

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    songs: [],
    playlist: [],
    playing: {},
    currentSlide: 0,
    searchTerm: undefined,
    toSlides: function(lyrics) {
      if (lyrics == undefined) return '';

      lines = lyrics.split('\n');
      var s = '';
      var addClass = 'current';
      for (idx in lines) {
        switch(lines[idx].trim()[0]) {
        case '[':
          s += '<p class="slide';
          switch (addClass) {
          case 'current':
            s += (' '+addClass);
            addClass='next';
            break;
          case 'next':
            s += (' '+addClass);
            addClass=undefined;
            break;
          }
          s += '">';
          break;
        case '.':
        case ';':
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
          s += lines[idx].substring(1);
          s += '<br/>';
          break;
        default:
          s += lines[idx];
          s += '<br/>';
        }
      }

      return s;
    }
  },
  methods: {
    match: function (songs) {
      if (app == undefined || app['searchTerm'] == undefined) return songs;
      return songs.filter(function (song) {
        return song.title.toLowerCase().indexOf(app.searchTerm.toLowerCase()) != -1
      })
    }
  }
})

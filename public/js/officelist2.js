(function() {
  var Listing, add_google_map_marker, add_listing_form, adding_markers, body, bubbles, display_left_panel, get_location, html, listing, listings, map, remove_adding_markers, render, render_add_listing, render_google_map, server, set;
  map = "";
  body = $("body");
  bubbles = [];
  "Listing = () ->\nyoutubes_urls : []\nyoutube_html: []\nimages : []\ndefault_youtube: \"\"\nfor_lease = \"\"\nlocation = \"\"\nsize = \"\"\nprice = \"\"\nprice_type = \"\"\ndescription = \"\"\nbuilt_out = \"\"\nlat = \"\"\nlng = \"\"";
  (function() {
    return ($.fn.typed = function(settings) {
      var config;
      config = {
        callback: function() {},
        wait: 750
      };
      if (settings) {
        $.extend(config, settings);
      }
      this.each(function() {
        var save, t, that;
        $(this).attr('old-val', $(this).val());
        that = this;
        save = function() {
          var old_val, val;
          val = $(that).val();
          old_val = $(that).attr("old-val");
          if (val !== old_val) {
            config.callback.call(that);
            return $(that).attr("old-val", val);
          }
        };
        t = "";
        $(this).keydown(function() {
          return clearTimeout(t);
        });
        return $(this).keyup(function() {
          return (t = setTimeout(save, config.wait));
        });
      });
      return this;
    });
  })(jQuery);
  server = function(method, args, func) {
    return $.ajax({
      type: "POST",
      url: ("/methods/" + (method)),
      data: {
        "args": JSON.stringify(args)
      },
      success: function(data) {
        return func && func(data);
      }
    });
  };
  server.req = function(args, func) {
    return server("request", args, func);
  };
  server.cr = function(args, func) {
    return server("create", args, func);
  };
  server.up = function(args, func) {
    return server("update", args, func);
  };
  server.del = function(args, func) {
    return server("delete", args, func);
  };
  server.addedit = function(args, func) {
    return server("addedit", args, func);
  };
  listings = [];
  listing = {
    saved: false,
    _user: username,
    size: "",
    price: "",
    desc: "",
    _type: "listing"
  };
  window.listing = listing;
  html = {
    div: function() {
      return $("<div><" + "/div>");
    },
    input: function() {
      return $("<input />");
    },
    br: function() {
      return $("<br />");
    },
    span: function() {
      return $("<span><\/span>");
    },
    button: function() {
      return $('<input type="button" />');
    }
  };
  render_google_map = function() {
    var div_map, latlng, myOptions;
    div_map = html.div().attr("id", "map").css({
      width: 800,
      height: 500,
      position: 'absolute',
      left: 300,
      top: 0
    });
    body.append(div_map);
    latlng = new google.maps.LatLng(33.4222685, -111.8226402);
    myOptions = {
      zoom: 11,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    return (map = new google.maps.Map(document.getElementById("map"), myOptions));
  };
  render = function() {
    var add_listing, map_div;
    map_div = render_google_map();
    add_listing = render_add_listing(listing);
    return body.append(add_listing);
  };
  set = function() {};
  Listing = {
    set: function(listing, k, v) {
      var loc;
      listing[k] = v;
      if (k === "location") {
        loc = get_location(v, function(loc) {
          listing.lat = loc.lat();
          listing.lng = loc.lng();
          add_google_map_marker(listing);
          return map.setCenter(loc);
        });
      }
      return listing.bubble && listing.bubble.view ? $(".bubble." + (k)).text(v) : null;
    },
    save: function(listing, callback) {
      if (listing.bubble) {
        delete listing.bubble;
      }
      return server.addedit(listing, callback);
    }
  };
  adding_markers = [];
  remove_adding_markers = function() {
    var _a, _b, _c, _d, i;
    _a = []; _c = adding_markers;
    for (_b = 0, _d = _c.length; _b < _d; _b++) {
      i = _c[_b];
      _a.push(i.setMap(null));
    }
    return _a;
  };
  get_location = function(wherethe, callback) {
    var geocoder;
    geocoder = new google.maps.Geocoder();
    return geocoder.geocode({
      address: wherethe
    }, function(results, status) {
      return status === google.maps.GeocoderStatus.OK ? callback(results[0].geometry.location) : alert("there was a looking up problem");
    });
  };
  add_google_map_marker = function(listing, callback) {
    var bubble_open, loc, marker, marker_options;
    loc = new google.maps.LatLng(listing.lat, listing.lng);
    marker_options = {
      position: loc,
      map: map,
      title: "hello world"
    };
    if (listing._user === username) {
      marker_options.draggable = true;
    }
    marker = new google.maps.Marker(marker_options);
    if (listing.saved === false) {
      remove_adding_markers();
      adding_markers.push(marker);
    }
    bubble_open = function() {
      var _a, _b, _c, blubbles, bubble, bubbly, info;
      info = ("<pre>\n<span class=\"bubble location\">" + (listing.location) + "</span>\n<span class=\"bubble size\">" + (listing.size) + "</span>\n<span class=\"bubble price\">" + (listing.price) + "</span>\n<span class=\"bubble desc\">" + (listing.desc) + "</span>\n</pre>");
      bubble = new google.maps.InfoWindow({
        content: info
      });
      _b = bubbles;
      for (_a = 0, _c = _b.length; _a < _c; _a++) {
        bubbly = _b[_a];
        bubbly.close();
      }
      blubbles = [];
      bubbles.push(bubble);
      bubble.open(map, marker);
      return (listing.bubble = bubble);
    };
    google.maps.event.addListener(marker, "click", bubble_open);
    return listing.saved === false ? bubble_open() : null;
  };
  render_add_listing = function(listing) {
    var listing_div, save_listing_button;
    listing_div = $(add_listing_form());
    save_listing_button = listing_div.find("#save_listing");
    listing_div.find("#location").typed({
      wait: 2000,
      callback: function(text) {
        return Listing.set(listing, $(this).attr("id"), $(this).val());
      }
    });
    listing_div.find("input[type='text'], textarea").keyup(function(e) {
      return $(this).attr("id") !== "location" ? Listing.set(listing, $(this).attr("id"), $(this).val()) : null;
    });
    save_listing_button.click(function() {
      var location, price;
      location = $(".add.location").val();
      price = $(".add.location").val();
      return Listing.save(listing, function() {
        return console.log("saved");
      });
    });
    return listing_div;
  };
  add_listing_form = function() {
    return "<pre>\n<select id=\"for_lease\">\n  <option>For Lease</option>\n  <option>For Purchase</option>\n</select>\nLocation\n<input id=\"location\">\nSize\n<input id=\"size\">\nPrice\n<input id=\"price\">\nDescription\n<textarea id=\"desc\"></textarea>\n<select id=\"built_out\">\n  <option>Built out</option>\n  <option>Not built out</option>\n</select>\nYoutube Video\n<input id=\"youtube\" />\n<a href=\"#\">Add another youtube video</a>\n<input type=\"button\" id=\"save_listing\" value=\"Save\"/>\n</pre>";
  };
  display_left_panel = function() {};
  $(document).ready(function() {
    listings = server.req({
      type: "listing",
      wh: {}
    }, function(data) {
      return console.log(data);
    });
    render();
    return null;
    return server.cr({
      type: "listing",
      obj: {
        price: 100,
        _public: true
      }
    });
  });
})();

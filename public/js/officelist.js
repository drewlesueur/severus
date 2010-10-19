(function() {
  var add_google_map_marker, add_search_result, bubbles, clear_video_when_map_closes, current_listing, dom_updated, floating_video, gEvent, interval, is_webkit, map, map_move_listener, markers, remove_markers, reposition_map, rpc, timeout, user, vid_height, vid_width;
  user = "";
  current_listing = "";
  bubbles = [];
  is_webkit = function() {
    return navigator.userAgent.match(/webkit/i);
  };
  vid_height = 344;
  vid_width = 425;
  rpc = function(method, params, good) {
    return $.ajax({
      type: "POST",
      url: "/methods/" + method,
      data: params,
      success: good,
      error: function(e) {
        alert(e.status);
        return alert(e.responseText);
      }
    });
  };
  map = "";
  markers = [];
  remove_markers = function() {
    var _a, _b, _c, _d, i;
    _a = []; _c = markers;
    for (_b = 0, _d = _c.length; _b < _d; _b++) {
      i = _c[_b];
      _a.push(i.setMap(null));
    }
    return _a;
  };
  add_google_map_marker = function(wherethe) {
    var geocoder;
    remove_markers();
    geocoder = new google.maps.Geocoder();
    return geocoder.geocode({
      address: wherethe
    }, function(results, status) {
      var marker;
      if (status === google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        marker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: map,
          title: "hello world",
          draggable: true
        });
        return markers.push(marker);
      } else {
        return alert("Geocode was not successful for the following reason: " + status);
      }
    });
  };
  map_move_listener = "";
  gEvent = function(obj, event, func) {
    return google.maps.event.addListener(obj, event, func);
  };
  timeout = function(time, func) {
    return setTimeout(func, time);
  };
  interval = function(time, func) {
    return setInterval(func, time);
  };
  reposition_map = function(helper) {
    try {
      return $('#current_video').css({
        top: $('#video_position').offset().top - 10,
        left: $('#video_position').offset().left
      });
    } catch (e) {
      return "just skip it";
    }
  };
  clear_video_when_map_closes = function(bubble) {
    return google.maps.event.addListener(bubble, 'closeclick', function() {
      return $("#current_video").remove();
    });
  };
  "  \nmove_video_when_map_moves = () ->\nmap_move_listener = google.maps.event.addListener map, 'center_changed', () ->\n  reposition_map \"center_changed\"\nmap_move_listener = google.maps.event.addListener map, 'zoom_changed', () ->\n  reposition_map \"zoom_changed\" # not working?!\n\ninitial_position_video = (bubble) ->\ndom_ready_listener = google.maps.event.addListener bubble, 'domready', () ->\n  #reposition_map \"domready\"\ndom_ready_listener = google.maps.event.addListener bubble, 'position_changed', () ->\n  console.log \"position changed\"\n  reposition_map \"position_changed\"";
  dom_updated = false;
  floating_video = function() {
    return true;
    return is_webkit();
  };
  add_search_result = function(listing) {
    var marker;
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(listing.lat, listing.lng),
      map: map
    });
    if (listing.user === user) {
      marker.setDraggable(true);
    }
    return google.maps.event.addListener(marker, "click", function() {
      var bubble, center_event, info, the_interval, vid;
      info = $("<div style='width: 450px; height: 475px;'><br /></div>");
      rpc("get_listing_images", {
        id: listing.id
      }, function(data) {
        return console.log(data);
      });
      if ("default_youtube" in listing) {
        console.log("has youtube");
        if (floating_video()) {
          vid = $("<div id='current_video'></div>");
          vid.append(listing.default_youtube);
          vid.css({
            position: "absolute"
          });
          $(document.body).append(vid);
          info.append($("<div id='video_position'>&nbsp;</div>"));
        } else {
          info.append(listing.default_youtube);
        }
      } else if ("default_image" in listing) {
        info.append("<img src=\"" + (listing.default_image) + "\" />");
      }
      info.append("<table style=\"border-collapse: collapse;\">\n  <tr>\n    <td height=\"330\">\n    </td>\n  </tr>\n  <tr>\n    <td width=\"70%\" valign=\"top\">\n      <h3>test " + (listing.location) + "</h3>\n      <div>" + (listing.description) + "</div>\n    <td>\n    <td width=\"30%\" valign=\"top\">\n      " + (listing.price) + " " + (listing.price_type) + "\n      <br>\n      " + (listing.size) + "\n      " + (listing.built) + " " + (listing.type) + "\n    <td>\n  </tr>\n  <tr>\n    <td colspan=\"2\" >\n      <div id=\"more_links\" style=\"position: absolute;\">\n        <a href=\"#\" id=\"contact\">Contact</a>\n        <a href=\"#\" id=\"more\">More&#x25bc;</a>\n      </div>\n    </td>\n  </tr>\n</table>");
      info.find("#more").click(function(e) {
        var extra_box;
        if ($("#extra_box").length > 0) {
          $("#extra_box").remove();
          return null;
        }
        e.preventDefault();
        extra_box = $('<div id="extra_box"> hellow wolrld</div>');
        extra_box.css({
          position: 'abosolute',
          border: '1px solid black',
          width: 100,
          height: 50,
          "background-color": 'white'
        });
        extra_box.text("Video");
        return $("#more_links").append(extra_box);
      });
      bubble = new google.maps.InfoWindow({
        content: info[0]
      });
      _.each(bubbles, function(bubble) {
        return bubble.close();
      });
      bubbles = [];
      bubbles.push(bubble);
      bubble.open(map, marker);
      the_interval = "";
      if (floating_video()) {
        gEvent(bubble, 'closeclick', function() {
          $('#current_video').remove();
          google.maps.event.removeListener(center_event);
          return clearInterval(the_interval);
        });
        center_event = "var";
        gEvent(bubble, 'domready', function() {
          timeout(500, function() {
            return reposition_map();
          });
          return timeout(1000, function() {
            reposition_map();
            interval(1000, function() {
              return reposition_map();
            });
            return (center_event = gEvent(map, 'center_changed', reposition_map));
          });
        });
      }
      if (listing.user === user) {
        $("h3.edit_listing").click();
        $(".edit_listing [name='location']").val(listing.location);
        $(".edit_listing [name='size']").val(listing.size);
        $(".edit_listing [name='price']").val(listing.price);
        $(".edit_listing [name='price_type']").val(listing.price_type);
        $(".edit_listing [name='price_type']").val(listing.price_type);
        $(".edit_listing [name='nnn']").val(listing.nnn);
        $(".edit_listing [name='description']").val(listing.description);
        $(".edit_listing [name='built']").val(listing.built);
        current_listing = listing.id;
        return (markers = [marker]);
      }
    });
  };
  $(document).ready(function() {
    var add_image_count, add_youtube_count, button, initialize, the_height;
    user = $("#user").attr("data-officelist-user");
    initialize = function() {
      var latlng, myOptions;
      latlng = new google.maps.LatLng(33.4222685, -111.8226402);
      myOptions = {
        zoom: 11,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map"), myOptions);
      return rpc("get_all_listings", {}, function(data) {
        return _.each(data, function(listing) {
          return add_search_result(listing);
        });
      });
    };
    initialize();
    $('#main_table').css({
      height: $(window).height() + "px"
    });
    the_height = $("#map").parent().height() + "px";
    $("#map").css({
      height: the_height
    });
    $("#left_side").accordion({
      autoHeight: false
    });
    $("#location").change(function(e) {
      return add_google_map_marker($(this).val());
    });
    $("#add_form").submit(function(e) {
      var data, lat, lat_lng, lng;
      try {
        data = $("#add_form").serializeArray();
        if (markers.length === 0) {
          $("#location").change();
        }
        lat_lng = markers[0].getPosition();
        lat = lat_lng.lat();
        lng = lat_lng.lng();
        data.push({
          name: "lat",
          value: lat
        });
        data.push({
          name: "lng",
          value: lng
        });
        rpc("add_listing", data, function(ret) {
          var listing;
          alert("listing added");
          listing = {};
          _.each(data, function(item) {
            return (listing[item.name] = item.value);
          });
          listing.id = ret.result.insertId;
          if ("youtubes" in ret.result) {
            listing.youtube_htmls = ret.result.youtubes;
            if (ret.result.youtubes.length > 0) {
              listing.default_youtube = ret.result.youtubes[0];
            }
          }
          listing.user = user;
          add_search_result(listing);
          remove_markers();
          return console.log("added", listing);
        });
        e.preventDefault();
        return false;
      } catch (e) {
        alert(e);
        return false;
      }
    });
    $("#edit_form").submit(function(e) {
      var data, lat, lat_lng, lng;
      try {
        data = $("#edit_form").serializeArray();
        lat_lng = markers[0].getPosition();
        lat = lat_lng.lat();
        lng = lat_lng.lng();
        data.push({
          name: "lat",
          value: lat
        });
        data.push({
          name: "lng",
          value: lng
        });
        data.push({
          name: "id",
          value: current_listing
        });
        rpc("edit_listing", data, function() {
          return alert("listing edited");
        });
        e.preventDefault();
        return false;
      } catch (e) {
        alert(e);
        return false;
      }
    });
    $(".multi").MultiFile();
    button = $("#add_upload");
    add_image_count = 0;
    add_youtube_count = 0;
    new AjaxUpload(button, {
      action: "/upload-image",
      name: "myfile",
      onSubmit: function(file, text) {
        button.text("Uploading");
        return this.disable();
      },
      onComplete: function(file, response) {
        var input;
        input = $("<input type='hidden'>");
        input.val("/images/medium/" + response);
        input.attr("name", "images[" + (add_image_count) + "]");
        $("#add_form").append(input);
        add_image_count += 1;
        button.text("Add Another");
        this.enable();
        return $('<img style="display: block; margin: 3px;">').appendTo('#add_files_list').attr("src", "/images/thumbs/" + (response));
      }
    });
    return $("#add_youtube").click(function(e) {
      var a, input;
      input = $("<input class='youtube_inupt' type='text'>");
      add_youtube_count += 1;
      input.attr("name", "youtube[" + add_youtube_count + "]");
      a = $("<a href='#'>Remove</a>");
      a.click(function(e) {
        $(this).prev().remove();
        $(this).remove();
        return false;
      });
      $("#add_youtube_box").append(input).append(a);
      return false;
    });
  });
})();

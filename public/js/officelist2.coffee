map = ""
body = $("body") 
bubbles = []

"""
Listing = () ->
  youtubes_urls : []
  youtube_html: []
  images : []
  default_youtube: ""
  for_lease = ""
  location = ""
  size = ""
  price = ""
  price_type = ""
  description = ""
  built_out = ""
  lat = ""
  lng = ""
"""

# simple autosave deal for jquery
(() ->
  $.fn.typed = (settings) ->
    config = 
      callback: () ->
      wait: 750
    if settings
      $.extend config, settings
    this.each () ->
      $(this).attr 'old-val', $(this).val()
      that = this
      save = () ->
        val = $(that).val()
        old_val = $(that).attr "old-val"
        if val isnt old_val
          config.callback.call that
          $(that).attr "old-val", val
      t = ""
      $(this).keydown () ->
        clearTimeout t
      $(this).keyup () ->
        t = setTimeout save, config.wait
    return this
)(jQuery)
    

    

server = (method, args, func) ->
  $.ajax
    type: "POST",
    url : "/methods/#{method}"
    data: {"args": JSON.stringify(args)}
    success: (data) ->
      func and func data

server.req = (args, func) ->
  server "request", args, func

server.cr = (args, func) ->
  server "create", args, func

server.up = (args, func) ->
  server "update", args, func

server.del = (args, func) ->
  server "delete", args, func

server.addedit = (args, func) ->
  server "addedit", args, func

listings = []


listing =  # the listing you are adding
  saved: false
  _user: username
  size: ""
  price: ""
  desc: ""
  _type: "listing"
  
window.listing = listing

html = 
  div : () ->
    $("<div><"+"/div>")
  input: () ->
    $("<input />")
  br: ->
    $("<br />")
  span:  ->
    $("<span><\/span>")
  button: () ->
    $('<input type="button" />')
  
    
    
render_google_map = () ->
  div_map = html.div().attr("id", "map").css
    width: 800
    height: 500
    position: 'absolute'
    left: 300
    top: 0
    
  body.append div_map
  latlng = new google.maps.LatLng(33.4222685, -111.8226402)
  myOptions = {
    zoom: 11,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map"),myOptions)


 
render = () ->
  map_div = render_google_map()
  add_listing = render_add_listing(listing)
  body.append add_listing

set = () ->
  
Listing = 
  set: (listing, k, v) ->
    listing[k] = v #whatever the global listing is now
    if k is "location"
      loc = get_location v, (loc) ->
        listing.lat = loc.lat()
        listing.lng = loc.lng()
        add_google_map_marker listing
        map.setCenter loc
    if listing.bubble && listing.bubble.view
      $(".bubble.#{k}").text v
  
  save: (listing, callback) ->
    
    if listing.bubble
      delete listing.bubble
    
    server.addedit listing, callback 


    
adding_markers = []

remove_adding_markers = () ->
  for i in adding_markers
    i.setMap null

get_location = (wherethe, callback) ->
  geocoder = new google.maps.Geocoder()
  geocoder.geocode address: wherethe, (results, status) ->
    if status is google.maps.GeocoderStatus.OK
      callback(results[0].geometry.location)
    else
      alert "there was a looking up problem"
    
add_google_map_marker = (listing, callback) ->
    loc = new google.maps.LatLng listing.lat, listing.lng
    marker_options = 
      position: loc
      map: map
      title: "hello world"
    
    if listing._user is username
      marker_options.draggable = true
    marker = new google.maps.Marker marker_options
     
    if listing.saved is false
      remove_adding_markers()
      adding_markers.push marker
      
    bubble_open = () ->
      info = """
      <pre>
      <span class="bubble location">#{listing.location}</span>
      <span class="bubble size">#{listing.size}</span>
      <span class="bubble price">#{listing.price}</span>
      <span class="bubble desc">#{listing.desc}</span>
      </pre>
      """
      bubble = new google.maps.InfoWindow
        content: info
      for bubbly in bubbles
        bubbly.close()
      blubbles = []
      bubbles.push bubble
      bubble.open map, marker
      listing.bubble = bubble
      
    google.maps.event.addListener marker, "click", bubble_open   
    if listing.saved is false
      bubble_open()
    

render_add_listing = (listing) ->
  listing_div = $ add_listing_form()
  save_listing_button =listing_div.find "#save_listing"
  
  listing_div.find("#location").typed
    wait: 2000
    callback: (text) ->
      Listing.set listing, $(this).attr("id"), $(this).val()
  listing_div.find("input[type='text'], textarea").keyup (e) ->
    if $(this).attr("id") != "location"
      Listing.set listing, $(this).attr("id"), $(this).val()
  
  save_listing_button.click () ->
    location = $(".add.location").val()
    price = $(".add.location").val()
    Listing.save listing, () ->
      console.log "saved"
  return listing_div
  

add_listing_form = () ->
  """
  <pre>
  <select id="for_lease">
    <option>For Lease</option>
    <option>For Purchase</option>
  </select>
  Location
  <input id="location">
  Size
  <input id="size">
  Price
  <input id="price">
  Description
  <textarea id="desc"></textarea>
  <select id="built_out">
    <option>Built out</option>
    <option>Not built out</option>
  </select>
  Youtube Video
  <input id="youtube" />
  <a href="#">Add another youtube video</a>
  <input type="button" id="save_listing" value="Save"/>
  </pre>
  """
  
  
display_left_panel = () ->
  
  
  
$(document).ready () ->
  listings = server.req
    type: "listing"
    wh: {}
    , (data) ->
      console.log data
  
  render()
  return
  
  server.cr
    type: "listing"
    obj:
      price: 100
      _public: true
      



  


  


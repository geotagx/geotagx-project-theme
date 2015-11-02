/*
 * The GeoTag-X OpenLayers wrapper.
 */
;(function(geotagx, $, undefined){
	"use strict";
	/**
	 * A dictionary that maps a target identifier to an instantiated map object.
	 */
	var maps_ = {};
	/**
	 * The wrapper API.
	 */
	var api_  = {
		/**
		 * Instantiates a Map object. If a Map with the specified targetId
		 * already exists, then it is returned instead.
		 */
		createMap:function(targetId, location){
			var map = null;
			targetId = sanitizeTargetId_(targetId);
			if (targetId){
				// Have we cached a Map object with the specified targetId? If
				// so, return the object. If, however, the targetId exists but
				// no data is mapped to it, then a new Map is instantiated.
				if (targetId in maps_)
					map = maps_[targetId];

				if (!map){
					map = new Map(targetId, location);
					maps_[targetId] = map;
				}
				else
					setLocation(map, location, null, false);
			}
			return map;
		},
		/**
		 * Returns the instance of the Map with the specified target identifier,
		 * or null if none exists.
		 */
		findMap:function(targetId){
			var map = null;
			targetId = sanitizeTargetId_(targetId);
			if (targetId)
				map = maps_[targetId];
			return map;
		},
		/**
		 * Resets all maps.
		 */
		resetAllMaps:function(){
			for (var key in maps_){
				var map = maps_[key];
				if (map)
					map.reset(true);
			}
		}
	};
	/**
	 * The map's controls.
	 */
	var controls_ = {
		Search:function(options){
			var context = this;

			var toggleButton = document.createElement("button");
			toggleButton.innerHTML = '<i class="hide-on-expanded fa fa-fw fa-search"></i><i class="show-on-expanded fa fa-fw fa-close"></i>';
			toggleButton.title = "Search for a location";
			toggleButton.className = "geotagx-ol-search-toggle";
			toggleButton.addEventListener("click", onToggleVisibility, false);
			toggleButton.addEventListener("touchstart", onToggleVisibility, false);

			var input = document.createElement("input");
			input.className = "geotagx-ol-search-input show-on-expanded";
			input.placeholder = "Search for a location by name";
			input.addEventListener("keypress", onInput, false);

			var searchButton = document.createElement("button");
			searchButton.innerHTML = 'SEARCH';
			searchButton.className = "geotagx-ol-search-button show-on-expanded";
			searchButton.addEventListener("click", onSearch, false);
			searchButton.addEventListener("touchstart", onSearch, false);

			var container = document.createElement("div");
			container.className = "ol-control ol-unselectable geotagx-ol-control-search";
			container.appendChild(input);
			container.appendChild(searchButton);
			container.appendChild(toggleButton);

			ol.control.Control.call(this, {element:container});

			function onToggleVisibility(){
				var $container = $(container);

				$container.toggleClass("expanded");

				if ($container.hasClass("expanded")){
					input.focus();
					input.select();
				}
				else
					input.value = "";
			}

			function onInput(e){
				var keycode = (e.keyCode ? e.keyCode : e.which);
				if (keycode === 13){ // Keycode 13 is the carriage return key.
					var location = $.trim(input.value);
					if (location)
						setLocation(context.getMap(), location, this, true);
				}
			}

			function onSearch(){
				var location = $.trim(input.value);
				if (location)
					setLocation(context.getMap(), location, input, true);
			}
		},
		Eraser:function(options){
			var context = this;

			var eraseButton = document.createElement("button");
			eraseButton.innerHTML = '<i class="fa fa-fw fa-eraser"></i>';
			eraseButton.title = "Erase all polygons from the map";
			eraseButton.className = "geotagx-ol-erase-button";
			eraseButton.addEventListener("click", onErase, false);
			eraseButton.addEventListener("touchstart", onErase, false);

			var container = document.createElement("div");
			container.className = "ol-control ol-unselectable geotagx-ol-control-eraser";
			container.appendChild(eraseButton);

			ol.control.Control.call(this, {element:container});

			function onErase(){
				resetMap(context.getMap(), false);
			}
		},
		ViewSelector:function(context, options, name){
			function onClick(){
				var map = context.getMap();

				map.set("geotagx.ol.currentViewName", name);

				// When the view's selector is clicked, all other layers are hidden.
				getLayer(map, "view").getLayers().forEach(function(layer){
					layer.setVisible(layer.get("name") === name);
				});

				// Hide the 'Borders' layer, if need be.
				var borders = map.get("geotagx.ol.layer.borders");
				if (["Aerial","Satellite"].indexOf(name) !== -1)
					borders.setVisible(map.get("geotagx.ol.showBorders"));
				else
					borders.setVisible(false);
			}

			options = options || {};

			var button = document.createElement("button");
			button.innerHTML = name.charAt(0).toUpperCase();
			button.title = "Switch to " + name + " view";
			button.addEventListener("click", onClick, false);
			button.addEventListener("touchstart", onClick, false);

			var element = document.createElement("div");
			element.className = "ol-control ol-unselectable geotagx-ol-control-view " + name.toLowerCase();
			element.appendChild(button);

			ol.control.Control.call(context, {
				element:element,
				target:options.target
			});
		},
		SatelliteViewSelector:function(options){
			controls_.ViewSelector(this, options, "Satellite");
		},
		AerialViewSelector:function(options){
			controls_.ViewSelector(this, options, "Aerial");
		},
		MapViewSelector:function(options){
			controls_.ViewSelector(this, options, "Map");
		}
	};
	ol.inherits(controls_.Search, ol.control.Control);
	ol.inherits(controls_.Eraser, ol.control.Control);
	ol.inherits(controls_.SatelliteViewSelector, ol.control.Control);
	ol.inherits(controls_.AerialViewSelector, ol.control.Control);
	ol.inherits(controls_.MapViewSelector, ol.control.Control);
	/**
	 * Creates a Map object which includes a private internal map (an actual OpenLayers map)
	 * object and an accessor to the aforementioned object. If a location is
	 * specified, the map will be centered at it's coordinates.
	 */
	var Map = function(targetId, location){
		this.openLayersMap = createOpenLayersMap(targetId);
		this.defaultLocation = null;

		location = $.trim(location);
		if (location.length > 0){
			this.defaultLocation = location;
			setLocation(this.openLayersMap, location, null, false);
		}
	};
	/**
	 * Removes any plotted polygons or selected countries from the map and if
	 * panToDefaultLocation is set to true, then the map at is centered at its default
	 * location. If no default location was specified, the map is centered at
	 * the origin.
	 */
	Map.prototype.reset = function(panToDefaultLocation){
		resetMap(this.openLayersMap, panToDefaultLocation, this.defaultLocation);
	};
	/**
	 * Update the map's size.
	 */
	Map.prototype.updateSize = function(){
		this.openLayersMap.updateSize();
	};
	/**
	 * Centers the map at the specified location.
	 * If the input element is specified, then its value will be updated with the location's full name.
	 */
	Map.prototype.setLocation = function(location, input){
		if (this.openLayersMap)
			setLocation(this.openLayersMap, location, input, true);
	};
	/**
	 * Returns the coordinates of the plotted polygon.
	 */
	Map.prototype.getSelection = function(){
		var selection = null;
		if (this.openLayersMap){
			// If a polygon (feature) has been drawn, return its vertices in the form of an array of <X, Y> pairs.
			var features = getLayer(this.openLayersMap, "interaction", "Plot").getSource().getFeatures();
			if (features.length > 0)
				selection = [].concat(features[0].getGeometry().getCoordinates()[0]);
		}
		return selection;
	};
	/**
	 * Creates an OpenLayers map instance in the DOM element with the specified ID.
	 */
	function createOpenLayersMap(targetId){
		// Create the map iff the DOM element exists.
		if (!document.getElementById(targetId))
			return null;

		var plotInteractionVector = new ol.source.Vector({wrapX:false});
		var map = new ol.Map({
			target:targetId,
			loadTilesWhileAnimating:true,
			view:new ol.View({
				center:[0, 0],
				zoom:1,
				minZoom:1,
				minResolution:0.25 // There is usually no more aerial imagery data for resolutions smaller than 0.298.
			}),
			controls:ol.control.defaults().extend([
				new ol.control.ZoomSlider(),
				new ol.control.FullScreen(),
				new controls_.Search(),
				new controls_.Eraser(),
				new controls_.SatelliteViewSelector(),
				new controls_.AerialViewSelector(),
				new controls_.MapViewSelector()
			]),
			layers:[
				new ol.layer.Group({
					name:"view",
					layers:[
						new ol.layer.Tile({
							name:"Satellite",
							visible:false,
							source:new ol.source.MapQuest({layer:"sat"})
						}),
						new ol.layer.Tile({
							name:"Aerial",
							visible:false,
							source:new ol.source.BingMaps({
								key:"Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3",
								imagerySet:"Aerial"
							})
						}),
						new ol.layer.Tile({
							name:"Map",
							source:new ol.source.MapQuest({layer:"osm"})
						}),
					]
				}),
				new ol.layer.Group({
					name:"legend",
					layers:[
						new ol.layer.Tile({
							name:"Borders",
							visible:false, // Only visible for Satellite and Aerial views.
							source:new ol.source.TileJSON({
								url:"http://api.tiles.mapbox.com/v3/mapbox.world-borders-light.jsonp",
								crossOrigin:"anonymous"
							})
						})
					]
				}),
				new ol.layer.Group({
					name:"interaction",
					layers:[
						new ol.layer.Vector({
							name:"Plot",
							source:plotInteractionVector,
							style:new ol.style.Style({
								fill:new ol.style.Fill({
									color:"rgba(255, 255, 255, 0.2)"
								}),
								stroke:new ol.style.Stroke({
									color:"#FC3",
									width:2
								}),
								image:new ol.style.Circle({
									radius:7,
									fill:new ol.style.Fill({
										color:"#FC3"
									})
								})
							})
						})
					]
				})
			],
		});
		// An interaction that allows us to plot a polygon on the map.
		var plotInteraction = new ol.interaction.Draw({
			source:plotInteractionVector,
			type:"Polygon"
		});
		plotInteraction.on("drawstart", function(){
			resetMap(this, false);
		}, map);
		map.addInteraction(plotInteraction);

		// Custom parameters used by the wrapper.
		map.set("geotagx.ol.currentViewName", "Map");
		map.set("geotagx.ol.layer.borders", getLayer(map, "legend", "Borders"));
		map.set("geotagx.ol.showBorders", false);

		map.on("moveend", function(){
			var map = this;
			var view = map.getView();
			var viewName = map.get("geotagx.ol.currentViewName");
			var resolution = map.getView().getResolution();
			var borders = map.get("geotagx.ol.layer.borders");
			var showBorders = resolution > 100;

			// The 'Borders' layer becomes a hindrance the more a user zooms in
			// to the map. It is hidden past a certain zoom level.
			map.set("geotagx.ol.showBorders", showBorders);

			if (["Aerial","Satellite"].indexOf(viewName) !== -1)
				borders.setVisible(showBorders);
			else
				borders.setVisible(false);
		});
		return map;
	}
	/**
	 * Returns the map layer with the specified name in the group with the
	 * specified name.
	 */
	function getLayer(openLayersMap, groupName, layerName){
		// TODO Optimize me. This function's time complexity hurts my eyes.
		var output = null;
		if (openLayersMap && groupName && groupName.length > 0){
			var groups = openLayersMap.getLayers();
			for (var i = 0; i < groups.getLength(); ++i){
				var group = groups.item(i);
				if (group.get("name") === groupName){
					output = group;
					if (layerName && layerName.length > 0){
						var layers = group.getLayers();
						for (var j = 0; j < layers.getLength(); ++j){
							var layer = layers.item(j);
							if (layer.get("name") === layerName){
								output = layer;
								break;
							}
						}
					}
					break;
				}
			}
		}
		return output;
	}
	/**
	 * Removes any plotted polygons from the map, and if panToDefaultLocation is
	 * set to true, then the map is centered at the specified location. If the
	 * location is not given, then the map is centered at the origin.
	 */
	function resetMap(openLayersMap, panToDefaultLocation, defaultLocation){
		getLayer(openLayersMap, "interaction", "Plot").getSource().clear();
		if (panToDefaultLocation){
			if (defaultLocation && defaultLocation.length > 0)
				setLocation(openLayersMap, defaultLocation, null, false);
			else {
				var view = openLayersMap.getView();
				if (view){
					view.setCenter([0, 0]);
					view.setZoom(1);
				}
			}
		}
	}
	/**
	 * Cleans up the specified target identifier and returns a properly formed
	 * identifier. If the specified identifier is not valid, null is returned.
	 */
	function sanitizeTargetId_(targetId){
		if (typeof(targetId) !== "string"){
			console.error("[geotagx::ol::sanitizeTargetId_] Error! The target ID must be a string.");
			return null;
		}
		targetId = targetId.trim();
		if (targetId.length === 0){
			console.error("[geotagx::ol::sanitizeTargetId_] Error! The target ID must be a non-empty string.");
			return null;
		}
		return targetId;
	}
	/**
	 * Centers the map at the specified location. If input element is specified,
	 * its value is replaced with location's full name.
	 */
	function setLocation(openLayersMap, location, input, animate){
		if (location && typeof(location) === "string" && openLayersMap){
			// Query OpenStreetMap for the location's coordinates.
			$.getJSON("http://nominatim.openstreetmap.org/search/" + location + "?format=json&limit=1", function(results){
				if (results.length > 0){
					var view = openLayersMap.getView();
					var result = results[0];
					var bbox = $.map(result.boundingbox, parseFloat);
					var extent = ol.proj.transformExtent([
						// Nominatim returns a [miny, maxy, minx, maxx] bounding
						// box, but we require a [minx, miny, maxx, maxy].
						bbox[2],
						bbox[0],
						bbox[3],
						bbox[1]
					], "EPSG:4326", "EPSG:3857");

					// Center the map around the location's bounding box.
					view.fit(extent, openLayersMap.getSize());

					// If an input field was specified, replace its value with
					// the location's full name.
					if (input)
						input.value = result.display_name;
				}
				else
					console.log("Location not found."); // e.g. xyxyxyxyxyxyx
			});
		}
	}

	// Expose the wrapper API.
	geotagx.ol = api_;
})(window.geotagx = window.geotagx || {}, jQuery);

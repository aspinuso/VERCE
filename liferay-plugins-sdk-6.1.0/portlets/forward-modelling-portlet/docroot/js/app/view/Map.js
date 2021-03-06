/**
 * The GeoExt.panel.Map used in the application.  Useful to define map options
 * and stuff.
 * @extends GeoExt.panel.Map
 */
Ext.define('CF.view.Map', {
  // Ext.panel.Panel-specific options:
  extend: 'GeoExt.panel.Map',
  alias: 'widget.cf_mappanel',
  requires: [
    'Ext.window.MessageBox',
    'GeoExt.Action',
    'GeoExt.LegendImage',
    'GeoExt.slider.LayerOpacity',
    'GeoExt.panel.Legend',
    'CF.view.help.Action'
  ],
  border: 'false',
  layout: 'fit',
  region: 'west',
  width: 600,
  // GeoExt.panel.Map-specific options :
  center: '13.3046875,40.48193359375',
  zoom: 4,

  initComponent: function() {
    var me = this;

    this.layers = Ext.create("GeoExt.data.LayerStore");

    var controller = CF.app.getController('Map');
    var items = [];

    var layers = []; 
    // OpenLayers object creating
    var wms = new OpenLayers.Layer.WMS(
      "World Base Layer (KNMI)",
      "https://geoservices.knmi.nl/cgi-bin/worldmaps.cgi?", {
        layers: 'world_raster'
      },{wrapDateLine: true}      
    );

    var hwms =
      new OpenLayers.Layer.WMS(
        "Hazard Map WMS (EFEHR)",
        "/ethz-mapserv/mapserv?MAP=/var/www/mapfile/sharehazard.01.map&", {
          layers: 'hmap469',
          transparent: 'true',
        }, {
          isBaseLayer: false,
          visibility: false,
        }
      );


    var vecwms =
      new OpenLayers.Layer.WMS(
        "Borders (EFEHR)",
        "/ethz-mapserv/mapserv?map=/var/www/mapfile/worldvector.map&", {
          layers: 'wv_country_ol',
          transparent: 'true',
        }, {
          isBaseLayer: false,
          visibility: false,
        }
      );

    var geowms =
      new OpenLayers.Layer.WMS(
        "Geology (OneGeology) ",
        "https://mapsref.brgm.fr/wxs/1GG/GISEurope_Bedrock_and_Structural_Geology",
         {layers: 'Europe_GISEurope_1500K_BedrockAge',        
          transparent: 'true'
        }, {
          isBaseLayer: false
        }
      );

    var faultswms =
      new OpenLayers.Layer.WMS(
        "Faults (OneGeology)",
        " /brgm-mapserver/mapserv?map=/carto/ogg/mapFiles/GISEurope_Bedrock_and_Structural_Geology.map&", {
          layers: 'Europe_GISEurope_1500K_Faults',
          transparent: 'true'
        }, {
          isBaseLayer: false
        }
      );

    var stationcontext = {
      getColor: function(feature) {
        if (feature.attributes.elevation < 1000) {
          return '#3333FF';
        }
        return '#000066';
      }
    };
    var stationtemplate = {
      cursor: "pointer",
      fillOpacity: 0.3,
      fillColor: "#111188",
      pointRadius: 5,
      strokeWidth: 1,
      strokeOpacity: 1,
      strokeColor: "#222299",
      graphicName: "triangle"
    };

    var stationtemplateselected = {
      cursor: "pointer",
      fillOpacity: 0.9,
      fillColor: "#3333FF",
      pointRadius: 7,
      strokeWidth: 1,
      strokeOpacity: 1,
      strokeColor: "#3333FF",
      graphicName: "triangle"
    };
    var stationrenderer = OpenLayers.Layer.Vector.prototype.renderers;
    var stationstyle = new OpenLayers.Style(stationtemplate, {
      context: stationcontext
    });
    var stationstyleselected = new OpenLayers.Style(stationtemplateselected, {
      context: stationcontext
    });
    var stationstylemap = new OpenLayers.StyleMap({
      'default': stationstyle,
      'select': stationstyleselected
    });

    var stationLayer = new OpenLayers.Layer.Vector("Stations", {
      styleMap: stationstylemap,
      strategies: [new OpenLayers.Strategy.Fixed()],
      renderers: stationrenderer,
      protocol: new OpenLayers.Protocol.HTTP({
        // format: new StationXMLFormat(),
        handleResponse: function(resp, options) {
          // initialization request, don't need to do anything in this case
          if (options.url == null) {
            return;
          }
          controller.checkStatus(this, resp, options, "station");
        }
      })
    });

    var eventcontext = {
      getRadius: function(feature) {
        return feature.attributes.magnitude * 1.5;
      }
    };
    var eventtemplate = {
      cursor: "pointer",
      fillOpacity: 0.3,
      fillColor: "#AA0000",
      pointRadius: "${getRadius}",
      strokeWidth: 1,
      strokeOpacity: 1,
      strokeColor: "#AA0000"
    };
    var eventtemplateselected = {
      cursor: "pointer",
      fillOpacity: 0.9,
      fillColor: "#FF3333",
      pointRadius: "${getRadius}",
      strokeWidth: 1,
      strokeOpacity: 1,
      strokeColor: "#FF3333"
    };
    var eventrenderer = OpenLayers.Layer.Vector.prototype.renderers;
    var eventstyle = new OpenLayers.Style(eventtemplate, {
      context: eventcontext
    });
    var eventstyleselected = new OpenLayers.Style(eventtemplateselected, {
      context: eventcontext
    });
    var eventstylemap = new OpenLayers.StyleMap({
      'default': eventstyle,
      'select': eventstyleselected
    });

    eventLayer = new OpenLayers.Layer.Vector("Events", {
      styleMap: eventstylemap,
      protocol: new OpenLayers.Protocol.HTTP({
        // format: new QuakeMLXMLFormat(),
        handleResponse: function(resp, options) {
          if (options.url == null) {
            return;
          }
          controller.checkStatus(this, resp, options, "event");
        }
      }),
      strategies: [new OpenLayers.Strategy.Fixed()],
      renderers: eventrenderer
    });

    layers.push(wms);
    layers.push(hwms);
    layers.push(vecwms);
    layers.push(geowms);
    layers.push(faultswms);
    layers.push(stationLayer);
    layers.push(eventLayer);

    this.map = new OpenLayers.Map('map', {
      numZoomLevels: 10
    });
    this.map.addLayers(layers)

    var map = this.map;
    // overiding adjustZoom  method to allow zooming out further to the whole world 
    // Openlayers 2.13 had a change which prevented the map from zooming out if the base layer is set to wrapDateLine
    /*map.adjustZoom = function(zoom) {
    return zoom
    };*/
    var dragpan = new OpenLayers.Control.DragPan({
      autoActivate: true,
      title: "Pan the map by dragging."
    });

    var navToolbar = OpenLayers.Class(OpenLayers.Control.Panel, {
      defaultControl: dragpan,
      initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);

        this.addControls([
          dragpan,
          new OpenLayers.Control.ZoomBox({
            alwaysZoom: false,
            title: "Zoom to a selected area by dragging a box."
          }),
          new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOOL,
            displayClass: 'olControlSelectFeature',
            title: "Select events and stations by dragging a box around them.",
            activate: function() {
              var dragselect = this.map.getControl('dragselect');
              if (dragselect == null) {
                return;
              }
              dragselect.deactivate();
              dragselect.box = true;
              if (dragselect.handlers.box == null) {
                dragselect.handlers.box = new OpenLayers.Handler.Box(
                  dragselect, {
                    done: dragselect.selectBox
                  }, {
                    boxDivClassName: "olHandlerBoxSelectFeature"
                  }
                );
                dragselect.handlers.box.setMap(dragselect.map);
              }
              dragselect.activate();
              return OpenLayers.Control.prototype.activate.apply(
                this, arguments
              );
            },
            deactivate: function() {
              var dragselect = this.map.getControl('dragselect');
              if (dragselect == null) {
                return;
              }
              dragselect.deactivate();
              dragselect.box = false;
              dragselect.activate();
              return OpenLayers.Control.prototype.deactivate.apply(
                this, arguments
              );
            }
          })
        ]);
        // To make the custom navtoolbar use the regular navtoolbar style
        this.displayClass = 'olControlNavToolbar'
      }
    });

    var panel = new navToolbar();

    this.map.addControls([
      panel,
      new OpenLayers.Control.LayerSwitcher({
        'ascending': false
      }),
      new OpenLayers.Control.SelectFeature([stationLayer, eventLayer], {
        id: 'dragselect',
        autoActivate: true,
        multiple: true,
        box: false,
        toggle: true,
        onSelect: function(feature) {
          if (feature.data.network != null && feature.data.station != null) {
            var stationGrid = controller.getStationGrid();
            var idx = stationGrid.store.findExact('network.station', feature.data.network + '.' + feature.data.station);
            stationGrid.getSelectionModel().select(idx, true /* keep existing selections */ , true /* suppress select event */ );
            stationGrid.getView().focusRow(idx, 100);
            selectedStations=0;
            if(Ext.getCmp('stationSelColumn').text && Ext.getCmp('stationSelColumn').text.includes("/"))
            {
            	selectedStations=parseInt(Ext.getCmp('stationSelColumn').text.split("/")[0]);
            }
            Ext.getCmp('stationSelColumn').setText(selectedStations+1 + "/" + controller.getStore('Station').data.length);
          } else if (feature.data.eventId != null) {
            var eventGrid = controller.getEventGrid();
            var idx = eventGrid.store.findExact('eventId', feature.data.eventId);
            eventGrid.getSelectionModel().select(idx, true /* keep existing selections */ , true /* suppress select event */ );
            eventGrid.getView().focusRow(idx, 100);
            selectedEvents=0;
            if(Ext.getCmp('eventSelColumn').text && Ext.getCmp('eventSelColumn').text.includes("/"))
            {
            	selectedEvents=parseInt(Ext.getCmp('eventSelColumn').text.split("/")[0]);
            }
            Ext.getCmp('eventSelColumn').setText(selectedEvents+1 + "/" + controller.getStore('Event').data.length);
          }
        },
        onUnselect: function(feature) {
          if (feature.data.network != null && feature.data.station != null) {
            var stationGrid = controller.getStationGrid();
            var idx = stationGrid.store.findExact('network.station', feature.data.network + '.' + feature.data.station);
            stationGrid.getSelectionModel().deselect(idx, true /* keep existing selections */ );
            stationGrid.getView().focusRow(idx, 100);            
            selectedStations=0;
            if(Ext.getCmp('stationSelColumn').text && Ext.getCmp('stationSelColumn').text.includes("/"))
            {
            	selectedStations=parseInt(Ext.getCmp('stationSelColumn').text.split("/")[0]);
            }
            Ext.getCmp('stationSelColumn').setText(selectedStations <= 0 ? 0 :selectedStations-1 + "/" + controller.getStore('Station').data.length);
          } else if (feature.data.eventId != null) {
            var eventGrid = controller.getEventGrid();
            var idx = eventGrid.store.findExact('eventId', feature.data.eventId);
            eventGrid.getSelectionModel().deselect(idx, true /* keep existing selections */ );
            eventGrid.getView().focusRow(idx, 100);
            selectedEvents=0;
            if(Ext.getCmp('eventSelColumn').text && Ext.getCmp('eventSelColumn').text.includes("/"))
            {
            	selectedEvents=parseInt(Ext.getCmp('eventSelColumn').text.split("/")[0]);
            }
            Ext.getCmp('eventSelColumn').setText(selectedEvents <= 0 ? 0 :selectedEvents-1 + "/" + controller.getStore('Event').data.length);
          }
        },
      }),
    ]);

    hwms.setOpacity(0.5);
    geowms.setOpacity(0.5);
    faultswms.setOpacity(0.3);

    this.layers.bind(map)

    // ZoomToMaxExtent control, a "button" control
    items.push(Ext.create('Ext.button.Button', Ext.create('GeoExt.Action', {
      control: new OpenLayers.Control.ZoomToMaxExtent(),
      map: map,
      text: "max extent",
      tooltip: "zoom to max extent"
    })));

    items.push("-");
    items.push("->");

    items.push(
      Ext.create('Ext.button.Button', Ext.create('CF.view.help.Action', {
        windowContentEl: "help"
      }))
    );

    items.push({
      xtype: 'splitbutton',
      text: 'Layers info',
      menuAlign: 'tr-br',
      menu: {
        xtype: 'menu',
        plain: true,
        items: [{
            text: 'Hazard'
          }, {
            xtype: "gx_opacityslider",
            layer: hwms,
            aggressive: true,
            vertical: false,
            value: 50,
            height: 10,
            x: 10,
            y: 20
          },

          Ext.create('Ext.Button', {
            text: 'View Legend',

            handler: function() {
              Ext.create('Ext.window.Window', {
                title: 'Legend',
                height: 200,
                width: 600,
                layout: 'fit',
                items: [Ext.create('Ext.panel.Panel', {
                  bodyPadding: 5, // Don't want content to crunch against the borders
                  width: 600,
                  autoScroll: true,

                  items: [{


                    xtype: "gx_legendimage",


                    url: '/ethz-mapserv/mapserv?MAP=/var/www/mapfile/sharehazard.01.map&TRANSPARENT=true&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&STYLES=&FORMAT=image%2Fpng&SRS=EPSG%3A4326&VISIBILITY=true&LAYER=hmap469',

                    padding: 5
                  }]
                })]
              }).show();
            }
          }), {
            text: 'Borders'
          }, {
            xtype: "gx_opacityslider",
            text: 'Boundaries',
            layer: vecwms,
            aggressive: true,
            vertical: false,
            height: 10,
            x: 10,
            y: 20
          }, {
            text: 'Geology - GIS Europe Bedrock and Structural Geology'
          }, {
            xtype: "gx_opacityslider",
            text: 'Geology',
            layer: geowms,
            aggressive: true,
            vertical: false,
            height: 10,
            value: 50,
            x: 10,
            y: 20
          },
          Ext.create('Ext.Button', {
            text: 'View Legend',

            handler: function() {
              Ext.create('Ext.window.Window', {
                title: 'Legend',
                height: 200,
                width: 600,
                layout: 'fit',
                items: [Ext.create('Ext.panel.Panel', {
                  bodyPadding: 5, // Don't want content to crunch against the borders
                  width: 600,
                  autoScroll: true,
                  items: [{
                    xtype: "gx_legendimage",
                    url: "https://mapsref.brgm.fr/wxs/1GG/GISEurope_Bedrock_and_Structural_Geology?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=Europe_GISEurope_1500K_BedrockAge&format=image/png&STYLE=default",
                    padding: 5
                  }]
                })]
              }).show();
            }
          }), {
            text: 'Faults'
          }, {
            xtype: "gx_opacityslider",
            text: 'Faults',
            layer: faultswms,
            aggressive: true,
            vertical: false,
            height: 10,
            value: 30,
            x: 10,
            y: 20
          }
        ]
      }
    });


    Ext.apply(me, {
      map: map,
      dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: items,
        style: {
          border: 0,
          padding: 0
        }
      }]
    });

    me.callParent(arguments);
  }
});
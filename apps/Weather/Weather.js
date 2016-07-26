/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * Displays a time series of the 12 months of Blue Marble imagery.
 */

requirejs(['../../src/WorldWind',
        'ObjectWindow',
        '../../examples/LayerManager'],
    function (ww,
              ObjectWindow,
              LayerManager) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        var wwd = new WorldWind.WorldWindow("canvasOne");

        var backgroundLayer = new ObjectWindow.OneImageLayer();
        backgroundLayer.hide = true; // Don't show it in the layer manager.
        wwd.addLayer(backgroundLayer);

        // Create the Blue Marble layer and add it to the World Window's layer list. Disable it until its images
        // are preloaded, which is initiated below.
        var timeseriesLayer = new ObjectWindow.TimeSeriesLayer(null, null);
        timeseriesLayer.enabled = false;
        timeseriesLayer.showSpinner = true;
        wwd.addLayer(timeseriesLayer);

        // Create a compass and view controls.
        wwd.addLayer(new WorldWind.CompassLayer());
        wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));
        wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));

        // Create a layer manager for controlling layer visibility.
        var layerManger = new LayerManager(wwd);

        // Ensure that the background and other control layers are displayed while the blue marble layer is
        // being pre-populated.
        wwd.redraw();

        // Wait for the layer to pre-populate all its sub-layers before enabling it.
        var prePopulateInterval = window.setInterval(function () {
            if (!this.prePopulate) {
                // Pre-populate the layer's sub-layers so that we don't see flashing of their image tiles as they're
                // loaded.
                timeseriesLayer.prePopulate(wwd);
                this.prePopulate = true;
                return;
            }

            // See if the layer is pre-populated now. If so, enable it.
            if (this.prePopulate && timeseriesLayer.isPrePopulated(wwd)) {
                timeseriesLayer.enabled = true;
                timeseriesLayer.showSpinner = false;
                window.clearInterval(prePopulateInterval);
                layerManger.synchronizeLayerList();

                // Increment the Blue Marble layer's time at a specified frequency.
                var currentIndex = 0;
                window.setInterval(function () {
                    if (timeseriesLayer.enabled) {
                        currentIndex = ++currentIndex % ObjectWindow.TimeSeriesLayer.availableTimes.length;
                        timeseriesLayer.time = ObjectWindow.TimeSeriesLayer.availableTimes[currentIndex];
                        wwd.redraw();
                    }
                }, 100);
            }
        }, 200);
    });
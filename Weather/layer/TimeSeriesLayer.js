/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports TimeSeriesLayer
 */
define([
        '../../worldwindlib.js'
    ],
    function (ArgumentError,
              Layer,
              Logger,
              PeriodicTimeSequence) {
        "use strict";

        /**
         * Constructs a Blue Marble layer.
         * @alias TimeSeriesLayer
         * @constructor
         * @augments Layer
         * @classdesc Represents the 12 name collection of Blue Marble Next Generation imagery for the year 2004.
         * By default the name of January is displayed, but this can be changed by setting this class' time
         * property to indicate the name to display.
         * @param {String} displayName The display name to assign this layer. Defaults to "Blue Marble" if null or
         * undefined.
         * @param {Date} initialTime A date value indicating the name to display. The nearest name to the specified
         * time is displayed. January is displayed if this argument is null or undefined, i.e., new Date("2004-01");
         * @param {{}} configuration An optional object with properties defining the layer configuration.
         * See {@link RestTiledImageLayer} for a description of its contents. May be null, in which case default
         * values are used.
         */
        var TimeSeriesLayer;
        TimeSeriesLayer = function (displayName, initialTime, configuration) {
            Layer.call(this, displayName || "Blue Marble");

            /**
             * A value indicating the name to display. The nearest name to the specified time is displayed.
             * @type {Date}
             * @default January 2004 (new Date("2004-01"));
             */
            this.time = initialTime || new Date("2016-07-12");
            this.timeSequence = new PeriodicTimeSequence("2016-07-12/2016-07-18/PT3H");
            this.pathToData = "standalonedata/WORLD-CED/test/";

            this.configuration = configuration;

            this.pickEnabled = false;
            this.layers = {}; // holds the layers as they're created.

            // Intentionally not documented.
            this.layerNames = {};

            this.serverAddress = null;
        };

        TimeSeriesLayer.prototype = Object.create(Layer.prototype);

        /**
         * Indicates the available times for this layer.
         * @type {Date[]}
         * @readonly
         */
        TimeSeriesLayer.availableTimes = [];

        /**
         * Initiates retrieval of this layer's level 0 images for all sub-layers. Use
         * [isPrePopulated]{@link TiledImageLayer#isPrePopulated} to determine when the images have been retrieved
         * and associated with the level 0 tiles.
         * Pre-populating is not required. It is used to eliminate the visual effect of loading tiles incrementally,
         * but only for level 0 tiles. An application might pre-populate a layer in order to delay displaying it
         * within a time series until all the level 0 images have been retrieved and added to memory.
         * @param {WorldWindow} wwd The world window for which to pre-populate this layer.
         * @throws {ArgumentError} If the specified world window is null or undefined.
         */
        TimeSeriesLayer.prototype.prePopulate = function (wwd) {
            if (!wwd) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "TimeSeriesLayer", "prePopulate", "missingWorldWindow"));
            }

            var period = PeriodicTimeSequence.incrementTime(this.timeSequence.currentTime,
                    this.timeSequence.period) - this.timeSequence.currentTime;
            var length = this.timeSequence.intervalMilliseconds/period + 1;

            if (TimeSeriesLayer.availableTimes.length != length) {
                for (var i = 0; i < length ; i++)  {
                    TimeSeriesLayer.availableTimes[i] = this.timeSequence.currentTime;
                    var name;
                    if (i  < 10) {
                        name = "0" + i.toString();
                    }
                    else {
                        name = i.toString();
                    }

                    this.layerNames[this.timeSequence.currentTime] = name;
                    this.timeSequence.next();
                }
            }

            for (var key in this.layerNames) {
                if (this.layerNames.hasOwnProperty(key)) {
                    var layerName = this.layerNames[key];

                    if (!this.layers[layerName]) {
                        this.createSubLayer(layerName);
                    }

                    this.layers[layerName].prePopulate(wwd);
                }
            }
        };

        TimeSeriesLayer.prototype.createSubLayer = function (layerName) {
            var dataPath = this.pathToData + layerName + '.png';
            this.layers[layerName] = new ObjectWindow.OneImageLayer(dataPath);
        };

        /**
         * Indicates whether this layer's level 0 tile images for all sub-layers have been retrieved and associated
         * with the tiles.
         * Use [prePopulate]{@link TiledImageLayer#prePopulate} to initiate retrieval of level 0 images.
         * @param {WorldWindow} wwd The world window associated with this layer.
         * @returns {Boolean} true if all level 0 images have been retrieved, otherwise false.
         * @throws {ArgumentError} If the specified world window is null or undefined.
         */
        TimeSeriesLayer.prototype.isPrePopulated = function (wwd) {
            for (var key in this.layerNames) {
                if (this.layerNames.hasOwnProperty(key)) {
                    var layerName = this.layerNames[key];
                    if (this.layers.hasOwnProperty(layerName) && !this.layers[layerName].isPrePopulated(wwd)) {
                        return false;
                    }
                }
            }
            return true;
        };

        TimeSeriesLayer.prototype.doRender = function (dc) {
            var layer = this.layers[this.layerNames[this.time]];
            layer.opacity = this.opacity;
            if (this.detailControl) {
                layer.detailControl = this.detailControl;
            }

            layer.doRender(dc);

            this.inCurrentFrame = layer.inCurrentFrame;
        };

        return TimeSeriesLayer;
    });
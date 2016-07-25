/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports BlueMarbleLayer
 */
define([
        '../error/ArgumentError',
        '../layer/Layer',
        '../util/Logger',
        '../util/PeriodicTimeSequence',
        '../layer/RestTiledImageLayer'
    ],
    function (ArgumentError,
              Layer,
              Logger,
              PeriodicTimeSequence,
              RestTiledImageLayer) {
        "use strict";

        /**
         * Constructs a Blue Marble layer.
         * @alias WeatherLayer
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
        var WeatherLayer;
        WeatherLayer = function (displayName, initialTime, configuration) {
            Layer.call(this, displayName || "Blue Marble");

            /**
             * A value indicating the name to display. The nearest name to the specified time is displayed.
             * @type {Date}
             * @default January 2004 (new Date("2004-01"));
             */
            this.time = initialTime || new Date("2016-07-12");
            this.timeSequence = new PeriodicTimeSequence("2016-07-12/2016-07-18/PT3H");
            this.pathToData = "/standalonedata/WORLD-CED/test/";

            this.configuration = configuration;

            this.pickEnabled = false;
            this.layers = {}; // holds the layers as they're created.

            // Intentionally not documented.
            this.layerNames = [];

            this.serverAddress = null;
        };

        WeatherLayer.prototype = Object.create(Layer.prototype);

        /**
         * Indicates the available times for this layer.
         * @type {Date[]}
         * @readonly
         */
        WeatherLayer.availableTimes = [];

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
        WeatherLayer.prototype.prePopulate = function (wwd) {
            if (!wwd) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WeatherLayer", "prePopulate", "missingWorldWindow"));
            }

            var period = PeriodicTimeSequence.incrementTime(this.timeSequence.currentTime,
                this.timeSequence.period) - this.timeSequence.currentTime;
            var length = this.timeSequence.intervalMilliseconds/period + 1;

            if (WeatherLayer.availableTimes.length != length) {
                for (var i = 0; i < length ; i++)  {
                    WeatherLayer.availableTimes[i] = this.timeSequence.currentTime;
                    var month;
                    if (i  < 10) {
                        month = "0" + i.toString();
                    }
                    else {
                        month = i.toString();
                    }

                    this.layerNames[i] = {month: month,
                            time: this.timeSequence.currentTime};

                    this.timeSequence.next();
                }
            }

            console.log(this.layerNames);

            for (var i = 0; i < this.layerNames.length; i++) {
                var layerName = this.layerNames[i].name;

                if (!this.layers[layerName]) {
                    this.createSubLayer(layerName);
                }

                // this.layers[layerName].prePopulate(wwd);
            }
        };

        /**
         * Indicates whether this layer's level 0 tile images for all sub-layers have been retrieved and associated
         * with the tiles.
         * Use [prePopulate]{@link TiledImageLayer#prePopulate} to initiate retrieval of level 0 images.
         * @param {WorldWindow} wwd The world window associated with this layer.
         * @returns {Boolean} true if all level 0 images have been retrieved, otherwise false.
         * @throws {ArgumentError} If the specified world window is null or undefined.
         */
        WeatherLayer.prototype.isPrePopulated = function (wwd) {
        //     for (var i = 0; i < this.layerNames.length; i++) {
        //         var layer = this.layers[this.layerNames[i].name];
        //         if (!layer || !layer.isPrePopulated(wwd)) {
        //             return false;
        //         }
        //     }

            return true;
        };

        WeatherLayer.prototype.doRender = function (dc) {
            var layer = this.nearestLayer(this.time);
            console.log("rendering");
            console.log(this.time);
            layer.opacity = this.opacity;
            if (this.detailControl) {
                layer.detailControl = this.detailControl;
            }

            layer.doRender(dc);

            this.inCurrentFrame = layer.inCurrentFrame;
        };

        // Intentionally not documented.
        WeatherLayer.prototype.nearestLayer = function (time) {
            var nearestName = this.nearestLayerName(time);

            if (!this.layers[nearestName]) {
                this.createSubLayer(nearestName);
            }

            return this.layers[nearestName];
        };

        WeatherLayer.prototype.createSubLayer = function (layerName) {
            var dataPath = this.pathToData + layerName + '.png';
            this.layers[layerName] = new WorldWind.BMNGOneImageLayer(dataPath);
        };

        // Intentionally not documented.
        WeatherLayer.prototype.nearestLayerName = function (time) {
            var milliseconds = time.getTime();

            if (milliseconds <= this.layerNames[0].time.getTime()) {
                return this.layerNames[0].name;
            }

            if (milliseconds >= this.layerNames[this.layerNames.length - 1].time.getTime()) {
                return this.layerNames[this.layerNames.length - 1].name;
            }

            for (var i = 0; i < this.layerNames.length - 1; i++) {
                var leftTime = this.layerNames[i].time.getTime(),
                    rightTime = this.layerNames[i + 1].time.getTime();

                if (milliseconds >= leftTime && milliseconds <= rightTime) {
                    var dLeft = milliseconds - leftTime,
                        dRight = rightTime - milliseconds;

                    return dLeft < dRight ? this.layerNames[i].name : this.layerNames[i + 1].name;
                }
            }
        };

        return WeatherLayer;
    });
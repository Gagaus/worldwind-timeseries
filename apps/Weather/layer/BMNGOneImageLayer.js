/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports BMNGOneImageLayer
 * @version $Id: BMNGOneImageLayer.js 2942 2015-03-30 21:16:36Z tgaskins $
 */
define([
        '../util/AbsentResourceList',
        '../util/Logger',
        '../cache/MemoryCache',
        '../render/Texture',
        '../layer/RenderableLayer',
        '../geom/Sector',
        '../shapes/SurfaceImage',
        '../util/WWUtil'
    ],
    function (AbsentResourceList,
              Logger,
              MemoryCache,
              Texture,
              RenderableLayer,
              Sector,
              SurfaceImage) {
        "use strict";

        /**
         * Constructs a Blue Marble image layer that spans the entire globe.
         * @alias BMNGOneImageLayer
         * @constructor
         * @augments RenderableLayer
         * @classdesc Displays a Blue Marble image layer that spans the entire globe with a single image.
         */
        var BMNGOneImageLayer = function (img_path) {
            RenderableLayer.call(this, "Weather Image");

            if (!img_path) {
                this.imagePath = WorldWind.configuration.baseUrl + "/standalonedata/WORLD-CED/test/00.png";
                //  this.imagePath = WorldWind.configuration.baseUrl + "/images/BMNG_world.topo.bathy.200405.3.2048x1024.jpg";
            }
            else {
                this.imagePath =  WorldWind.configuration.baseUrl + img_path;
            }

            var surfaceImage = new SurfaceImage(Sector.FULL_SPHERE,
                this.imagePath);

            this.addRenderable(surfaceImage);

            this.pickEnabled = false;
            this.minActiveAltitude = 3e6;
        };

        BMNGOneImageLayer.prototype = Object.create(RenderableLayer.prototype);

        BMNGOneImageLayer.prototype.isPrePopulated = function (wwd) {
            if (!wwd) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "TiledImageLayer", "isPrePopulated", "missingWorldWindow"));
            }

            return this.isImageLayerInMemory(wwd.drawContext, this);
        };

        BMNGOneImageLayer.prototype.prePopulate = function (wwd) {
            if (!wwd) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "TiledImageLayer", "prePopulate", "missingWorldWindow"));
            }

            var dc = wwd.drawContext;

            if (!this.isImageLayerInMemory(dc, this)) {
                dc.gpuResourceCache.retrieveTexture(dc.currentGlContext, this.imagePath);
            }
        };

        // Intentionally not documented.
        BMNGOneImageLayer.prototype.isImageLayerInMemory = function (dc, tile) {
            return dc.gpuResourceCache.containsResource(tile.imagePath);
        };

        return BMNGOneImageLayer;
    });
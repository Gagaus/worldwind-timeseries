/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports OneImageLayer
 * @version $Id: OneImageLayer.js 2942 2015-03-30 21:16:36Z tgaskins $
 */
define([
        '../../../src/util/AbsentResourceList',
        '../../../src/util/Logger',
        '../../../src/cache/MemoryCache',
        '../../../src/render/Texture',
        '../../../src/layer/RenderableLayer',
        '../../../src/geom/Sector',
        '../../../src/shapes/SurfaceImage',
        '../../../src/util/WWUtil'
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
         * @alias OneImageLayer
         * @constructor
         * @augments RenderableLayer
         * @classdesc Displays a Blue Marble image layer that spans the entire globe with a single image.
         */
        var OneImageLayer = function (img_path) {
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

        OneImageLayer.prototype = Object.create(RenderableLayer.prototype);

        OneImageLayer.prototype.isPrePopulated = function (wwd) {
            if (!wwd) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "TiledImageLayer", "isPrePopulated", "missingWorldWindow"));
            }

            return this.isImageLayerInMemory(wwd.drawContext, this);
        };

        OneImageLayer.prototype.prePopulate = function (wwd) {
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
        OneImageLayer.prototype.isImageLayerInMemory = function (dc, tile) {
            return dc.gpuResourceCache.containsResource(tile.imagePath);
        };

        return OneImageLayer;
    });
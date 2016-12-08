//
//  GCpShapeCache.js
//  
//  All rights reserved.
//	
//  Loads physics sprites created with http://www.PhysicsEditor.de
//
//  Generic Shape Cache for Chipmunk
//
//  Copyright by Andreas Loew
//      http://www.PhysicsEditor.de
//      http://texturepacker.com
//      http://www.code-and-web.de
//
//  All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

var TEXTURES_SCALE_FACTOR = 1;

var gcp = gcp || {};
var bodyDefs;

gcp._pointFromString = function (str) {
    var coords = str.replace(/[{}]/g, "").trim().split(",");
    return cc.p(parseFloat(coords[0]), parseFloat(coords[1]));
};

/**
 * Shape cache
 * This class holds the shapes and makes them accessible
 */
gcp.ShapeCache = cc.Class.extend({

    bodyDefs: null,

    /**
     * Constructor
     */
    ctor: function () {
        bodyDefs = [];
    },

    /**
     * Adds shapes to the shape cache
     * @param plist name of the plist file to load
     * @result false in case of error
     */
    addShapesWithFile: function (plist) {
        // cc.log("WCZYTUJE: "+plist);
        var dictionary = cc.loader.getRes(res.physics_bodies_plist);
        if (!dictionary)
            return false;

        var metadataDict = dictionary["metadata"];
        var format = parseInt(metadataDict["format"]);

        if (format != 1)
            return false;

        var bodyDict = dictionary["bodies"];

        for (var bodyName in bodyDict) {
            //cc.log("BODY: "+bodyName);
            var bodyData = bodyDict[bodyName];
            var bodyDef = new g.BodyDef();
            bodyDef.anchorPoint = null;
            bodyDef.momentum = 0.0;
            bodyDef.fixtures = [];

            bodyDefs[bodyName] = bodyDef;
            bodyDef.anchorPoint = gcp._pointFromString(bodyData["anchorpoint"]);

            var fixtureList = bodyData["fixtures"];
            var totalMass = 0.0;
            var totalBodyMomentum = 0.0;

            for (var fixtureIndex in fixtureList) {
                var fixtureData = fixtureList[fixtureIndex];
                //cc.log("FIXTURE INDEX: "+fixtureIndex+"FIXTURE DATA: "+fixtureData);

                var fd = new g.FixtureData();
                fd.polygons = [];
                fd.momentum = 1.0;
                fd.area = 0.0;

                if (!fd)
                    return false;

                bodyDef.fixtures.push(fd);

                fd.friction = parseFloat(fixtureData["friction"]);
                fd.elasticity = parseFloat(fixtureData["elasticity"]);
                fd.mass = parseFloat(fixtureData["mass"]);
                if (fixtureData["surface_velocity"]) {
                    fd.surfaceVelocity = gcp._pointFromString(fixtureData["surface_velocity"]);
                }
                fd.layers = parseInt(fixtureData["layers"]);
                fd.group = parseInt(fixtureData["group"]);
                fd.collisionType = parseInt(fixtureData["collision_type"]);
                fd.isSensor = fixtureData["fixtureData"] === "true";

                var fixtureType = fixtureData["fixture_type"];

                var totalArea = 0.0;

                totalMass += fd.mass;

                if (fixtureType === "POLYGON") {
                    var polygonsArray = fixtureData["polygons"];

                    //cc.log("POLYGONS ARRAY: "+polygonsArray+" LENGTH: "+polygonsArray.length);

                    for (var polygonIndex in polygonsArray) {
                        var polygonArray = polygonsArray[polygonIndex];

                        //cc.log("POLYGON ARRAY: "+polygonArray+" OF INDEX: "+polygonIndex);

                        var poly = new g.Polygon();
                        poly.vertices = null;
                        poly.numVertices = 0;
                        poly.area = 0.0;
                        poly.momentum = 0.0;

                        if (!poly)
                            return false;

                        fd.polygons.push(poly);

                        poly.numVertices = polygonArray.length;
                        //cc.log("poly num vertices: "+poly.numVertices);
                        var vertices = poly.vertices = new Array(poly.numVertices * 2);
                        //cc.log("V: "+vertices);
                        //cc.log(poly.vertices);
                        //cc.log(new Array(poly.numVertices * 2));

                        if (!vertices)
                            return false;

                        var tempVerts = [];
                        var vindex = 0;
                        for (var pointStringIndex in polygonArray) {
                            var pointString = polygonArray[pointStringIndex];
                            //cc.log("PS: "+pointString);
                            var offset = gcp._pointFromString(pointString);
                            // cc.log("RESULT: "+gcp._pointFromString(pointString));
                            //cc.log(offset.x);
                            vertices[vindex] = offset.x / TEXTURES_SCALE_FACTOR;
                            //cc.log(offset.x / TEXTURES_SCALE_FACTOR);
                            // cc.log("AAAAAA: "+vertices[vindex]);
                            vertices[vindex + 1] = offset.y / TEXTURES_SCALE_FACTOR;
                            tempVerts.push(cp.v(offset.x / TEXTURES_SCALE_FACTOR, offset.y / TEXTURES_SCALE_FACTOR));
                            vindex += 2;
                        }

                        //cc.log("===== verts: "+vertices);
                        poly.area = cp.areaForPoly(vertices);
                        //cc.log("POLY AREA: "+poly.area);
                        totalArea += poly.area;
                    }
                }
                else {
                    cc.Assert(0)
                }
                fd.area = totalArea;

                var totalFixtureMomentum = 0.0;

                //cc.log("TOTAL AREA: " +totalArea);
                //cc.log("BODY POLYGONS LEN: "+fd.polygons.length);
                if (totalArea) {
                    for (var pIndex in fd.polygons) {
                        var p = fd.polygons[pIndex];
                        //cc.log("POL: "+p);
                        p.mass = (p.area * fd.mass) / fd.area;

                        p.momentum = cp.momentForPoly(p.mass, p.vertices, cc.p(0, 0));
                        //cc.log("OBLICZONY MOMEMTUM: "+p.momentum);

                        totalFixtureMomentum += p.momentum;
                    }
                }
                fd.momentum = totalFixtureMomentum;
                totalBodyMomentum = totalFixtureMomentum;
            }

            bodyDef.mass = totalMass;
            bodyDef.momentum = totalBodyMomentum;
        }

        return true;
    },

    /**
     * Creates a body with the given name in the given space.
     * @param name name of the body
     * @param space pointer to the space
     * @param data data to set in the body
     * @result new created body
     */
    createBodyWithName: function (name, space, data) {
        var bd = bodyDefs[name];

        if (!bd)
            return 0;

        var body = new cp.Body(bd.mass, bd.momentum);

        body.p = bd.anchorPoint;
        body.data = data;

        space.addBody(body);

        for (var fdIndex in bd.fixtures) {
            var fd = bd.fixtures[fdIndex];

            for (var pIndex in fd.polygons) {
                var p = fd.polygons[pIndex];

                var shape = new cp.PolyShape(body, p.vertices, cc.p(0, 0));

                shape.e = fd.elasticity;
                shape.u = fd.friction;
                shape.surface_v = fd.surfaceVelocity;
                shape.collision_type = fd.collisionType;
                shape.group = fd.group;
                shape.layers = fd.layers;
                shape.sensor = fd.isSensor;

                space.addShape(shape);
            }
        }
        return body;
    },

    /**
     * Returns the anchor point of the given sprite
     * @param shape name of the shape to get the anchorpoint for
     * @return anchorpoint
     */
    anchorPointForShape: function (shape) {
        var bd = bodyDefs[shape];
        if (bd != null)
            return bd.anchorPoint;
        else return null;
    }

});

gcp.s_sharedShapeCache = null;

/**
 * Returns the shared instance of the Shape cache
 * @return {gcp.ShapeCache}
 */
gcp.ShapeCache.getInstance = function () {
    if (!gcp.s_sharedShapeCache) {
        gcp.s_sharedShapeCache = new gcp.ShapeCache();
    }
    return gcp.s_sharedShapeCache;
};

/**
 * Purges the cache. It releases all the Sprite Frames and the retained instance.
 */
gcp.ShapeCache.purgeSharedShapeCache = function () {
    gcp.s_sharedShapeCache = null;
};


var g = g || {};

g.Polygon = cc.Class.extend({
    vertices: null,
    numVertices: 0,
    area: 0.0,
    mass: 0.0,
    momentum: 0.0
});

/**
 * Fixture definition
 * Holds fixture data
 */
g.FixtureData = cc.Class.extend({
    mass: 0.0,
    elasticity: 0.0,
    friction: 0.0,
    surfaceVelocity: null,
    collisionType: null,
    group: null,
    layers: null,
    area: 0.0,
    momentum: 0.0,
    isSensor: false,
    polygons: []
});

/**
 * Body definition
 * Holds the body and the anchor point
 */
g.BodyDef = cc.Class.extend({
    anchorPoint: null,
    fixtures: [],
    mass: 0.0,
    momentum: 0.0
});
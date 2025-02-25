/* Copyright 2017 Dominik Marczuk

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

//
// Modified by Lean from bitbucket.org/umbraprojekt/mrpas
// 1. Added angle & circle restrictions
//

"use strict";
var Mrpas = (function () {
    function Mrpas(mapWidth, mapHeight, isTransparent) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.isTransparent = isTransparent;
    }

    var OCTANT_X = 0;
    var OCTANT_Y = 1;

    Mrpas.prototype.computeOctantY = function (deltaX, deltaY, data) {
        var startSlopes = [];
        var endSlopes = [];
        var iteration = 1;
        var totalObstacles = 0;
        var obstaclesInLastLine = 0;
        var minSlope = 0;
        var x;
        var y;
        var halfSlope;
        var processedCell;
        var visible;
        var extended;
        var centreSlope;
        var startSlope;
        var endSlope;
        var previousEndSlope;

        var [minViewSlope, maxViewSlope] = computeSlopeRange(deltaX, deltaY, OCTANT_Y, data);
        if (minViewSlope >= maxViewSlope) return;

        for (y = data.originY + deltaY; y >= data.minY && y <= data.maxY; y += deltaY, obstaclesInLastLine = totalObstacles, ++iteration) {
            halfSlope = 0.5 / iteration;
            previousEndSlope = -1;
            for (processedCell = Math.floor(minSlope * iteration + 0.5), x = data.originX + (processedCell * deltaX); processedCell <= iteration && x >= data.minX && x <= data.maxX; x += deltaX, ++processedCell, previousEndSlope = endSlope) {
                visible = true;
                extended = false;
                centreSlope = processedCell / iteration;
                startSlope = previousEndSlope;
                endSlope = centreSlope + halfSlope;
                if ((x - data.originX) ** 2 + (y - data.originY) ** 2 >= data.radius2) {
                    visible = false;
                } else if (obstaclesInLastLine > 0) {
                    if (!(data.isVisible(x, y - deltaY) &&
                        this.isTransparent(x, y - deltaY)) &&
                        !(data.isVisible(x - deltaX, y - deltaY) &&
                            this.isTransparent(x - deltaX, y - deltaY))) {
                        visible = false;
                    }
                    else {
                        for (var idx = 0; idx < obstaclesInLastLine && visible; ++idx) {
                            if (startSlope <= endSlopes[idx] && endSlope >= startSlopes[idx]) {
                                if (this.isTransparent(x, y)) {
                                    if (centreSlope > startSlopes[idx] && centreSlope < endSlopes[idx]) {
                                        visible = false;
                                        break;
                                    }
                                }
                                else {
                                    if (startSlope >= startSlopes[idx] && endSlope <= endSlopes[idx]) {
                                        visible = false;
                                        break;
                                    }
                                    else {
                                        startSlopes[idx] = Math.min(startSlopes[idx], startSlope);
                                        endSlopes[idx] = Math.max(endSlopes[idx], endSlope);
                                        extended = true;
                                    }
                                }
                            }
                        }
                    }
                }

                if (visible) {
                    if (centreSlope >= minViewSlope && centreSlope <= maxViewSlope) {
                        data.setVisible(x, y);
                    }
                    if (!this.isTransparent(x, y)) {
                        if (minSlope >= startSlope) {
                            minSlope = endSlope;
                        }
                        else if (!extended) {
                            startSlopes[totalObstacles] = startSlope;
                            endSlopes[totalObstacles++] = endSlope;
                        }
                    }
                }
            }
        }
    };
    Mrpas.prototype.computeOctantX = function (deltaX, deltaY, data) {
        var startSlopes = [];
        var endSlopes = [];
        var iteration = 1;
        var totalObstacles = 0;
        var obstaclesInLastLine = 0;
        var minSlope = 0;
        var x;
        var y;
        var halfSlope;
        var processedCell;
        var visible;
        var extended;
        var centreSlope;
        var startSlope;
        var endSlope;
        var previousEndSlope;

        var [minViewSlope, maxViewSlope] = computeSlopeRange(deltaX, deltaY, OCTANT_X, data);
        if (minViewSlope >= maxViewSlope) return;

        for (x = data.originX + deltaX; x >= data.minX && x <= data.maxX; x += deltaX, obstaclesInLastLine = totalObstacles, ++iteration) {
            halfSlope = 0.5 / iteration;
            previousEndSlope = -1;
            for (processedCell = Math.floor(minSlope * iteration + 0.5), y = data.originY + (processedCell * deltaY); processedCell <= iteration && y >= data.minY && y <= data.maxY; y += deltaY, ++processedCell, previousEndSlope = endSlope) {
                visible = true;
                extended = false;
                centreSlope = processedCell / iteration;
                startSlope = previousEndSlope;
                endSlope = centreSlope + halfSlope;
                if ((x - data.originX) ** 2 + (y - data.originY) ** 2 >= data.radius2) {
                    visible = false;
                } else if (obstaclesInLastLine > 0) {
                    if (!(data.isVisible(x - deltaX, y) &&
                        this.isTransparent(x - deltaX, y)) &&
                        !(data.isVisible(x - deltaX, y - deltaY) &&
                            this.isTransparent(x - deltaX, y - deltaY))) {
                        visible = false;
                    }
                    else {
                        for (var idx = 0; idx < obstaclesInLastLine && visible; ++idx) {
                            if (startSlope <= endSlopes[idx] && endSlope >= startSlopes[idx]) {
                                if (this.isTransparent(x, y)) {
                                    if (centreSlope > startSlopes[idx] && centreSlope < endSlopes[idx]) {
                                        visible = false;
                                        break;
                                    }
                                }
                                else {
                                    if (startSlope >= startSlopes[idx] && endSlope <= endSlopes[idx]) {
                                        visible = false;
                                        break;
                                    }
                                    else {
                                        startSlopes[idx] = Math.min(startSlopes[idx], startSlope);
                                        endSlopes[idx] = Math.max(endSlopes[idx], endSlope);
                                        extended = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (visible) {
                    if (centreSlope >= minViewSlope && centreSlope <= maxViewSlope) {
                        data.setVisible(x, y);
                    }
                    if (!this.isTransparent(x, y)) {
                        if (minSlope >= startSlope) {
                            minSlope = endSlope;
                        }
                        else if (!extended) {
                            startSlopes[totalObstacles] = startSlope;
                            endSlopes[totalObstacles++] = endSlope;
                        }
                    }
                }
            }
        }
    };
    Mrpas.prototype.setMapDimensions = function (mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    };
    Mrpas.prototype.compute = function (originX, originY, radius, heading, viewAngle, isVisible, setVisible) {
        setVisible(originX, originY);
        var data = {
            minX: Math.max(0, originX - radius),
            minY: Math.max(0, originY - radius),
            maxX: Math.min(this.mapWidth - 1, originX + radius),
            maxY: Math.min(this.mapHeight - 1, originY + radius),
            originX: originX,
            originY: originY,
            heading,
            halfViewAngle: viewAngle / 2,
            radius: radius,
            radius2: radius * radius,
            isVisible: isVisible,
            setVisible: setVisible
        };
        this.computeOctantY(1, 1, data);
        this.computeOctantX(1, 1, data);
        this.computeOctantY(1, -1, data);
        this.computeOctantX(1, -1, data);
        this.computeOctantY(-1, 1, data);
        this.computeOctantX(-1, 1, data);
        this.computeOctantY(-1, -1, data);
        this.computeOctantX(-1, -1, data);
    };

    function computeSlopeRange(deltaX, deltaY, octant, data) {
        var angle; // angle relative to octant's base
        if (octant === OCTANT_X) {
            if (deltaX === 1 && deltaY === 1) angle = -Math.PI / 2 + data.heading;
            else if (deltaX === -1 && deltaY === 1) angle = -Math.PI / 2 - data.heading;
            else if (deltaX === 1 && deltaY === -1) angle = Math.PI / 2 - data.heading;
            else if (deltaX === -1 && deltaY === -1) angle = Math.PI / 2 + data.heading;
        } else {
            if (deltaX === 1 && deltaY === 1) angle = Math.PI - data.heading;
            else if (deltaX === -1 && deltaY === 1) angle = Math.PI + data.heading;
            else if (deltaX === 1 && deltaY === -1) angle = data.heading;
            else if (deltaX === -1 && deltaY === -1) angle = -data.heading;
        }

        while (angle < -Math.PI) angle += Math.PI * 2;
        while (angle > Math.PI) angle -= Math.PI * 2;

        var minHeading = angle - data.halfViewAngle;
        var maxHeading = angle + data.halfViewAngle;

        var minSlope = angleToSlope(minHeading);
        var maxSlope = angleToSlope(maxHeading)
        return [minSlope, maxSlope];
    }

    function angleToSlope(angle) {
        return angle <= 0 ? 0 : angle >= Math.PI / 4 ? 1 : Math.tan(angle);
    }

    return Mrpas;
}());
export { Mrpas };

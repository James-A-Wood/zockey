



define(
        [], // no dependencies
        function () {


            // tests whether the line intersects with any four sides of the rectangle
            return function (line, rect) {


                // p = line startpoint, p2 = line endpoint
                var p = {x: line.x1, y: line.y1};
                var p2 = {x: line.x2, y: line.y2};


                // top rect line
                var q = {x: rect.x, y: rect.y};
                var q2 = {x: rect.x + rect.width, y: rect.y};
                if (doLineSegmentsIntersect(p, p2, q, q2)) {
                    return true;
                }


                // right rect line
                var q = q2;
                var q2 = {x: rect.x + rect.width, y: rect.y + rect.height};
                if (doLineSegmentsIntersect(p, p2, q, q2)) {
                    return true;
                }


                // bottom rect line
                var q = q2;
                var q2 = {x: rect.x, y: rect.y + rect.height};
                if (doLineSegmentsIntersect(p, p2, q, q2)) {
                    return true;
                }


                // left rect line
                var q = q2;
                var q2 = {x: rect.x, y: rect.y};
                if (doLineSegmentsIntersect(p, p2, q, q2)) {
                    return true;
                }




                /**
                 * See if two line segments intersect. This uses the 
                 * vector cross product approach described below:
                 * http://stackoverflow.com/a/565282/786339
                 * 
                 * @param {Object} p point object with x and y coordinates
                 *  representing the start of the 1st line.
                 * @param {Object} p2 point object with x and y coordinates
                 *  representing the end of the 1st line.
                 * @param {Object} q point object with x and y coordinates
                 *  representing the start of the 2nd line.
                 * @param {Object} q2 point object with x and y coordinates
                 *  representing the end of the 2nd line.
                 */


                function doLineSegmentsIntersect(line1Start, line1End, line2Start, line2End) {


                    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
                    var denominator, a, b, numerator1, numerator2;
                    var intersection = {};


                    denominator = ((line2End.y - line2Start.y) * (line1End.x - line1Start.x)) - ((line2End.x - line2Start.x) * (line1End.y - line1Start.y));
                    if (denominator === 0) {
                        return false;
                    }

                    a = line1Start.y - line2Start.y;
                    b = line1Start.x - line2Start.x;

                    numerator1 = ((line2End.x - line2Start.x) * a) - ((line2End.y - line2Start.y) * b);
                    numerator2 = ((line1End.x - line1Start.x) * a) - ((line1End.y - line1Start.y) * b);

                    a = numerator1 / denominator;
                    b = numerator2 / denominator;


                    // if we cast these lines infinitely in both directions, they intersect here:
                    intersection.x = line1Start.x + (a * (line1End.x - line1Start.x));
                    intersection.y = line1Start.y + (a * (line1End.y - line1Start.y));


                    // if the two line segments intersect, then returning the distance of the intersection
                    // from the start of line1
                    if (a > 0 && a < 1 && b > 0 && b < 1) {
                        return Math.sqrt(Math.pow(line1Start.x - intersection.x, 2) + Math.pow(line1Start.y - intersection.y, 2));
                    }
                    
                    
                    return false;
                }



//                function doLineSegmentsIntersect(p, p2, q, q2) {
//
//
//                    var r = subtractPoints(p2, p);
//                    var s = subtractPoints(q2, q);
//
//
//                    var uNumerator = crossProduct(subtractPoints(q, p), r);
//                    var denominator = crossProduct(r, s);
//
//
//                    if (uNumerator === 0 && denominator === 0) {
//                        // colinear, so do they overlap?
//                        return ((q.x - p.x < 0) !== (q.x - p2.x < 0) !== (q2.x - p.x < 0) !== (q2.x - p2.x < 0)) ||
//                                ((q.y - p.y < 0) !== (q.y - p2.y < 0) !== (q2.y - p.y < 0) !== (q2.y - p2.y < 0));
//                    }
//
//
//                    if (denominator === 0) {
//                        // lines are paralell
//                        return false;
//                    }
//
//
//                    var u = uNumerator / denominator;
//                    var t = crossProduct(subtractPoints(q, p), s) / denominator;
//
//
//                    return (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
//
//
//                    /**
//                     * Calculate the cross product of the two points.
//                     * 
//                     * @param {Object} point1 point object with x and y coordinates
//                     * @param {Object} point2 point object with x and y coordinates
//                     * 
//                     * @return the cross product result as a float
//                     */
//                    function crossProduct(point1, point2) {
//                        return point1.x * point2.y - point1.y * point2.x;
//                    }
//
//
//                    /**
//                     * Subtract the second point from the first.
//                     * 
//                     * @param {Object} point1 point object with x and y coordinates
//                     * @param {Object} point2 point object with x and y coordinates
//                     * 
//                     * @return the subtraction result as a point object.
//                     */
//                    function subtractPoints(point1, point2) {
//                        var result = {};
//                        result.x = point1.x - point2.x;
//                        result.y = point1.y - point2.y;
//                        return result;
//                    }
//                }


                // If not intersecting with the 4 rect sides, then returning false
                return false;
            };

        }

);
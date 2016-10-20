/*
 jeez this should be done visually.......
 */

var undoIconSize = 1792;
var undoIconPath = "M1664 896q0 156-61 298t-164 245-245 164-298 61q-172 0-327-72.5t-264-204.5q-7-10-6.5-22.5t8.5-20.5l137-138q10-9 25-9 16 2 23 12 73 95 179 147t225 52q104 0 198.5-40.5t163.5-109.5 109.5-163.5 40.5-198.5-40.5-198.5-109.5-163.5-163.5-109.5-198.5-40.5q-98 0-188 35.5t-160 101.5l137 138q31 30 14 69-17 40-59 40h-448q-26 0-45-19t-19-45v-448q0-42 40-59 39-17 69 14l130 129q107-101 244.5-156.5t284.5-55.5q156 0 298 61t245 164 164 245 61 298z"

var body = d3.select("body");

var height = 200;
var width = 200;

var svg = body.append("svg")
              .attr("width", width)
              .attr("height", height);

function translate(x, y) {
    return "translate(" + x + ", " + y + ")";
}

var menu = svg.append("g")
              .attr("transform", translate(100, 100))

var exit = svg.append("g")
              .attr("transform", translate(100, 100));

var exitRadius = 20;

var exitData = [
    {
        innerRadius: 0,

        outerRadius: exitRadius,
        startAngle: 0,
        endAngle: Math.PI * 2,
        fill: "red",
    }
]

var outerRadius = 60;
var TWO_PI = Math.PI * 2;

var currentAngle = 0;

var colors = ["white", "black", "#f97cd2", "#7cd6f9", "#b7f97c", "#f9d87c"];
var colorL = colors.length;
var colorData = colors.map(function(color, ind) {
    var prevAngle = currentAngle;
    currentAngle = currentAngle + (TWO_PI / (4 * colorL));

    return {
        innerRadius: exitRadius,
        outerRadius: outerRadius,
        startAngle: prevAngle,
        endAngle: currentAngle,
        fill: color,
    }
});

var sizes = [1, 4, 16, 64];
var sizeL = sizes.length;

var sizeData = sizes.map(function(size) {
    var prevAngle = currentAngle;
    currentAngle = currentAngle + (TWO_PI / (4 * sizeL));

    return {
        innerRadius: exitRadius,
        outerRadius: outerRadius,
        startAngle: prevAngle,
        endAngle: currentAngle,
        fill: "gray"
    }
});

var actions = ["undo", "redo"];
var actionL = actions.length;

var actionData = actions.map(function(action) {
    var prevAngle = currentAngle;
    currentAngle = currentAngle + (TWO_PI / (4 * actionL));

    return {
        innerRadius: exitRadius,
        outerRadius: outerRadius,
        startAngle: prevAngle,
        endAngle: currentAngle,
        fill: "gray"
    }
}); 

var menuData = colorData.concat(sizeData, actionData);
var arc = d3.arc();

exit.selectAll("path.exit")
    .data(exitData)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", function(obj) {
        return obj.fill;
    });

var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.size });

menu.selectAll("path.menu")
    .data(pie(menuData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", function(obj) {
        return obj.fill;
    });
/*
menu.selectAll("path.actions")
    .data(actionData)
    .enter()
    .append("path")
    .attr("d", undoIconPath)
.attr("transform", translate())
*/
/*

refactor to pie 
add undo
add sizes




On next:
get the undo icon in the right place
put size numbers

refactor add state


   Todo:
     Add click events on sections
     Make look correct
     Add pop open animation
     Remove some duplicate code
     Abstract into a tight library

   https://github.com/d3/d3-shape/blob/master/README.md#arc

Don't forget to look up emacs shortcuts to slowness

*/

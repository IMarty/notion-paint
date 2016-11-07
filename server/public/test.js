/*
 jeez this should be done visually.......
 */

// write arc data creator function
var socket = io();

var frontCanvasEl = document.getElementById('frontCanvas');
var backCanvasEl = document.getElementById('backCanvas');

var frontCtx = frontCanvasEl.getContext("2d");
var backCtx = backCanvasEl.getContext("2d");

// indexes line up between these
// {points: [[x, y], []], attrs: {}, size: size};
var strokeData = [];
var points = [];

var myStrokeIds = [];
var redoStrokes = [];

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
}

function translate(x, y) {
    return "translate(" + x + ", " + y + ")";
}

function makeValidSelector(str) {
    return "cl_" + str.replace("#", "");
}

// from http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

/* Actions */
var stateActions = {
    emit: function () {
        // Adds uuid as first param to emit
        var args = _.toArray(arguments);
        var uuid = window.location.pathname.split("/")[2];
        socket.emit.apply(socket, [_.first(args), uuid].concat(_.tail(args)));  
    },
    getInitialData: function () {
        this.emit("getInitialData");
    },
    paint: function (strokeDatum) {
        if (!strokeDatum.id) {
            strokeDatum.id = guid();
        }
        
        strokeData.push(strokeDatum);
        points = [];
        drawLineToCanvas(frontCtx, points, menu.activeSections, true);        
        redoStrokes = [];
        myStrokeIds.push(strokeDatum.id);
        this.emit("paint", strokeDatum);
    },
    undo: function () {        
        var id = myStrokeIds.pop();
        var strokeDatum = _.remove(strokeData, function(strokeDatum) {
            return strokeDatum.id === id;
        })[0];
        
        redoStrokes.push(strokeDatum);
        reloadCanvas();
        this.emit("undo", strokeDatum.id);
        
    },
    redo: function () {
        if (redoStrokes.length) {
            this.paint(redoStrokes.pop());
        }
    }
}

stateActions.getInitialData();

/* Listeners */
socket.on("serverImageData", function (data) {
    strokeData = JSON.parse(data).imageData;
    console.log("strokeData", strokeData);
    reloadCanvas();
});

var Menu = function() {
    var size = 150;
    var menuAttrs = {
        height: size,
        width: size
    }

    var activeSections =  {
        size: "small",
        color: "black"
    };

    var menuElement = createMenu();

    function createMenu() {
        var width = menuAttrs.width;
        var height = menuAttrs.height;

        var exitRadius = 20;
        var outerRadius = 60;
        var totalPie = 12;

        var exitData = [
            {
                innerRadius: 0,
                outerRadius: exitRadius,
                startAngle: 0,
                endAngle: Math.PI * 2,
                fill: "#ff8282",
            }
        ];

        var colors = ["white", "black", "#f97cd2", "#7cd6f9", "#b7f97c", "#f9d87c"];
        var colorData = _.map(colors, function(color, ind) {
            return {
                tag: "color",
                size: (totalPie * .25) / colors.length,
                fill: color,
                id: color
            }
        });

        var sizes = ["tiny", "small", "medium", "large"];

        var nonColorOptionColor = "#f2f2f2";

        var sizeData = _.map(sizes, function(size) {
            return {
                size: (totalPie * .5) / sizes.length,
                tag: "size",
                fill: nonColorOptionColor,
                id: size
            }
        });

        var actions = [{id: "undo" , imgUrl: "/undo.svg"},{id: "redo", imgUrl: "/redo.svg"}];
        
        var actionData = _.map(actions, function(action) {    
            return _.extend(action, {
                tag: "action",
                fill: nonColorOptionColor,
                size: (totalPie * .25) / actions.length,
                displaySize: 15
            });
        });

        var menuData = colorData.concat(sizeData, actionData);

        // Generators
        var exitArc = d3.arc();
        var menuArc = d3.arc()
                        .innerRadius(exitRadius)
                        .outerRadius(outerRadius);

        var pie = d3.pie()
                    .sort(null)
                    .value(function(d) { return d.size });


        // Create Top Level Elements
        var body = d3.select("body");
        var svg = body.append("svg")
                      .style("display", "none")
                      .attr("width", width)
                      .attr("height", height);

        var menu = svg.append("g")
                      .attr("transform", translate(width/2, height/2))

        var exit = svg.append("g")
                      .attr("transform", translate(width/2, height/2));


        // Adds filter for drop shadow

        // From http://bl.ocks.org/cpbotha/5200394
        // filters go in defs element
        var defs = svg.append("defs");

        // create filter with id #drop-shadow
        // height=130% so that the shadow is not clipped
        var filter = defs.append("filter")
                         .attr("id", "shadow")
                         .attr("height", "130%");

        // SourceAlpha refers to opacity of graphic that this filter will be applied to
        // convolve that with a Gaussian with standard deviation 3 and store result
        // in blur
        filter.append("feGaussianBlur")
              .attr("in", "SourceAlpha")
              .attr("stdDeviation", 2)
              .attr("result", "blur");

        // translate output of Gaussian blur to the right and downwards with 2px
        // store result in offsetBlur
        filter.append("feOffset")
              .attr("in", "blur")
              .attr("dx", 0)
              .attr("dy", 0)
              .attr("result", "offsetBlur");

        // overlay original SourceGraphic over translated blurred opacity by using
        // feMerge filter. Order of specifying inputs is important!
        var feMerge = filter.append("feMerge");

        feMerge.append("feMergeNode")
               .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
               .attr("in", "SourceGraphic");

        // Inner exit button
        exit.selectAll("path.exit")
            .data(exitData)
            .enter()
            .append("path")
            .attr("d", exitArc)
            .attr("fill", function(obj) {
                return obj.fill;
            })
            .on("click", hideMenu);

        exit.append("image")
            .attr("width", 20)
            .attr("height", 20)
            .attr("href", "/exit.svg")
            .attr("x", 0 - (20/2))
            .attr("y", 0 - (20/2))
            .style("pointer-events", "none")

        var menuPieSlices = menu.append("g");
        var sectionPieSliceGroups = menuPieSlices.selectAll("path.menu")
                                                 .data(pie(menuData))
                                                 .enter()
                                                 .append("g");

        sectionPieSliceGroups.attr("class", function (obj) { return makeValidSelector(obj.data.id); })
                             .append("path")
                             .attr("d", menuArc)            
                             .attr("fill", function(obj) {
                                 return obj.data.fill;
                             })
                             .on("click", function(obj) {
                                 // Handle Events
                                 if (obj.data.id === "undo") {
                                     stateActions.undo();
                                 } else if (obj.data.id === "redo") {
                                     stateActions.redo();
                                 } else {
                                     activeSections[obj.data.tag] = obj.data.id;
                                     d3.selectAll(".active")
                                       .classed("active", false)
                                       .style("filter", null);

                                     activateActiveSections(activeSections);    
                                 }                                
                             });

        // draw undo redo icons
        sectionPieSliceGroups.filter(function (d) { return d.data.id === "redo" || d.data.id === "undo"; })
                             .append("image")
                             .attr("width", function (d) { return d.data.displaySize; })
                             .attr("height", function (d) { return d.data.displaySize; })
                             .attr("href", function (d) { return d.data.imgUrl; })
                             .attr("x", function (d) { return menuArc.centroid(d)[0] - (d.data.displaySize/2); })
                             .attr("y", function (d) { return menuArc.centroid(d)[1] - (d.data.displaySize/2); })
                             .attr("class", "actions")
                             .style("pointer-events", "none");

        function activateActiveSections(activeSections) {
            _.forEach(activeSections, function (cl, tag) {
                d3.select("." + makeValidSelector(cl))
                  .classed("active", true)
                  .style("filter", "url(#shadow)")
                  .moveToFront();
            });    
        }
        
        sectionPieSliceGroups.filter(function(d) { return d.data.tag === "size"; })
                        .append("circle")
                        .attr("cx", function (d) {
                            return menuArc.centroid(d)[0];
                        })
                        .attr("cy", function (d) {
                            return menuArc.centroid(d)[1];
                        })
                        .attr("r", function (d) {
                            if (d.data.id === "tiny") {
                                return 2
                            } else if (d.data.id === "small") {
                                return 4
                            } else if (d.data.id === "medium") {
                                return 7
                            } else if (d.data.id === "large") {
                                return 12
                            }
                        })
                        .attr("fill", "gray")
                        .style("pointer-events", "none")        

        // Draw border
        menu.append("circle")
            .attr("r", outerRadius)
            .attr("class", "menuBorder");

        // Draw segments
        menu.selectAll("path.segments")
            .data([
                { points:[[-exitRadius, 0], [-outerRadius, 0]] },
                { points:[[exitRadius, 0], [outerRadius, 0]] },
                { points:[[0, -exitRadius], [0, -outerRadius]] }
            ])
            .enter()
            .append("path")
            .attr("d", function(d) { return d.points.reduce(function(str, point, ind) {
                var nextStr = '';
                if (ind === 0) {
                    nextStr = "M " + point[0] + " " + point[1];
                } else {
                    nextStr = "L " + point[0] + " " + point[1];
                }
                return str + " " + nextStr;
            }, "")})
            .attr("stroke", "gray")
            .attr("stroke-width", 1)

        activateActiveSections(activeSections);

        return svg;
    }

    function openMenu(x, y) {
        menuElement.style("display", "block")
                   .style("position", "absolute")
                   .style("left", (x - menuAttrs.width/2) + "px")
                   .style("top", (y - menuAttrs.height/2) + "px");
    }

    function hideMenu() {
        menuElement.style("display", "none");
    }

    return {
        isOpen: false,
        activeSections: activeSections,
        open: function(x, y) {
            openMenu(x, y);
            this.isOpen = true;
        },
        close: function(x, y) {
            hideMenu();
            this.isOpen = false;
        }
    }
}

function stopEvent(event){
    if(event.preventDefault != undefined)
        event.preventDefault();
    if(event.stopPropagation != undefined)
        event.stopPropagation();
}

var menu = Menu();

d3.select("body").on("contextmenu", function() {
    var e = d3.event;
    stopEvent(e);
    return false;
});

function drawCircle(ctx, cx, cy, r, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2*Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

var mouseIsDown = false;

d3.select(frontCanvasEl).on("mousemove", function() {
    var e = d3.event;
    if (mouseIsDown) {
        points.push([e.clientX, e.clientY]);
        drawLineToCanvas(frontCtx, points, menu.activeSections, true);
    }
    /* if want to draw the cursor  */
    /*     drawCursor(e.clientX, e.clientY,  sizeToPixels[menu.activeSections.size], menu.activeSections.color);*/
});

d3.select(frontCanvasEl).on("mousedown", function() {
    var e = d3.event;
    
    var isRightMB;
    e = e || window.event;

    if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
        isRightMB = e.which == 3; 
    else if ("button" in e)  // IE, Opera 
        isRightMB = e.button == 2;
    if (isRightMB) {
        menu.open(e.clientX, e.clientY);
    } else if (menu.isOpen) {
        menu.close();
    } else {
        mouseIsDown = true;
        points.push([e.clientX, e.clientY]);
        drawLineToCanvas(frontCtx, points, menu.activeSections, true);
    }
});

function onMouseUp() {
    if (mouseIsDown) {
        mouseIsDown = false;
        drawLineToCanvas(backCtx, points, menu.activeSections, false);
        var strokeDatum = {
            attrs: _.clone(menu.activeSections),
            size: canvasWidth,
            points: points
        };

        stateActions.paint(strokeDatum);
    }
}

var sizeToPixels = {
    tiny: 3,
    small: 8,
    medium: 16,
    large: 64
};

d3.select(frontCanvasEl).on("mouseup", onMouseUp);
d3.select("body").on("mouseleave", onMouseUp);

function drawLineToCanvas(ctx, linePoints, activeSections, shouldClear, windowSize) {
    //TD: should change this to greatest width
    var scale = 1;
    if (windowSize) {
        scale = canvasWidth/windowSize; 
    }

    if (shouldClear) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    var attrs = {
        strokeStyle: activeSections.color,
        lineCap: "round",
        lineWidth: sizeToPixels[activeSections.size]
    }
    ctx.save();
    ctx.scale(scale, scale);

    ctx.beginPath();
    _.forEach(attrs, function (value, name) {
        ctx[name] = value;
    });
    
    linePoints.forEach(function (point, ind) {
       if (ind !== 0) {
           var prevPoint = linePoints[ind - 1];
           ctx.moveTo(prevPoint[0], prevPoint[1]);
       }
       ctx.lineTo(point[0], point[1]); 
    });

    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

function drawCursor(mx, my, size, color) {
    var cursor = d3.select("svg.cursor");
    var cursorCircle = d3.select("circle.cursor");

    if (cursor.empty()) {
        cursor = d3.select("body")
                   .append("svg")
                   .classed("cursor", true)
                   .style("position", "absolute")
                   .style("pointer-events", "none")

        cursorCircle = cursor.append("circle")
                             .classed("cursor", true);
                   
    }

    cursor.attr("width", size)
          .attr("height", size)
          .style("left", mx - size/2)
          .style("top", my - size/2)

    cursorCircle.attr("cx", size/2)
                .attr("cy", size/2)
                .attr("fill", color)
                .attr("r", size/2);
}

var canvasWidth;
var canvasHeight;

function reloadCanvas() {
    backCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    strokeData.forEach(function(strokeDatum, ind) {
        drawLineToCanvas(backCtx, strokeDatum.points, strokeDatum.attrs, false, strokeDatum.size);
    });
}

$(document).ready(function(){
    var front = $(frontCanvas);
    var back = $(backCanvas);

    /*
    var ct = c.get(0).getContext('2d');
    */

    var container = $(front).parent();

    //Run function when browser resizes
    $(window).resize( respondCanvas );

    function respondCanvas(){
        canvasWidth = $(container).width();
        canvasHeight = $(container).height();
        front.attr('width', canvasWidth); //max width
        front.attr('height', canvasHeight); //max height

        back.attr('width', canvasWidth); //max width
        back.attr('height', canvasHeight); //max height

        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }
        
        var resizeTimer = setTimeout(reloadCanvas, 200);
    }

    //Initial call 
    respondCanvas();
});


/*
   Things to do:
   
   - Fix ordering of menu
   - Fix height and width
   - Add a border that looks good in notion
   - Add right click for menu text
   - Make landing page
   - Gray out if can't undo or redo
   - Change drawing algo to not skip no matter how much time is spent drawing
   - Fix menu 
   - Add animations to menu
   - Deploy onto server
   - Set data to background picture
   - Refactor globals in code

*/







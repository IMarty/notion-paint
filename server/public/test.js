/*
 jeez this should be done visually.......
 */

// write arc data creator function
function style(styles) {
    return _.reduce(styles, function(styleStr, value, key) {
        return styleStr + key + ": " + value + ";";
    }, '');
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
        // Data
        var MENU_CHILD_CLASS = "menuChildClass";
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

        var actions = ["undo", "redo"];

        var actionData = _.map(actions, function(action) {    
            return {
                tag: "action",
                fill: nonColorOptionColor,
                size: (totalPie * .25) / actions.length,
                id: action
            }
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
                      .attr("style", style({display: "none"}))
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
        
        
        function renderIconAtCentroid(pieDatum, iconLink) {
            var centroidPoint = menuArc.centroid(pieDatum);
            
            var iconWidth = 15;
            var iconHeight = 15;

            menu.append("image")
                .attr("width", iconWidth)
                .attr("height", iconHeight)
                .attr("href", iconLink)
                .attr("x", function (d) { return centroidPoint[0] - (iconWidth/2) })
                .attr("y", function (d) { return centroidPoint[1] - (iconHeight/2) })
                .attr("class", "actions");            
        }

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
            .attr("style", style({"pointer-events": "none"}));

        menu.selectAll("path.menu")
            .data(pie(menuData))
            .enter()
            .append("g")
            .attr("class", function (obj) {
                return makeValidSelector(obj.data.id);
            })
            .append("path")
            .attr("d", menuArc)            
            .attr("fill", function(obj) {
                return obj.data.fill;
            })
            .on("click", function(obj) {
                // Handle Events
                if (obj.data.tag === "action") {
                    return false;
                }

                activeSections[obj.data.tag] = obj.data.id;
                d3.selectAll(".active")
                  .classed("active", false)
                  .style("filter", null);

                activateActiveSections(activeSections);
            });

        function activateActiveSections(activeSections) {
            _.forEach(activeSections, function (cl, tag) {
                d3.select("." + makeValidSelector(cl))
                  .classed("active", true)
                  .style("filter", "url(#shadow)")
                  .moveToFront();
            });    
        }

        var sizeData = pie(menuData).forEach(function(menuDatum) {
            var d = menuDatum;
            if(menuDatum.data.tag === "size") {
                d3.select("g." + makeValidSelector(d.data.id))
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
                  .attr("style", style({"pointer-events": "none"}))        
            }
        });

        //Render undo icon
        renderIconAtCentroid(pie(menuData).find(function(val) {
            return val.data.id === "undo";
        }), '/undo.svg');

        renderIconAtCentroid(pie(menuData).find(function(val) {
            return val.data.id === "redo";
        }), '/redo.svg');

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

        function reorder(parent) {
            console.log(parent);
            parent.sort(function () {
                console.log(arguments);
            });
        }
        
        activateActiveSections(activeSections);
        reorder(menu);

        return svg;
    }

    function openMenu(x, y) {
        menuElement.attr("style", style({
            display: "block",
            position: "absolute",
            left: (x - menuAttrs.width/2) + "px",
            top: (y - menuAttrs.height/2) + "px"
        }));
    }

    function hideMenu() {
        menuElement.attr("style", style({display: "none"}));
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

var frontCanvasEl = document.getElementById('frontCanvas');
var backCanvasEl = document.getElementById('backCanvas');

var frontCtx = frontCanvasEl.getContext("2d");
var backCtx = backCanvasEl.getContext("2d");

var points = [];

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
        drawLineToCanvas(frontCtx, points, menu, true);
    }
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
        drawLineToCanvas(frontCtx, points, menu, true);
    }
});

d3.select(frontCanvasEl).on("mouseup", function() {
    mouseIsDown = false;
    drawLineToCanvas(backCtx, points, menu, false);
    points = [];
});

function drawLineToCanvas(ctx, linePoints, menu, shouldClear) {
    if (shouldClear) {
        ctx.clearRect(0, 0, $(document).width(), $(document).height());
    }

    var sizeToPixels = {
        tiny: 3,
        small: 8,
        medium: 16,
        large: 64
    };

    var attrs = {
        strokeStyle: menu.activeSections.color,
        lineCap: "round",
        lineWidth: sizeToPixels[menu.activeSections.size]
    }

    ctx.beginPath()
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
}

$(document).ready( function(){
    var front = $(frontCanvas);
    var back = $(backCanvas);

    /*
    var ct = c.get(0).getContext('2d');
    */

    var container = $(front).parent();

    //Run function when browser resizes
    $(window).resize( respondCanvas );

    function respondCanvas(){
        var w = $(container).width();
        var h = $(container).height();
        front.attr('width', w); //max width
        front.attr('height', h); //max height

        back.attr('width', w); //max width
        back.attr('height', h); //max height
        //Call a function to redraw other content (texts, images etc)
    }

    //Initial call 
    respondCanvas();
});


/*
  How to write better d3 code:
   understand how to grab data better
   use the classed module more frequently
   understand the whole api

   I suspect all my d3 maps and forEacheas are bad code and could be done with selection and chaining + putting arguments on the data 
   I should do a pass at rewriting...

   What can and cannot be chained in d3?

*/

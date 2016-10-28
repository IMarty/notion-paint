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



var Menu = function() {
    var menuAttrs = {
        height: 120,
        width: 120
    }
    
    var menuElement = createMenu();
    var activeSections =  {
        size: "small",
        color: "black"
    };

    function createMenu() {
        var body = d3.select("body");
        var width = menuAttrs.width;
        var height = menuAttrs.height;
        
        var svg = body.append("svg")
                      .attr("style", style({display: "none"}))
                      .attr("width", width)
                      .attr("height", height);

        var menu = svg.append("g")
                      .attr("transform", translate(width/2, height/2))

        var exit = svg.append("g")
                      .attr("transform", translate(width/2, height/2));

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

        var exitArc = d3.arc();
        var menuArc = d3.arc()
                        .innerRadius(exitRadius)
                        .outerRadius(outerRadius);

        
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


        exit.selectAll("path.exit")
            .data(exitData)
            .enter()
            .append("path")
            .attr("d", exitArc)
            .attr("fill", function(obj) {
                return obj.fill;
            });

        var pie = d3.pie()
                    .sort(null)
                    .value(function(d) { return d.size });

        menu.selectAll("path.menu")
            .data(pie(menuData))
            .enter()
            .append("path")
            .attr("d", menuArc)
            .attr("class", function (obj) {
                return makeValidSelector(obj.data.id);
            })
            .attr("fill", function(obj) {
                return obj.data.fill;
            })
            .on("click", function(obj) {
                // Handle Events
                console.log("click");
                if (obj.data.tag === "action") {
                    return false;
                }

                activeSections[obj.data.tag] = obj.data.id;
                d3.selectAll(".active")
                  .classed("active", false);
                
                _.forEach(activeSections, function (cl, tag) {
                    d3.select("." + makeValidSelector(cl)).classed("active", true);
                });
            });

        var undoDatum = pie(menuData).find(
            function(val) {
                return val.data.id === "undo"
            });

        var redoDatum = pie(menuData).find(
            function(val) {
                return val.data.id === "redo"
            });

        var sizeData = pie(menuData).filter(function(menuDatum) {
            return menuDatum.data.tag === "size";
        });

        menu.selectAll("circle.size")
            .data(sizeData)
            .enter()
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

        exit.append("image")
            .attr("width", 20)
            .attr("height", 20)
            .attr("href", "/exit.svg")
            .attr("x", 0 - (20/2))
            .attr("y", 0 - (20/2))

        renderIconAtCentroid(undoDatum, '/undo.svg');
        renderIconAtCentroid(redoDatum, '/redo.svg');

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

var sizeToPixels = {
    tiny: 3,
    small: 8,
    medium: 16,
    large: 64
};

d3.select("body").on("contextmenu", function() {
    var e = d3.event;
    stopEvent(e);
    return false;
});

var c = document.getElementById('canvas');
var ctx = c.getContext("2d");

function drawCircle(ctx, cx, cy, r, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2*Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

var mouseIsDown = false;

d3.select(c).on("mousemove", function() {
    if (mouseIsDown) {
        var e = d3.event;
        drawCircle(
            ctx,
            e.clientX,
            e.clientY,
            sizeToPixels[menu.activeSections.size],
            menu.activeSections.color
        );
    }
});


d3.select(c).on("mousedown", function() {
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
        drawCircle(
            ctx,
            e.clientX,
            e.clientY,
            sizeToPixels[menu.activeSections.size],
            menu.activeSections.color
        );
    }
});

d3.select(c).on("mouseup", function() {
    mouseIsDown = false;
});


$(document).ready( function(){
    //Get the canvas &
    var c = $('#canvas');
    var ct = c.get(0).getContext('2d');
    var container = $(c).parent();

    //Run function when browser resizes
    $(window).resize( respondCanvas );

    function respondCanvas(){ 
        c.attr('width', $(container).width() ); //max width
        c.attr('height', $(container).height() ); //max height

        //Call a function to redraw other content (texts, images etc)
    }

    //Initial call 
    respondCanvas();

}); 



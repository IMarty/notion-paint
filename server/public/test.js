/*
 jeez this should be done visually.......
 */

// write arc data creator function
function openMenu(x, y) {
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
    ]




    var colors = ["white", "black", "#f97cd2", "#7cd6f9", "#b7f97c", "#f9d87c"];
    var colorL = colors.length;
    var colorData = colors.map(function(color, ind) {
        return {
            tag: "color",
            size: (totalPie * .25) / colorL,
            fill: color,
            id: color
        }
    });

    var sizes = ["tiny", "small", "medium", "large"];
    var sizeL = sizes.length;

    var nonColorOptionColor = "#f2f2f2";

    var sizeData = sizes.map(function(size) {
        return {
            size: (totalPie * .5) / sizeL,
            tag: "size",
            fill: nonColorOptionColor,
            id: size
        }
    });

    var actions = ["undo", "redo"];
    var actionL = actions.length;

    var actionData = actions.map(function(action) {    
        return {
            tag: "action",
            fill: nonColorOptionColor,
            size: (totalPie * .25) / actionL,
            id: action
        }
    }); 

    var menuData = colorData.concat(sizeData, actionData);

    var exitArc = d3.arc();
    var menuArc = d3.arc()
                    .innerRadius(exitRadius)
                    .outerRadius(outerRadius);

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
    //.attr("stroke", "#e5e5e5")
    /*.attr("stroke-width", function (d) {
       if (d.data.tag === "color") {
       return .5;
       } else {
       return 1;
       }
       })*/
        .attr("fill", function(obj) {
            return obj.data.fill;
        });



    var undoDatum = pie(menuData).find(
        function(val) {
            return val.data.id === "undo"
        });

    var redoDatum = pie(menuData).find(
        function(val) {
            return val.data.id === "redo"
        });

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


    var sizeData = pie(menuData).filter(function(menuDatum) {
        return menuDatum.data.tag === "size";
    });

    console.log(sizeData)

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
    
}

//Author: Amrithesh Paravath
var svg1 = d3.select('.legend');
var chart1 = svg1.append('g')
.attr('transform', 'translate('+[0, 0]+')');

var svg2 = d3.select('.info');
var chart2 = svg2.append('g')
.attr('transform', 'translate('+[10, 30]+')');


var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {
        return "<h5>"+d['name']+"</h5>";
    });

var movies;
var highlightNodes = [];
var highlightLinks = [];
var focused = 0;


//Legend creation
chart1.append('circle')
.attr('r','7')
.attr('fill','#1c87c9')
.attr('transform', 'translate('+[10, 10]+')');

chart1.append('text')
.attr('class','legend text')
.text('TV Show')
.attr('transform', 'translate('+[20, 15]+')');

chart1.append('circle')
.attr('r','5')
.attr('fill','#3ae620')
.attr('transform', 'translate('+[75, 11]+')');

chart1.append('text')
.attr('class', 'legend text')
.text('Cast')
.attr('transform', 'translate('+[85, 15]+')');

chart1.append('rect')
.attr('width','25')
.attr('height','3')
.attr('transform', 'translate('+[115, 10]+')')
.attr('fill','gray');

chart1.append('text')
.attr('class', 'legend text')
.text('Acted in')
.attr('transform', 'translate('+[145, 15]+')');

var svg = d3.select(".force"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

svg.call(toolTip);

//Reads JSON and initializes force graph
d3.json("/movies.JSON").then(function(graph) {
  movies = graph;

  d3.select('datalist').selectAll('option')
  .data(graph.nodes)
  .enter()
  .append('option')
  .attr('value', function(d) {return d.name;});
  
	var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links, function(d) {
      return d.index;
    })
    .enter().append("line")
    .attr("stroke-width", function(d) { return 1; } );

  	var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes, function(d) {
      return d.index;
    })
    .enter().append("circle")
      .attr("r", function(d) {
        if (d.type == "Actor") {
          return 3;
        } else {
          return 5;
        }
      })
      .attr("fill", function(d) {
        if (d.type == "Actor") {
          return '#3ae620';
        } else {
          return '#1c87c9';
        }
      })
      .on("mouseover", function(d) {
        focused = 0;
        unfocus();
        toolTip.show(d);
        focus(d);
      })


    var simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink().id(function(d) { 
      return d.name; }))
    .force("charge", d3.forceManyBody().strength(-8))
    .force("center", d3.forceCenter(height/2, width/2))
    .force("collision", d3.forceCollide(5))
    .force("Y", d3.forceY(5))
    .force("X", d3.forceX(5));

  	simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  	simulation.force("link")
      .links(graph.links);

    svg.on("click", function(d) {
        focused = 0;
        d3.select('.force').select('.nodes').selectAll('circle')
        .data(movies.nodes, function(d) {
        return d.index;
        })
        .attr("opacity", "100%");
        d3.select('.force').select('.links').selectAll('line')
        .data(movies.links, function(d) {
        return d.index;
        })
        .attr("opacity", "100%");
        updateInfoCard(null);
        toolTip.hide();
    });
    
  
  	function ticked() {
	    link
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });

	    node
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; });

  }
});

//Updates graph with nodes from JSON
function updateGraph(d) {

  var data = [];
  for (var i = 0; i < movies.nodes.length;i++) {
    if (highlightNodes.includes(movies.nodes[i].name)) {
      data.push(movies.nodes[i]);
    }
  }
  data.push(d);
  d3.select('.force').select('.nodes').selectAll('circle')
    .data(data, function(d) {
      return d.index;
    })
    .exit()
    .attr("opacity", "10%");
  d3.select('.force').select('.links').selectAll('line')
    .data(highlightLinks, function(d) {
      return d.index;
    })
    .exit()
    .attr("opacity", "10%");
}

//Highlights clicked node and neighbouring nodes by reducing opacity of others
function focus(d,i) {
  if (focused == 0) {
    highlightNodes = [];
    highlightLinks = [];
    if (d.type == "Actor") {
      highlightNodes = d.tvshows;
      for (var i=0; i < movies.links.length; i++) {
        if (movies.links[i].target == d) {
          highlightLinks.push(movies.links[i]);
        }
      }
    } else {
        if (d.cast != null) {
          highlightNodes = d.cast.split(', ');
        }
        for (var i=0; i < movies.links.length; i++) {
          if (movies.links[i].source == d) {
            highlightLinks.push(movies.links[i]);
          }
        }
    }
    focused = 1;
    updateGraph(d);
    updateInfoCard(d);
  }
}

//Resets node opacity to highlight everything
function unfocus() {
  focused = 0;
  d3.select('.force').select('.nodes').selectAll('circle')
    .data(movies.nodes, function(d) {
      return d.index;
    })
    .attr("opacity", "100%");
  d3.select('.force').select('.links').selectAll('line')
    .data(movies.links, function(d) {
      return d.index;
    })
    .attr("opacity", "100%");
  updateInfoCard(null);
  toolTip.hide();
}

//Looks at selected option in list and filters graph
function onChoiceChanged() {
        var select = d3.select('#moviechoice').node().value;
        if (select == ""){
          unfocus();
        } else {
          unfocus();
          for (var i = 0; i < movies.nodes.length; i++) {
            if (select == movies.nodes[i].name) {
              focused = 0;
              return focus(movies.nodes[i]);
            }
          }
        }
    }
//Populates info card with relevant information
function updateInfoCard(d) {
  d3.selectAll('.infoCard').remove();
  var textHeight = 15;
  if (d != null) {
    chart2
    .append('text')
    .attr('class','infoCard title')
    .text(d.name);
    
    chart2
    .append('line')
    .attr('class','infoCard underline')
    .attr('transform', 'translate('+[0, textHeight]+')')
    .attr('style', 'stroke:gray;stroke-width:1')
    .attr('x1', '0')
    .attr('x2', '280')
    .attr('y1', '0')
    .attr('y2', '0');

    if(d.type == "Actor") {
      chart2
      .append('text')
      .attr('class','infoCard subHeading')
      .text('Tv Shows:')
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard p')
      .text(d.tvshows)
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });
    } else {
      chart2
      .append('text')
      .attr('class','infoCard subHeading')
      .text('Release Date:')
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard p')
      .text(d.release_date)
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard subHeading')
      .text('Rating:')
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard p')
      .text(d.rating)
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard subHeading')
      .text('Genre:')
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard p')
      .text(d.genre)
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard subHeading')
      .text('Cast:')
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard p')
      .text(d.cast)
      .call(wrap,600)
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight - this.getBBox().height + 17] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard subHeading')
      .text('Plot:')
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight] + ')';
      });

      chart2
      .append('text')
      .attr('class','infoCard p')
      .text(d.description)
      .call(wrap,600)
      .attr('transform', function (d) {
        textHeight+= this.getBBox().height + 5;
        return 'translate(' + [0, textHeight - this.getBBox().height + 17] + ')';
      });
    }
  }
}

//TAKEN AND ADAPTED FROM https://newbedev.com/wrapping-text-in-d3
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.25, // ems
            x = 0,
            y = 0,
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}
const margin = { top: 20, right: 20, bottom: 50, left: 100 };
const graphWidth = 560 - margin.left - margin.right;
const graphHeight = 360 - margin.top - margin.bottom;

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", graphWidth + margin.left + margin.right)
  .attr("height", graphHeight + margin.top + margin.bottom);

const graph = svg
  .append("g")
  .attr("width", graphWidth)
  .attr("height", graphHeight)
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

//create scales
const x = d3.scaleTime().range([0, graphWidth]);
const y = d3.scaleLinear().range([graphHeight, 0]);

//create axes group
const xAxisGroup = graph
  .append("g")
  .attr("class", "x-axis")
  .attr("transform", "translate(0, " + graphHeight + ")");

const yAxisGroup = graph.append("g").attr("class", "y-axis");

//d3 path generator
const line = d3
  .line()
  .x(function(d) {
    return x(new Date(d.date));
  })
  .y(function(d) {
    return y(d.distance);
  });

//create line path element
const path = graph.append("path");

//create dotted line group
const dottedLines = graph
  .append("g")
  .attr("class", "lines")
  .style("opacity", 0);

//create x dotted line and append to dotted line group
const xDottedLine = dottedLines
  .append("line")
  .attr("stroke", "#aaa")
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", 4);

//create y dotted line and append to dotted line group
const yDottedLine = dottedLines
  .append("line")
  .attr("stroke", "#aaa")
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", 4);

const update = data => {
  data = data.filter(item => item.activity == activity);

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  //set scale domains
  x.domain(d3.extent(data, d => new Date(d.date)));
  y.domain([0, d3.max(data, d => d.distance)]);

  //update path data
  path
    .data([data])
    .attr("fill", "none")
    .attr("stroke", "#00bfa5")
    .attr("stroke-width", 2)
    .attr("d", line);

  //create circles for objects
  const circles = graph
    .selectAll("circle")
    .data(data)
    .attr("id", "circleBasicTooltip");

  //remove unwanted points
  circles.exit().remove();

  //update current points
  circles
    .attr("r", 4)
    .attr("cx", d => x(new Date(d.date)))
    .attr("cy", d => y(d.distance));

  //add new circles thr enter selection
  circles
    .enter()
    .append("circle")
    .attr("class", "graphPoints")
    .attr("r", 4)
    .attr("cx", d => x(new Date(d.date)))
    .attr("cy", d => y(d.distance))
    .attr("fill", "#ccc");

  //mouseover event
  graph
    .selectAll("circle")
    .on("mouseover", (d, i, n) => {
      var datex = new Date(d.date);
      var str = datex.toString();
      var z = str.split(" GMT")[0];
      var m = d.distance;
      var result = m + "m" + " , " + z;

      d3.select(n[i])
        .transition()
        .duration(100)
        .attr("r", 8)
        .attr("fill", "#fff");

      //set x dotted line coords (x1,x2,y1,y2)
      xDottedLine
        .attr("x1", x(new Date(d.date)))
        .attr("x2", x(new Date(d.date)))
        .attr("y1", graphHeight)
        .attr("y2", y(d.distance));

      //set y dotted line coords (x1,x2,y1,y2)
      yDottedLine
        .attr("x1", 0)
        .attr("x2", x(new Date(d.date)))
        .attr("y1", y(d.distance))
        .attr("y2", y(d.distance));

      //show the dotted line group (opacity)
      dottedLines.style("opacity", 1);

      // set the display box
      document.getElementById("demo").innerHTML = result;
    })
    .on("mouseleave", (d, i, n) => {
      d3.select(n[i])
        .transition()
        .duration(100)
        .attr("r", 4)
        .attr("fill", "#ccc");

      //hide the dotted line group (opacity)
      dottedLines.style("opacity", 0);

      // unset the display box
      document.getElementById("demo").innerHTML = "";
    });

  //create axes
  const xAxis = d3
    .axisBottom(x)
    .ticks(4)
    .tickFormat(d3.timeFormat("%b %d %I %I:%M %p"));

  const yAxis = d3
    .axisLeft(y)
    .ticks(7)
    .tickFormat(d => d + "m");

  //call axes
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  //rotate axis text
  xAxisGroup
    .selectAll("text")
    .attr("transform", "rotate(-10)")
    .attr("text-anchor", "end");
};

var data = [];
db.collection("activities").onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case "added":
        data.push(doc);
        break;
      case "modified":
        const index = data.findIndex(item => item.id == doc.id);
        data[index] = doc;
        break;
      case "removed":
        data = data.filter(item => item.id != doc.id);
        break;
      default:
        break;
    }
  });
  update(data);
});

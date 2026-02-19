class Histogram {
    
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            margin: {top: 40, bottom: 60, right: 30, left: 60},
            key: _config.key,
            xLabel: _config.xLabel, 
            yLabel: "Count of Countries",
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.parentElement = d3.select(vis.config.parentElement);

        vis.config.containerWidth = vis.parentElement.node().clientWidth;
        vis.config.containerHeight = vis.parentElement.node().clientHeight;

        if (vis.config.containerWidth <= 0) return;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = vis.parentElement.append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);
        
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxisGroup = vis.chart.append('g')
            .attr('class', 'axis x-axis') 
            .attr('transform', `translate(0, ${vis.height})`); // move x-axis to bottom of chart

        vis.yAxisGroup = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.config.containerWidth / 2)
            .attr("y", vis.config.containerHeight - 10) 
            .text(vis.config.xLabel);

        vis.svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("y", 20)
            .attr("x", - (vis.config.containerHeight / 2))
            .attr("transform", "rotate(-90)")
            .text(vis.config.yLabel);
        
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        const xValue = d => d[vis.config.key];
        vis.xScale.domain(d3.extent(vis.data, xValue)).nice();

        const histogramGenerator = d3.bin()
            .value(xValue)
            .domain(vis.xScale.domain());
        
        vis.bins = histogramGenerator(vis.data);

        vis.yScale.domain([0, d3.max(vis.bins, d => d.length)]);

        vis.xAxisGroup.call(d3.axisBottom(vis.xScale));
        vis.yAxisGroup.call(d3.axisLeft(vis.yScale));

        const bars = vis.chart.selectAll('.bar')
            .data(vis.bins);
        
        bars.enter().append('rect')
            .attr('class', 'bar')
            .merge(bars)
            .attr('x', d => vis.xScale(d.x0) + 1)
            .attr('width', d => Math.max(0, vis.xScale(d.x1) - vis.xScale(d.x0) - 1))
            .attr('y', d => vis.yScale(d.length))
            .attr('height', d => vis.height - vis.yScale(d.length))
            .attr('fill', '#69b3a2');

        bars.exit().remove();

    }
// delete and remake to resize as page resizes
    resize() {
        this.parentElement.selectAll("*").remove();
        this.initVis();
  }
}
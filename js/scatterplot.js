class Scatterplot {
        constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            margin: {top: 40, bottom: 60, right: 30, left: 60},
            xKey: _config.xKey,
            yKey: _config.yKey,
            xLabel: _config.xLabel, 
            yLabel: _config.yLabel,
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

        vis.xAxis = d3.axisBottom(vis.xScale)


        vis.yAxis = d3.axisLeft(vis.yScale)


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

        const xValue = d => d[vis.config.xKey];
        const yValue = d => d[vis.config.yKey];

        vis.xScale.domain(d3.extent(vis.data, xValue)).nice();
        vis.yScale.domain(d3.extent(vis.data, yValue)).nice();

        vis.xAxisGroup.call(vis.xAxis);
        vis.yAxisGroup.call(vis.yAxis);

    const circles = vis.chart.selectAll('.point')
            .data(vis.data);

        circles.enter().append('circle')
            .attr('class', 'point')
            .merge(circles)
            .attr('r', 4) 
            .attr('cx', d => vis.xScale(xValue(d)))
            .attr('cy', d => vis.yScale(yValue(d)))
            .attr('fill', '#69b3a2')
            .attr('fill-opacity', 0.6) 
            .attr('stroke', '#333');   

        circles.exit().remove();

    }

    resize() {
        this.parentElement.selectAll("*").remove();
        this.initVis();
  }
}
class Scatterplot {
        constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            margin: {top: 40, bottom: 60, right: 30, left: 60},
            xKey: _config.xKey,
            yKey: _config.yKey,
            xLabel: _config.xLabel, 
            yLabel: _config.yLabel,
            colorPalette: _config.colorPalette,
            colorDomain: _config.colorDomain,
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
        
        vis.xLabelText = vis.svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.config.containerWidth / 2)
            .attr("y", vis.config.containerHeight - 10);

        vis.yLabelText = vis.svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("y", 20)
            .attr("x", - (vis.config.containerHeight / 2))
            .attr("transform", "rotate(-90)")
            .text(vis.config.yLabel);

        vis.updateVis();
    }

    update(newData) {
        this.data = newData;
        this.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.xLabelText.text(vis.config.xLabel);
        vis.yLabelText.text(vis.config.yLabel);

        let filteredData = vis.data.filter(d => 
            d[vis.config.xKey] != null && !isNaN(d[vis.config.xKey]) &&
            d[vis.config.yKey] != null && !isNaN(d[vis.config.yKey])
        );

        const xValue = d => d[vis.config.xKey];
        const yValue = d => d[vis.config.yKey];

        vis.xScale.domain(d3.extent(filteredData, xValue)).nice();
        vis.yScale.domain(d3.extent(filteredData, yValue)).nice();

        vis.colorScale = d3.scaleLinear()
            .domain(vis.config.colorDomain)
            .range(vis.config.colorPalette);

        vis.xAxisGroup.transition().duration(500).call(vis.xAxis);
        vis.yAxisGroup.transition().duration(500).call(vis.yAxis);

    const circles = vis.chart.selectAll('.point')
            .data(filteredData, d => d.Code) 
            .join(
                enter => enter.append('circle')
                    .attr('class', 'point')
                    .attr('r', 0)
                    .attr('cx', d => vis.xScale(xValue(d)))
                    .attr('cy', d => vis.yScale(yValue(d)))
                    .attr('fill', d => vis.colorScale(yValue(d)))
                    .attr('fill-opacity', 0)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 0.5)
                    .attr('stroke-opacity', 0)
                    .call(enter => enter.transition().duration(500)
                        .attr('r', 4) 
                        .attr('fill-opacity', 0.6)
                        .attr('stroke-opacity', 1) 
                    ),
                update => update
                    .call(update => update.transition().duration(500)
                        .attr('cx', d => vis.xScale(xValue(d)))
                        .attr('cy', d => vis.yScale(yValue(d)))
                        .attr('fill', d => vis.colorScale(yValue(d)))
                        .attr('r', 4) 
                        .attr('fill-opacity', 0.6)
                        .attr('stroke-opacity', 1) 
                    ),
                exit => exit
                    .call(exit => exit.transition().duration(500)
                        .attr('r', 0) 
                        .attr('fill-opacity', 0) 
                        .attr('stroke-opacity', 0)
                        .remove()
                    )
            );
    
    circles
        .on('mouseover', function(event, d) {
        d3.select('#tooltip').transition().duration(200).style('opacity', 0.95);
        d3.select('#tooltip').html(`
            <strong style="font-size: 14px;">${d.Entity}</strong><br/>
            <strong>${vis.config.xLabel}:</strong> ${d[vis.config.xKey]}<br/>
            <strong>${vis.config.yLabel}:</strong> ${d[vis.config.yKey]}
        `)
        positionTooltip(event);
        
        d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
    })
    .on('mousemove', function(event) {
        positionTooltip(event);
    })
    .on('mouseleave', function() {
        d3.select('#tooltip').transition().duration(500).style('opacity', 0);
        d3.select(this).attr('stroke', '#333').attr('stroke-width', 1); 
    });
    }

    resize() {
        this.parentElement.selectAll("*").remove();
        this.initVis();
  }
}
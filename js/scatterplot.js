class Scatterplot {
        constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            margin: {top: 40, bottom: 60, right: 30, left: 70},
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

        // set up dimensions
        vis.parentElement = d3.select(vis.config.parentElement);

        vis.config.containerWidth = vis.parentElement.node().clientWidth;
        vis.config.containerHeight = vis.parentElement.node().clientHeight;

        if (vis.config.containerWidth <= 0) return;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // create svg
        vis.svg = vis.parentElement.append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        
        // initialize scales and axes
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
        
        // add axis labels
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

        
        vis.brushGroup = vis.chart.append("g").attr("class", "brush");

        // initialize brush
        vis.brush = d3.brush()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", function(event) {
                // clear brush if empty space is clicked
                if (!event.selection) {
                    if (event.sourceEvent) setGlobalSelection([]);
                    return;
                }
                
                // calculate which points (countries) fall in brushed area
                const [[x0, y0], [x1, y1]] = event.selection;
                const selectedCodes = vis.filteredData
                    .filter(d => {
                        const xPos = vis.xScale(d[vis.config.xKey]);
                        const yPos = vis.yScale(d[vis.config.yKey]);
                        return xPos >= x0 && xPos <= x1 && yPos >= y0 && yPos <= y1;
                    })
                    .map(d => d.Code);
                    
                setGlobalSelection(selectedCodes); // send selected countries to main.js
            });
        
        vis.updateVis();
    }

    // helper function for updating charts after user input
    update(newData) {
        this.data = newData;
        this.updateVis();
    }

    updateVis() {
        let vis = this;

        // chart labels
        vis.xLabelText.text(vis.config.xLabel);
        vis.yLabelText.text(vis.config.yLabel);

        // only show points with values for both data attributes (no null/NaN values)
        vis.filteredData = vis.data.filter(d => 
            d[vis.config.xKey] != null && !isNaN(d[vis.config.xKey]) &&
            d[vis.config.yKey] != null && !isNaN(d[vis.config.yKey])
        );

        // set data attributes
        const xValue = d => d[vis.config.xKey];
        const yValue = d => d[vis.config.yKey];

        // set scale domains
        vis.xScale.domain(d3.extent(vis.filteredData, xValue)).nice();
        vis.yScale.domain(d3.extent(vis.filteredData, yValue)).nice();

        // update brush
        vis.brushGroup.call(vis.brush);

        // initialize color palette
        vis.colorScale = d3.scaleLinear()
            .domain(vis.config.colorDomain)
            .range(vis.config.colorPalette);

        // animate axes changing
        vis.xAxisGroup.transition().duration(500).call(vis.xAxis);
        vis.yAxisGroup.transition().duration(500).call(vis.yAxis);

    // add points
    const circles = vis.chart.selectAll('.point')
            .data(vis.filteredData, d => d.Code) 
            .join(
                enter => enter.append('circle')
                    .attr('class', 'point')
                    .attr('r', 0)
                    .attr('cx', d => vis.xScale(xValue(d)))
                    .attr('cy', d => vis.yScale(yValue(d)))
                    .attr('fill', d => vis.colorScale(yValue(d))) // color points based on y value
                    .attr('fill-opacity', 0)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 0.5)
                    .attr('stroke-opacity', 0)
                    .call(enter => enter.transition().duration(500) // animate point creation
                        .attr('r', 4) 
                        .attr('fill-opacity', 0.6)
                        .attr('stroke-opacity', 1) 
                    ),
                update => update
                    .call(update => update.transition().duration(500) // animate point update
                        .attr('cx', d => vis.xScale(xValue(d)))
                        .attr('cy', d => vis.yScale(yValue(d)))
                        .attr('fill', d => vis.colorScale(yValue(d))) // color points based on y value
                        .attr('r', 4) 
                        .attr('fill-opacity', 0.6)
                        .attr('stroke-opacity', 1) 
                    ),
                exit => exit
                    .call(exit => exit.transition().duration(500) // animate point removal
                        .attr('r', 0) 
                        .attr('fill-opacity', 0) 
                        .attr('stroke-opacity', 0)
                        .remove()
                    )
            );
    
    circles
        // tooltip event listeners
        .on('mouseover', function(event, d) {
        d3.select('#tooltip').transition().duration(200).style('opacity', 0.95);
        // show country, health factor value, and social factor value in tooltip
        d3.select('#tooltip').html(`
            <strong style="font-size: 14px;">${d.Entity}</strong><br/>
            <strong>${vis.config.xLabel}:</strong> ${d[vis.config.xKey]}<br/>
            <strong>${vis.config.yLabel}:</strong> ${d[vis.config.yKey]}
        `)
        positionTooltip(event); // call global function to set tooltip position
        d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
    })
    .on('mousemove', function(event) {
        positionTooltip(event); // call global function to set tooltip position
    })
    .on('mouseleave', function() {
        d3.select('#tooltip').transition().duration(500).style('opacity', 0);
        d3.select(this).attr('stroke', '#333').attr('stroke-width', 0.5);
    });
    }

    // helper function to delete and resize as page is resized
    resize() {
        this.parentElement.selectAll("*").remove();
        this.initVis();
  }

  // helper function to highlight brushed selections
  highlight(selectedCodes) {
        let vis = this;
        if (!selectedCodes || selectedCodes.length === 0) {
            // reset all points to default
            vis.chart.selectAll('.point')
                .attr('fill-opacity', 0.6)
                .attr('stroke-opacity', 1);

            if (vis.brushGroup) vis.brushGroup.call(vis.brush.move, null); // clears gray brush box
        } else {
            // dim unselected circles
            vis.chart.selectAll('.point')
                .attr('fill-opacity', d => selectedCodes.includes(d.Code) ? 0.9 : 0.05)
                .attr('stroke-opacity', d => selectedCodes.includes(d.Code) ? 1 : 0.05)
        }
    }
}
class Histogram {
    
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            margin: {top: 40, bottom: 60, right: 30, left: 60},
            key: _config.key,
            xLabel: _config.xLabel, 
            color: _config.color || '#5EAAA8',
            yLabel: "Count of Countries",
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
        
            vis.updateVis();
    }

    // helper function for updating charts after user input
    update(newData) {
        this.data = newData;
        this.updateVis();
    }

    updateVis() {
        let vis = this;

        // chart label
        vis.xLabelText.text(vis.config.xLabel);

        // filter out null values
        vis.filteredData = vis.data.filter(d => 
            d[vis.config.key] != null && !isNaN(d[vis.config.key])
        );

        // set data attribute and scale domain
        const xValue = d => d[vis.config.key];
        vis.xScale.domain(d3.extent(vis.filteredData, xValue)).nice();

        // setup d3 bin generator
        const histogramGenerator = d3.bin()
            .value(xValue)
            .domain(vis.xScale.domain())
            .thresholds(10);
        
        // generate bins
        vis.bins = histogramGenerator(vis.filteredData);

        // set y scale domain
        vis.yScale.domain([0, d3.max(vis.bins, d => d.length)]);

        // animate axes changing
        vis.xAxisGroup.transition().duration(500).call(d3.axisBottom(vis.xScale));
        vis.yAxisGroup.transition().duration(500).call(d3.axisLeft(vis.yScale));

        // add bars
        vis.bars = vis.chart.selectAll('.bar')
            .data(vis.bins)
            .join(
            enter => enter.append('rect')
                .attr('class', 'bar')
                // add 1 to x and subtract 1 from width to create small gaps between bars
                .attr('x', d => vis.xScale(d.x0) + 1)
                .attr('width', d => Math.max(0, vis.xScale(d.x1) - vis.xScale(d.x0) - 1))
                .attr('y', vis.height) 
                .attr('height', 0)
                .attr('fill', vis.config.color)
                .call(enter => enter.transition().duration(500) // animate bar creation
                    .attr('y', d => vis.yScale(d.length))
                    .attr('height', d => vis.height - vis.yScale(d.length))
                ),
            update => update
                .call(update => update.transition().duration(500) // animate bar update
                    .attr('x', d => vis.xScale(d.x0) + 1)
                    .attr('width', d => Math.max(0, vis.xScale(d.x1) - vis.xScale(d.x0) - 1))
                    .attr('y', d => vis.yScale(d.length))
                    .attr('height', d => vis.height - vis.yScale(d.length))
                    .attr('fill', vis.config.color) 
                ),
            exit => exit
                .call(exit => exit.transition().duration(500) // animate bar removal
                    .attr('y', vis.height)
                    .attr('height', 0)
                    .remove()
                )
            );
        
        vis.bars
            // interaction and tooltip listeners
            .on('click', function(event, d) {
                let binCodes = d.map(item => item.Code); // when bin is clicked, add iso code to binCodes
                toggleGlobalSelection(binCodes); // send selected countries to global function to update all other visualizations
            })
            .on('mouseover', function(event,d) {
                // create list of countries in bin
                let countryList = d.map(item => item.Entity).join(', ');
                d3.select('#tooltip').transition().duration(200).style('opacity', 0.95);
                // show bin range, count of countries, and list of countries in tooltip
                d3.select('#tooltip').html(`
                    <strong>Bin Range:</strong> ${d.x0} - ${d.x1}<br/>
                    <strong>Count:</strong> ${d.length} countries<br/>
                    <div style="max-width: 250px; font-size: 11px; margin-top: 5px; color: #666;">
                        ${countryList || 'None'}
                    </div>
                `)
                positionTooltip(event); // call global function to set tooltip position
                
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 2); 
            })
            .on('mousemove', function(event) {
                positionTooltip(event); // call global function to set tooltip position
            })
            .on('mouseleave', function() {
                d3.select('#tooltip').transition().duration(500).style('opacity', 0);
                // if bin doesn't contain any selected countries, remove highlight/border
                const hasSelected = activeSelectedCodes.length > 0 && d.some(item => activeSelectedCodes.includes(item.Code));
                if (!hasSelected) {
                    d3.select(this).attr('stroke', 'none');
                }
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
            // reset everything to default
            vis.bars.attr('opacity', 1).attr('stroke', 'none');
        } else {
            // dim unselected, highlight selected
            vis.bars.attr('opacity', d => {
                const hasSelected = d.some(item => selectedCodes.includes(item.Code));
                return hasSelected ? 1 : 0.2;
            })
            // add border to highlighted bins
            .attr('stroke', d => {
                const hasSelected = d.some(item => selectedCodes.includes(item.Code));
                return hasSelected ? '#333' : 'none';
            })
            .attr('stroke-width', 2);
        }
    }
}
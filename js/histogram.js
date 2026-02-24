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

        const xValue = d => d[vis.config.key];
        vis.xScale.domain(d3.extent(vis.data, xValue)).nice();

        const histogramGenerator = d3.bin()
            .value(xValue)
            .domain(vis.xScale.domain())
            .thresholds(10);
        
        vis.bins = histogramGenerator(vis.data);

        vis.yScale.domain([0, d3.max(vis.bins, d => d.length)]);

        vis.xAxisGroup.transition().duration(500).call(d3.axisBottom(vis.xScale));
        vis.yAxisGroup.transition().duration(500).call(d3.axisLeft(vis.yScale));

        const bars = vis.chart.selectAll('.bar')
            .data(vis.bins)
            .join(
            enter => enter.append('rect')
                .attr('class', 'bar')
                .attr('x', d => vis.xScale(d.x0) + 1)
                .attr('width', d => Math.max(0, vis.xScale(d.x1) - vis.xScale(d.x0) - 1))
                .attr('y', vis.height) 
                .attr('height', 0)
                .attr('fill', vis.config.color)
                .call(enter => enter.transition().duration(500)
                    .attr('y', d => vis.yScale(d.length))
                    .attr('height', d => vis.height - vis.yScale(d.length))
                ),
            update => update
                .call(update => update.transition().duration(500)
                    .attr('x', d => vis.xScale(d.x0) + 1)
                    .attr('width', d => Math.max(0, vis.xScale(d.x1) - vis.xScale(d.x0) - 1))
                    .attr('y', d => vis.yScale(d.length))
                    .attr('height', d => vis.height - vis.yScale(d.length))
                    .attr('fill', vis.config.color) 
                ),
            exit => exit
                .call(exit => exit.transition().duration(500)
                    .attr('y', vis.height)
                    .attr('height', 0)
                    .remove()
                )
            );
        
        bars
            .on('mouseover', function(event,d) {
                let countryList = d.map(item => item.Entity).join(', ');
                d3.select('#tooltip').transition().duration(200).style('opacity', 0.95);
                d3.select('#tooltip').html(`
                    <strong>Bin Range:</strong> ${d.x0} - ${d.x1}<br/>
                    <strong>Count:</strong> ${d.length} countries<br/>
                    <div style="max-width: 250px; font-size: 11px; margin-top: 5px; color: #666;">
                        ${countryList || 'None'}
                    </div>
                `)
                positionTooltip(event);
                
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 2); 
            })
            .on('mousemove', function(event) {
                positionTooltip(event);
            })
            .on('mouseleave', function() {
                d3.select('#tooltip').transition().duration(500).style('opacity', 0);
                d3.select(this).attr('stroke', 'none');
            });
    }
// delete and remake to resize as page resizes
    resize() {
        this.parentElement.selectAll("*").remove();
        this.initVis();
  }
}
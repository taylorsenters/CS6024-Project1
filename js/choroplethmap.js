class ChoroplethMap {
    constructor(_config, _geoData, _data) {
        this.config = {
            parentElement: _config.parentElement,
            margin: {top: 40, bottom: 40, right: 20, left: 20},
            key: _config.key,
            title: _config.title,
            colorPalette: _config.colorPalette,
            colorDomain: _config.colorDomain,
            tooltipPadding: 15,
            legendBottom: 20,
            legendLeft: 20,
            legendRectHeight: 12, 
            legendRectWidth: 150
        }
        this.geoData = _geoData; 
        this.data = _data;      
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.parentElement = d3.select(vis.config.parentElement);

        vis.config.containerWidth = vis.parentElement.node().clientWidth;
        vis.config.containerHeight = vis.parentElement.node().clientHeight;

        let bounds = vis.parentElement.node().getBoundingClientRect();
        vis.config.containerWidth = bounds.width || 500;
        vis.config.containerHeight = bounds.height || 400;

        vis.width = Math.max(1, vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right);
        vis.height = Math.max(1, vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom);

        vis.svg = vis.parentElement.append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.projection = d3.geoNaturalEarth1();
        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.countries = vis.geoData.features;
        vis.projection.fitSize([vis.width, vis.height], vis.geoData);

        vis.titleText = vis.svg.append("text")
            .attr("class", "map-title")
            .attr("text-anchor", "middle")
            .attr("x", vis.config.containerWidth / 2)
            .attr("y", 20)
            .style("font-weight", "600")
            .style("fill", "#2c3e50");

        let defs = vis.svg.append('defs');

        vis.patternId = 'no-data-pattern-' + vis.config.parentElement.replace('#', '');

        let pattern = defs.append('pattern')
            .attr('id', this.patternId)
            .attr('width', 8)
            .attr('height', 8)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate(45)');
        pattern.append('rect').attr('width', 4).attr('height', 8).attr('fill', '#e0e0e0');
        pattern.append('rect').attr('x', 4).attr('width', 4).attr('height', 8).attr('fill', '#f4f7f6');

        vis.gradientId = `map-gradient-${vis.config.parentElement.replace('#','')}`;
        vis.linearGradient = defs.append('linearGradient').attr("id", vis.gradientId);

        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendLeft},${vis.height + vis.config.margin.top - vis.config.legendBottom})`);
        
        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight)
            .attr('stroke', '#ccc');

        vis.countryPaths = vis.chart.selectAll('.country')
            .data(vis.countries)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5);
        
        vis.updateVis();
        
    }

    update(newData) {
        this.data = newData;
        this.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.titleText.text(vis.config.title);

        vis.dataMap = new Map();
        vis.data.forEach(d => {
            vis.dataMap.set(d.Code, d); 
        });

        vis.colorScale = d3.scaleLinear()
            .domain(vis.config.colorDomain)
            .range(vis.config.colorPalette);

        vis.legendStops = vis.config.colorPalette.map((color, index) => ({
            color: color,
            offset: (index / (vis.config.colorPalette.length - 1)) * 100
        }));

        vis.countryPaths
            .transition().duration(500)
            .attr('fill', d => {
                let isoCode = d.id; 
                let row = vis.dataMap.get(isoCode);
                
                if (row !== undefined && row[vis.config.key] != null && !isNaN(row[vis.config.key])) {
                    return vis.colorScale(row[vis.config.key]);
                } else {
                    return `url(#${vis.patternId})`;
                }
            });
        
        vis.countryPaths
            .on('mouseover', function(event, d) {
                let isoCode = d.id;
                let row = vis.dataMap.get(isoCode);
                
                // Get the current global selections to know what labels/columns to show
                const currentSocial = document.getElementById('social-factor-select').value;
                const currentHealth = document.getElementById('health-factor-select').value;
                const socialConf = metricConfig[currentSocial];
                const healthConf = metricConfig[currentHealth];

                // Attempt to get country name from GeoJSON, fallback to CSV Entity
                let countryName = (d.properties && d.properties.name) ? d.properties.name : (row ? row.Entity : isoCode);
                
                let tooltipHtml = `<strong style="font-size: 14px;">${countryName}</strong><br/>`;
                
                if (row) {
                    let sVal = row[socialConf.column] !== null ? row[socialConf.column] : "No data";
                    let hVal = row[healthConf.column] !== null ? row[healthConf.column] : "No data";
                    tooltipHtml += `<strong>${socialConf.title}:</strong> ${sVal}<br/>`;
                    tooltipHtml += `<strong>${healthConf.title}:</strong> ${hVal}`;
                } else {
                    tooltipHtml += `<em>No data available</em>`;
                }

                d3.select('#tooltip').transition().duration(200).style('opacity', 0.95);
                d3.select('#tooltip').html(tooltipHtml)
                    positionTooltip(event);
                    
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
            })
            .on('mousemove', function(event) {
                positionTooltip(event);
            })
            .on('mouseleave', function() {
                d3.select('#tooltip').transition().duration(500).style('opacity', 0);
                d3.select(this).attr('stroke', '#ffffff').attr('stroke-width', 0.5);
            });

        vis.linearGradient.selectAll('stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset + '%')
            .attr('stop-color', d => d.color);

        vis.legendRect.attr('fill', `url(#${vis.gradientId})`);

        const legendLabels = [
            { text: vis.config.colorDomain[0], offset: 0, anchor: 'start' },
            { text: vis.config.colorDomain[vis.config.colorDomain.length - 1], offset: vis.config.legendRectWidth, anchor: 'end' }
        ];

        vis.legend.selectAll('.legend-label')
            .data(legendLabels)
            .join('text')
            .attr('class', 'legend-label')
            .attr('text-anchor', d => d.anchor)
            .attr('dy', '.35em')
            .attr('y', 20)
            .attr('x', d => d.offset)
            .style('font-size', '11px')
            .style('fill', '#5D6D7E')
            .text(d => d.text);
    }

    resize() {
        this.parentElement.selectAll("*").remove();
        this.initVis();
    }
}
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
        this.geoData = _geoData; // world.geojson borders
        this.data = _data;      
        this.initVis();
    }

    initVis() {
        let vis = this;

        // set up dimensions
        vis.parentElement = d3.select(vis.config.parentElement);

        vis.config.containerWidth = vis.parentElement.node().clientWidth;
        vis.config.containerHeight = vis.parentElement.node().clientHeight;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // create svg
        vis.svg = vis.parentElement.append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // initialize projection and path generator
        vis.projection = d3.geoNaturalEarth1();
        vis.geoPath = d3.geoPath().projection(vis.projection);

        // extract list of countries from geojson
        vis.countries = vis.geoData.features;

        // scale map to fit inside svg
        vis.projection.fitSize([vis.width, vis.height], vis.geoData);

        // add map title
        vis.titleText = vis.svg.append("text")
            .attr("class", "map-title")
            .attr("text-anchor", "middle")
            .attr("x", vis.config.containerWidth / 2)
            .attr("y", 20)
            .style("font-weight", "600")
            .style("fill", "#2c3e50");

        // initialize svg definitions
        let defs = vis.svg.append('defs');

        // create unique id for map
        vis.patternId = 'no-data-pattern-' + vis.config.parentElement.replace('#', '');

        // create diagonal grey stripes pattern for countries with no data
        let pattern = defs.append('pattern')
            .attr('id', this.patternId)
            .attr('width', 8)
            .attr('height', 8)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate(45)');
        pattern.append('rect').attr('width', 4).attr('height', 8).attr('fill', '#e0e0e0');
        pattern.append('rect').attr('x', 4).attr('width', 4).attr('height', 8).attr('fill', '#f4f7f6');

        // setup gradient for legend
        vis.gradientId = `map-gradient-${vis.config.parentElement.replace('#','')}`;
        vis.linearGradient = defs.append('linearGradient').attr("id", vis.gradientId);

        // create legend
        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendLeft},${vis.height + vis.config.margin.top - vis.config.legendBottom})`);
        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight)
            .attr('stroke', '#ccc');

        // draw base map
        vis.countryPaths = vis.chart.selectAll('.country')
            .data(vis.countries)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5);
        
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
        vis.titleText.text(vis.config.title);

        // create data lookup map where the key is the country code, and the value is the entire row of data.
        vis.dataMap = new Map();
        vis.data.forEach(d => {
            vis.dataMap.set(d.Code, d); 
        });

        // set color scale
        vis.colorScale = d3.scaleLinear()
            .domain(vis.config.colorDomain)
            .range(vis.config.colorPalette);

        // calculate color stops for legend
        vis.legendStops = vis.config.colorPalette.map((color, index) => ({
            color: color,
            offset: (index / (vis.config.colorPalette.length - 1)) * 100
        }));

        // set color stops for color gradient
        vis.linearGradient.selectAll('stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset + '%')
            .attr('stop-color', d => d.color);

        // apply color gradient to legend
        vis.legendRect.attr('fill', `url(#${vis.gradientId})`);

        // update legend labels
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
        
        // update country colors
        vis.countryPaths
            .transition().duration(500)
            .attr('fill', d => {
                // look up country's data based on code
                let isoCode = d.id; 
                let row = vis.dataMap.get(isoCode);
                
                // if country exists and has valid data, fill with data color
                if (row !== undefined && row[vis.config.key] != null && !isNaN(row[vis.config.key])) {
                    return vis.colorScale(row[vis.config.key]);
                } else {
                    // else, fill with missing/no data pattern
                    return `url(#${vis.patternId})`;
                }
            });
        
        // interaction and tooltip listeners
        vis.countryPaths
            .on('click', function(event, d) {
                toggleGlobalSelection([d.id]);  // when clicked send selected countries to global function to update all other visualizations
            })
            .on('mouseover', function(event, d) {
                let isoCode = d.id;
                let row = vis.dataMap.get(isoCode);
                
                // get the current global selections to know what labels/columns to show
                const currentSocial = document.getElementById('social-factor-select').value;
                const currentHealth = document.getElementById('health-factor-select').value;
                const socialConf = metricConfig[currentSocial];
                const healthConf = metricConfig[currentHealth];

                // attempt to get country name from GeoJSON, fallback to CSV Entity
                let countryName = (d.properties && d.properties.name) ? d.properties.name : (row ? row.Entity : isoCode);
                
                // show country, health factor value, and social factor value in tooltip
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
                    positionTooltip(event); // call global function to set tooltip position
                
                // highlight hovered country border
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
            })
            .on('mousemove', function(event) {
                positionTooltip(event); // call global function to set tooltip position
            })
            .on('mouseleave', function(event, d) {
                d3.select('#tooltip').transition().duration(500).style('opacity', 0);
                // if country not selected, remove highlight/border
                const isSelected = activeSelectedCodes && activeSelectedCodes.includes(d.id);
                if (!isSelected) {
                    d3.select(this).attr('stroke', '#ffffff').attr('stroke-width', 0.5);
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
            // reset to default
            vis.countryPaths
                .attr('opacity', 1)
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 0.5);
        } else {
            // dim unselected, highlight selected
            vis.countryPaths
                .attr('opacity', d => selectedCodes.includes(d.id) ? 1 : 0.2)
                .attr('stroke', d => selectedCodes.includes(d.id) ? '#333' : '#ffffff')
                .attr('stroke-width', d => selectedCodes.includes(d.id) ? 1.5 : 0.5);
        }
    }
}
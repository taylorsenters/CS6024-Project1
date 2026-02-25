
// define color schemes
// empowerment (teal) is used for positve factors
// risk (orange) is used for negative factors
const empowermentColors = ["#E4F1F1", "#A3D2CA", "#5EAAA8", "#056676", "#022B3A"];
const riskColors = ["#FDF2E9", "#F5CBA7", "#EB984E", "#CA6F1E", "#873600"];

// configuration object to map user selections to corrent data, titles, colors, etc
const metricConfig = {
    // social factors
    "schooling": {
        column: "Average years of schooling (Women)",
        title: "Average Years of Schooling (Women)",
        palette: empowermentColors,
        domain: [0, 4, 8, 12, 16] 
    },
    "birth": {
        column: "Adolescent birth rate",
        title: "Adolescent Birth Rate (per 1k)",
        palette:riskColors,
        domain: [0, 50, 100, 150, 200]
    },
    "tertiary-education": {
        column: "TertiaryEducation",
        title: "Women in Tertiary Education (%)",
        palette: empowermentColors,
        domain: [0, 30, 60, 90, 120]
    },
    
    // health factors
    "mortality": {
        column: "Maternal mortality ratio",
        title: "Maternal Mortality Ratio (per 100k births)",
        palette: riskColors,
        domain: [0, 50, 200, 500, 1000] 
    },
    "antenatal": {
        column: "Antenatal care coverage - at least four visits (%)",
        title: "Antenatal Care: 4+ Visits (%)",
        palette: empowermentColors, 
        domain: [20, 40, 60, 80, 100] 
    },
    "anemia": {
        column: "Prevalence of anemia among women of reproductive age (% of women ages 15-49)",
        title: "Anemia Prevalence in Women (%)",
        palette: riskColors, 
        domain: [10, 25, 40, 55, 70]
    }
};

// global variables for use throughout all files
let globalData = []; // holds parsed csv data
let socialChart, healthChart, socialMap, healthMap, scatter; // class instances
let activeSelectedCodes = []; // array holding all countries codes of currently selected countries

// tooltip for all charts
const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip");

// helper function to calculate tooltip position
function positionTooltip(event) {
    let tooltip = d3.select('#tooltip');
    let tooltipNode = tooltip.node();
    
    // get the rendered width and height of the tooltip
    let tooltipWidth = tooltipNode.offsetWidth;
    let tooltipHeight = tooltipNode.offsetHeight;
    
    // default positions (bottom right of cursor)
    let x = event.pageX + 15;
    let y = event.pageY - 28;
    
    // check right boundary: if tooltip goes off the right edge, flip it to the left
    if (x + tooltipWidth > window.innerWidth) {
        x = event.pageX - tooltipWidth - 15;
    }
    
    // check bottom boundary: if tooltip goes off the bottom, flip it above the cursor
    if (y + tooltipHeight > window.innerHeight + window.scrollY) {
        y = event.pageY - tooltipHeight - 15;
    }
    
    // apply the checked coordinates
    tooltip
        .style('left', x + 'px')
        .style('top', y + 'px');
}

// helper function for maps and histograms to allow for clicking and selecting countries to highlight/filter linked charts
function toggleGlobalSelection(newCodes) {

    // if array is empty, reset selections
    if (!newCodes || newCodes.length === 0) {
        activeSelectedCodes = [];
    } else {
        // check if clicked country is already selected
        let isAlreadySelected = newCodes.length > 0 && activeSelectedCodes.includes(newCodes[0]);

        // if already selected, remove from array to unselect
        if (isAlreadySelected) {
            activeSelectedCodes = activeSelectedCodes.filter(code => !newCodes.includes(code));
        } else {
            // if not already selected, add to array to select
            activeSelectedCodes = [...activeSelectedCodes, ...newCodes];
        }
    }

    // enable/disable clear button based on if any countries are currently selected
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.disabled = (activeSelectedCodes.length === 0);
    }

    // call highlight helper functions for each chart to update their highlights/borders
    if (socialChart) socialChart.highlight(activeSelectedCodes);
    if (healthChart) healthChart.highlight(activeSelectedCodes);
    if (scatter) scatter.highlight(activeSelectedCodes);
    if (socialMap) socialMap.highlight(activeSelectedCodes);
    if (healthMap) healthMap.highlight(activeSelectedCodes);
}

// helper function used by scatterplot to allow for brushing and updating linked charts
function setGlobalSelection(newCodes) {
    // set selected countries
    activeSelectedCodes = newCodes; // brushing in scatterplot will reset any previous selections on maps/histograms

    // enable/disable clear button based on if any countries are currently selected
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.disabled = (activeSelectedCodes.length === 0);

    // call highlight helper functions for each chart to update their highlights/borders
    if (socialChart) socialChart.highlight(activeSelectedCodes);
    if (healthChart) healthChart.highlight(activeSelectedCodes);
    if (scatter) scatter.highlight(activeSelectedCodes);
    if (socialMap) socialMap.highlight(activeSelectedCodes);
    if (healthMap) healthMap.highlight(activeSelectedCodes);
}

Promise.all([
    // load in data files
    d3.csv('data/combined_womens_health_data_cleaned.csv'),
    d3.json('data/world.geojson')])
    .then(([data, geoData]) => {
        data.forEach(d => {
            d.Year = +d.Year;
            // loop through config object to get only the data we need from the csv
            for (let key in metricConfig) {
                let colName = metricConfig[key].column;
                if (d[colName] === "" || d[colName] === null) {
                    d[colName] = null;
                } else {
                    d[colName] = +d[colName];
                }
            }
        });

    // save imported, cleaned data to global variable
    globalData = data;

    // check initial ui selections from html and set configurations accordingly
    const currentSocial = document.getElementById('social-factor-select').value;
    const currentHealth = document.getElementById('health-factor-select').value;
    const currentYear = +document.getElementById('year-slider').value;

    const socialConf = metricConfig[currentSocial];
    const healthConf = metricConfig[currentHealth];

    // filter data for current year selected
    const yearData = globalData.filter(d => d.Year === currentYear);

    // create new instances of the charts, passing in the config and data
    socialChart = new Histogram({
        parentElement: '#histogram-1',
        key: socialConf.column,
        xLabel: socialConf.title,
        color: socialConf.palette[3]
    }, yearData);

    healthChart = new Histogram({
        parentElement: '#histogram-2',
        key: healthConf.column,
        xLabel: healthConf.title,
        color: healthConf.palette[3]
    }, yearData);

    scatter = new Scatterplot({
        parentElement: '#scatter-plot',
        xKey: socialConf.column,
        yKey: healthConf.column,
        xLabel: socialConf.title,
        yLabel: healthConf.title,
        colorPalette: healthConf.palette,
        colorDomain: healthConf.domain
    }, yearData);

    socialMap = new ChoroplethMap({
        parentElement: '#map-1',
        key: socialConf.column,
        title: socialConf.title,
        colorPalette: socialConf.palette,
        colorDomain: socialConf.domain
    }, geoData, yearData);

    healthMap = new ChoroplethMap({
        parentElement: '#map-2',
        key: healthConf.column,
        title: healthConf.title,
        colorPalette: healthConf.palette,
        colorDomain: healthConf.domain
    }, geoData, yearData);

    // watch html divs and trigger resize if page is resized
    const resizeObserver = new ResizeObserver(entries => {
        window.requestAnimationFrame(() => {
            socialChart.resize();
            healthChart.resize();
            socialMap.resize();
            healthMap.resize();
            scatter.resize();
        });
    });

    // specify which divs to watch
    resizeObserver.observe(document.querySelector('#histogram-1'));
    resizeObserver.observe(document.querySelector('#histogram-2'));
    resizeObserver.observe(document.querySelector('#scatter-plot'));
    resizeObserver.observe(document.querySelector('#map-1'));
    resizeObserver.observe(document.querySelector('#map-2'));

    // clear button to clear selections/brushing
    document.getElementById('clear-btn').addEventListener('click', function() {
        toggleGlobalSelection([]); 
    });

    // data selection menus and year slider
    d3.selectAll('#social-factor-select, #health-factor-select, #year-slider').on('change input', function() {
        if (this.id === 'year-slider') {
            d3.select('#year-display').text(this.value); 
        }
        updateAllCharts(); // trigger update function
    });
})

// global update function called anytime selection menus or year slider are changed
function updateAllCharts() {

    // clear highlights
    toggleGlobalSelection([]);

    // get new selected values from ui
    const currentSocial = document.getElementById('social-factor-select').value;
    const currentHealth = document.getElementById('health-factor-select').value;
    const currentYear = +document.getElementById('year-slider').value;

    const socialConf = metricConfig[currentSocial];
    const healthConf = metricConfig[currentHealth];

    // filter data for updated year
    const yearData = globalData.filter(d => d.Year === currentYear);

    // update config objects in each chart with new info
    socialChart.config.key = socialConf.column;
    socialChart.config.xLabel = socialConf.title;
    socialChart.config.color = socialConf.palette[3];

    healthChart.config.key = healthConf.column;
    healthChart.config.xLabel = healthConf.title;
    healthChart.config.color = healthConf.palette[3];

    scatter.config.xKey = socialConf.column;
    scatter.config.yKey = healthConf.column;
    scatter.config.xLabel = socialConf.title;
    scatter.config.yLabel = healthConf.title;
    scatter.config.colorPalette = healthConf.palette;
    scatter.config.colorDomain = healthConf.domain;

    socialMap.config.key = socialConf.column;
    socialMap.config.title = socialConf.title;
    socialMap.config.colorPalette = socialConf.palette;
    socialMap.config.colorDomain = socialConf.domain;

    healthMap.config.key = healthConf.column;
    healthMap.config.title = healthConf.title;
    healthMap.config.colorPalette = healthConf.palette;
    healthMap.config.colorDomain = healthConf.domain;

    // call update helper function for each chart
    socialChart.update(yearData);
    healthChart.update(yearData);
    scatter.update(yearData);
    socialMap.update(yearData);
    healthMap.update(yearData);
}

const empowermentColors = ["#E4F1F1", "#A3D2CA", "#5EAAA8", "#056676", "#022B3A"];
const riskColors = ["#FDF2E9", "#F5CBA7", "#EB984E", "#CA6F1E", "#873600"];

const metricConfig = {
    // SOCIAL FACTORS
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
    
    // HEALTH OUTCOMES
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

let globalData = [];
let socialChart, healthChart, socialMap, healthMap, scatter;

const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip");

function positionTooltip(event) {
    let tooltip = d3.select('#tooltip');
    let tooltipNode = tooltip.node();
    
    // Get the rendered width and height of the tooltip
    let tooltipWidth = tooltipNode.offsetWidth;
    let tooltipHeight = tooltipNode.offsetHeight;
    
    // Default positions (bottom right of cursor)
    let x = event.pageX + 15;
    let y = event.pageY - 28;
    
    // Check right boundary: If tooltip goes off the right edge, flip it to the left
    if (x + tooltipWidth > window.innerWidth) {
        x = event.pageX - tooltipWidth - 15;
    }
    
    // Check bottom boundary: If tooltip goes off the bottom, flip it above the cursor
    if (y + tooltipHeight > window.innerHeight + window.scrollY) {
        y = event.pageY - tooltipHeight - 15;
    }
    
    // Apply the checked coordinates
    tooltip
        .style('left', x + 'px')
        .style('top', y + 'px');
}

Promise.all([
    d3.csv('data/combined_womens_health_data_cleaned.csv'),
    d3.json('data/world.geojson')
]).then(([data, geoData]) => {
    data.forEach(d => {
        d.Year = +d.Year;
        for (let key in metricConfig) {
            let colName = metricConfig[key].column;
            if (d[colName] === "" || d[colName] === null) {
                d[colName] = null;
            } else {
                d[colName] = +d[colName];
            }
        }
    });

    globalData = data;

    const currentSocial = document.getElementById('social-factor-select').value;
    const currentHealth = document.getElementById('health-factor-select').value;
    const currentYear = +document.getElementById('year-slider').value;

    const socialConf = metricConfig[currentSocial];
    const healthConf = metricConfig[currentHealth];

    
    let yearData = globalData.filter(d => d.Year === currentYear);

    const filteredData = yearData.filter(d => 
        d[socialConf.column] !== null && 
        d[healthConf.column] !== null
    );
    console.log("Country count for all charts:", filteredData.length);

    socialChart = new Histogram({
        parentElement: '#histogram-1',
        key: socialConf.column,
        xLabel: socialConf.title,
        color: socialConf.palette[3]
    }, filteredData);

    healthChart = new Histogram({
        parentElement: '#histogram-2',
        key: healthConf.column,
        xLabel: healthConf.title,
        color: healthConf.palette[3]
    }, filteredData);

    scatter = new Scatterplot({
        parentElement: '#scatter-plot',
        xKey: socialConf.column,
        yKey: healthConf.column,
        xLabel: socialConf.title,
        yLabel: healthConf.title,
        colorPalette: healthConf.palette,
        colorDomain: healthConf.domain
    }, filteredData);

    socialMap = new ChoroplethMap({
        parentElement: '#map-1',
        key: socialConf.column,
        title: socialConf.title,
        colorPalette: socialConf.palette,
        colorDomain: socialConf.domain
    }, geoData, filteredData);

    healthMap = new ChoroplethMap({
        parentElement: '#map-2',
        key: healthConf.column,
        title: healthConf.title,
        colorPalette: healthConf.palette,
        colorDomain: healthConf.domain
    }, geoData, filteredData);

    const resizeObserver = new ResizeObserver(entries => {
        window.requestAnimationFrame(() => {
            socialChart.resize();
            healthChart.resize();
            socialMap.resize();
            healthMap.resize();
            scatter.resize();
        });
    });

    // Start watching the containers
    resizeObserver.observe(document.querySelector('#histogram-1'));
    resizeObserver.observe(document.querySelector('#histogram-2'));
    resizeObserver.observe(document.querySelector('#scatter-plot'));
    resizeObserver.observe(document.querySelector('#map-1'));
    resizeObserver.observe(document.querySelector('#map-2'));

    d3.selectAll('#social-factor-select, #health-factor-select, #year-slider').on('change input', function() {
        if (this.id === 'year-slider') {
            d3.select('#year-display').text(this.value); 
        }
        updateAllCharts();
    });
})

function updateAllCharts() {

    const currentSocial = document.getElementById('social-factor-select').value;
    const currentHealth = document.getElementById('health-factor-select').value;
    const currentYear = +document.getElementById('year-slider').value;

    const socialConf = metricConfig[currentSocial];
    const healthConf = metricConfig[currentHealth];


    const yearData = globalData.filter(d => d.Year === currentYear);

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


    socialChart.update(yearData);
    healthChart.update(yearData);
    scatter.update(yearData);
    socialMap.update(yearData);
    healthMap.update(yearData);
}
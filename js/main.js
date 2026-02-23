
const empowermentColors = ["#E4F1F1", "#A3D2CA", "#5EAAA8", "#056676", "#022B3A"];
const riskColors = ["#FDF2E9", "#F5CBA7", "#EB984E", "#CA6F1E", "#873600"];

const metricConfig = {
    // SOCIAL FACTORS
    "schooling": {
        column: "Average years of schooling (Women)",
        title: "Years of Schooling",
        palette: empowermentColors,
        domain: [0, 4, 8, 12, 16] 
    },
    "political": {
        column: "Women's Political Empowerment Index",
        title: "Political Empowerment Index",
        palette: empowermentColors,
        domain: [0, 0.25, 0.5, 0.75, 1.0] 
    },
    "labor": {
        column: "Ratio of female to male labor force participation rate",
        title: "Female/Male Labor Ratio (%)",
        palette: empowermentColors,
        domain: [20, 40, 60, 80, 100]
    },
    
    // HEALTH OUTCOMES
    "mortality": {
        column: "Maternal mortality ratio",
        title: "Maternal Mortality (per 100k)",
        palette: riskColors,
        domain: [0, 50, 200, 500, 1000] 
    },
    "antenatal": {
        column: "Antenatal care coverage - at least four visits (%)",
        title: "Antenatal Care Coverage (%)",
        palette: empowermentColors, 
        domain: [20, 40, 60, 80, 100] 
    },
    "contraception": {
        column: "Unmet need for contraception (% of married women ages 15-49)",
        title: "Unmet Contraception Need (%)",
        palette: riskColors, 
        domain: [0, 10, 20, 30, 40]
    }
};

let globalData = [];
let socialChart, healthChart, socialMap, healthMap, scatter;

Promise.all([
    d3.csv('./data/combined_womens_health_data_cleaned.csv'),
    d3.json('./data/world.geojson')
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
        color: socialConf.palette[2]
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

  /*   socialMap = new ChoroplethMap({
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
    }, geoData, filteredData); */

    const resizeObserver = new ResizeObserver(entries => {
        window.requestAnimationFrame(() => {
            socialChart.resize();
            healthChart.resize();
/*             socialMap.resize();
            healthMap.resize(); */
            scatter.resize();
        });
    });

    // Start watching the containers
    resizeObserver.observe(document.querySelector('#histogram-1'));
    resizeObserver.observe(document.querySelector('#histogram-2'));
    resizeObserver.observe(document.querySelector('#scatter-plot'));
/*     resizeObserver.observe(document.querySelector('#map-1'));
    resizeObserver.observe(document.querySelector('#map-2')); */

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

    /* const filteredData = yearData.filter(d => 
        d[socialConf.column] !== null && 
        d[healthConf.column] !== null
    ); */

    const filteredData = yearData.filter(d => {
        const val1 = d[socialConf.column];
        const val2 = d[healthConf.column];
        return val1 !== null && val2 !== null && !isNaN(val1) && !isNaN(val2);
    });

    console.log("Master Filter Count:", filteredData.length);


    socialChart.config.key = socialConf.column;
    socialChart.config.xLabel = socialConf.title;
    socialChart.config.color = socialConf.palette[2];

    healthChart.config.key = healthConf.column;
    healthChart.config.xLabel = healthConf.title;
    healthChart.config.color = healthConf.palette[3];

    scatter.config.xKey = socialConf.column;
    scatter.config.yKey = healthConf.column;
    scatter.config.xLabel = socialConf.title;
    scatter.config.yLabel = healthConf.title;
    scatter.config.colorPalette = healthConf.palette;
    scatter.config.colorDomain = healthConf.domain;

/*     socialMap.config.key = socialConf.column;
    socialMap.config.title = socialConf.title;
    socialMap.config.colorPalette = socialConf.palette;
    socialMap.config.colorDomain = socialConf.domain;

    healthMap.config.key = healthConf.column;
    healthMap.config.title = healthConf.title;
    healthMap.config.colorPalette = healthConf.palette;
    healthMap.config.colorDomain = healthConf.domain; */


    socialChart.update(filteredData);
    healthChart.update(filteredData);
    scatter.update(filteredData);
/*     socialMap.update(filteredData);
    healthMap.update(filteredData); */
}
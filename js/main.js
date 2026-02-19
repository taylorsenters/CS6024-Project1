
d3.csv('data/data_2020.csv').then(data => {
    data.forEach(d => {
        d.schooling = +d.schooling;
        d.maternal_mortality_ratio = +d.maternal_mortality_ratio;
    });

    const schoolingChart = new Histogram({
        parentElement: '#histogram-1',
        key: 'schooling',
        xLabel: 'Years of Schooling'
    }, data);

    const mmrChart = new Histogram({
        parentElement: '#histogram-2',
        key: 'maternal_mortality_ratio',
        xLabel: 'Maternal Mortality Ratio (MMR)'
    }, data);

    const scatter = new Scatterplot({
        parentElement: '#scatter-plot',
        xKey: 'schooling',
        yKey: 'maternal_mortality_ratio',
        xLabel: 'Years of Schooling',
        yLabel: 'Maternal Mortality Ratio'
    }, data);

    const resizeObserver = new ResizeObserver(entries => {
        // We wrap this in requestAnimationFrame to prevent "ResizeObserver loop limit" errors
        window.requestAnimationFrame(() => {
            schoolingChart.resize();
            mmrChart.resize();
            scatter.resize();
        });
    });

    // Start watching the containers
    resizeObserver.observe(document.querySelector('#histogram-1'));
    resizeObserver.observe(document.querySelector('#histogram-2'));
    resizeObserver.observe(document.querySelector('#scatter-plot'));
})
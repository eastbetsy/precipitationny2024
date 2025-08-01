// fetch data from https://archive-api.open-meteo.com/v1/archive?latitude=40.71&longitude=-74.01&start_date=2024-01-01&end_date=2024-12-31&daily=precipitation_sum&precipitation_unit=inch&timezone=America/New_York


// define width and height of chart

const margin = {top: 40, right: 30, bottom: 60, left: 60};
const width = 860 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// define svg dimensions
const svg = d3.select("#chart-container")
    .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
    .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
// define API URL
const dataset = 'https://archive-api.open-meteo.com/v1/archive?latitude=40.71&longitude=-74.01&start_date=2024-01-01&end_date=2024-12-31&daily=precipitation_sum&precipitation_unit=inch&timezone=America/New_York'

// fetch data from URL
d3.json(dataset).then(apiData => {
    // convert daily data into monthly totals
    const monthlyData = processData(apiData);
    console.log(monthlyData);
    // x scale
    const xScale = d3.scaleBand()
        .domain(monthlyData.map(d => d.month)) //array of months
        .range([0, width])
        .padding(0.2); // space bw bars
    // y scale
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(monthlyData, d=> d.precipitation) + 1])
        .range([height, 0]); //inverted svg coordinates
    // x axis
    const xAxis = d3.axisBottom(xScale);
        svg.append("g")
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis);
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .style("text-anchor", "middle")
            .text("Month");
    // y axis
    const yAxis = d3.axisLeft(yScale);
        svg.append("g")
            .call(yAxis);
        // y axis label
        svg.append("text")
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 15)
            .attr('x', 0 - (height / 2))
            .style('text-anchor', 'middle')
            .text("Total Monthly Precipitation (Inches)");
    // tooltip div
    const tooltip = d3.select('#container')
        .append('div')
        .attr('id', 'tooltip');
    // bars
    svg.selectAll('.bar')
        .data(monthlyData)
        .join('rect')
            .attr('class', 'bar')
            .attr('x', d=> xScale(d.month))
            .attr('y', d => yScale(d.precipitation))
            .attr('height', d => height - yScale(d.precipitation))
            .attr('width', xScale.bandwidth())
    //tooltip events
        .on('mouseover', (event, d) => {
            tooltip.style('opacity', 1);
            tooltip.html(`<strong>${d.month}</strong><br>${d.precipitation.toFixed(2)} inches`)
                .style('left', (event.pageX + 10) + "px")
                .style('top', (event.pageY - 28) + "px");
    })
        .on('mouseout', () => {
            tooltip.style('opacity', 0);
        });

}).catch(e => console.error(e));

// group daily count by month
function processData(apiData) {
    const daily = apiData.daily;
    const monthlyTotals = {};

    // initialize months
    for (let i = 1; i <= 12; i++) { // loop through each month
        const monthKey = i.toString().padStart(2, '0');
        monthlyTotals[monthKey] = 0;
    }
    // sum of daily precipitation each month
    daily.time.forEach((date, index) => {
        const month = date.split('-')[1];
        const precipitation = daily.precipitation_sum[index];
        if (typeof precipitation === 'number') {
            monthlyTotals[month] += precipitation;
        }
    });
    // convert to array in D3
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Object.keys(monthlyTotals).map((monthKey, index) => ({
        month: monthNames[index],
        precipitation: monthlyTotals[monthKey]
    }));
}
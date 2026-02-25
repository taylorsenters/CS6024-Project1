# CS6024 Project 1: A World of Data

**Author:** Taylor Senters  
**Live Application:** [https://taylorsenters-cs-6024-project1.vercel.app/](https://taylorsenters-cs-6024-project1.vercel.app/) 

## Project Overview
This project is an interactive web-based data visualization dashboard built with D3.js, JavaScript, HTML, and CSS. It allows a general audience to explore and compare country-level data across various metrics. The dashboard features multiple linked views, enabling users to analyze distributions, correlations, and spatial patterns across the globe.

## Data Source
* **Provider:** [Our World in Data](https://ourworldindata.org/)
* **Format:** CSV (Pre-processed and merged using the common 'FIPS' country code identifier).
* **Attributes Explored:** Social Factors (Average Years of Schooling, Adolescent Birth Rate, Women in Tertiary Education) and Women's Health Factors (Maternal Mortality Ratio (MMR), Antenatal Care Coverage, Anemia Prevalence in Women)
* **Spatial Data:** GeoJSON world map data for choropleth visualization.

## Main Features
* **Application Layout:** Clean, single-page dashboard layout built with CSS (no scrolling required to compare charts).
* **Distribution Views:** Two histograms displaying the distribution of the selected quantitative attributes.
* **Correlation View:** A scatterplot comparing the two selected attributes against each other to identify potential correlations.
* **Spatial Distribution:** Side-by-side Choropleth maps showing how these attributes are distributed globally.
* **Color Scheme:** Intentional, data-driven color scales
* **Attribute Selection Menu:** A UI dropdown/menu allowing users to dynamically swap out the dataset attributes being visualized.
* **Detail-on-Demand Tooltips:** Interactive tooltips/hover effects for the histograms, scatterplot, and maps to display specific country names and exact values.
* **Time Slider:** A time slider allowing users to select which year to see data for (Time range: 2000 to 2020)
* **Brushing & Linking:** D3 brushing and linking on the visualizations to highlight/filter the selected countries across all charts.

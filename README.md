# CS6024 Project 1: A World of Data

**Author:** Taylor Senters  
**Live Application:** [https://taylorsenters-cs-6024-project1.vercel.app/](https://taylorsenters-cs-6024-project1.vercel.app/) 

## Project Overview
This project is an interactive web-based data visualization dashboard built with **D3.js, JavaScript, HTML, and CSS**. It allows a general audience to explore and compare country-level data across various metrics. The dashboard features multiple linked views, enabling users to analyze distributions, correlations, and spatial patterns across the globe.

## Data Source
* **Provider:** [Our World in Data](https://ourworldindata.org/)
* **Format:** CSV (Pre-processed and merged using the common 'FIPS' country code identifier).
* **Attributes Explored:** Social Factors (Years of Schooling) and Women's Health Outcomes (Maternal Mortality Ratio (MMR))
* **Spatial Data:** GeoJSON world map data for choropleth visualization.

## Current Progress & Features

### ✅ Implemented 
* **Application Layout:** Clean, single-page dashboard layout built with CSS (no scrolling required to compare charts).
* **Distribution Views (Visualizations 1 & 2):** Two histograms/bar charts displaying the distribution of the selected quantitative attributes.
* **Correlation View (Visualization 3):** A scatterplot comparing the two selected attributes against each other to identify potential correlations.
* **Spatial Distribution:** Added side-by-side Choropleth maps to show how these attributes are distributed globally.
* **Color Scheme:** Implemented intentional, data-driven color scales 
* **Attribute Selection Menu:** Built a UI dropdown/menu allowing users to dynamically swap out the dataset attributes being visualized.
* **Detail-on-Demand Tooltips:** Added interactive tooltips/hover effects to the histograms, scatterplot, and map to display specific country names and exact values.
* **Time Slider:** Added a time slider to allow users to select which year to see data for

### 🚧 Work in Progress
- [ ] **Level 5: Brushing & Linking.** Implement D3 brushing on the distribution and scatterplot visualizations to filter the selected countries across *all* active charts.

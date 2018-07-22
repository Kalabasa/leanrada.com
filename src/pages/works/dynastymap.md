<!--{
	"template": "work",
	"data": "projects_byid.dynastymap"
}-->


# Dynasty Map

<p class="center">
	<img class="media-plain" src="../img/dynastymap_logo.png" alt="logo"/>
</p>

## Visualization of political dynasties in the Philippines.

Political dynasties are prevalent in Philippine politics.

We all know they're bad, but how can we justify that view? We can look into data and statistics. An easy way to study data is through data visualization.

![visualization of dynasties](../img/dynastymap_tags.png)

**DynastyMap** is a webapp for visualizing political dynasties and comparing it with other variables such as population and poverty indicators.

![comparing datasets](../img/dynastymap_compare.png)

Main features of the app are the computation political dynasty prevalence in <abbr title="Local Government Units">LGUs</abbr>, and visualization of dynasties along with various user-uploaded datasets.

![screenshot](../img/dynastymap_1.jpg)

This webapp is a <abbr title="single-page application">SPA</abbr> made in [React](https://reactjs.org) and [Backbone.js](http://backbonejs.org). I used [Leaflet](https://leafletjs.com) and [D3.js](https://d3js.org/) for the visualizations.

Server-side is PHP with [Slim](https://www.slimframework.com) and [Medoo](https://medoo.in). Server-side processing is in Python. Data processing is for the computation of dynasty variables and GeoJSON processing.

![detail view](../img/dynastymap_2.jpg)

I got the data from [COMELEC](https://www.comelec.gov.ph) and [Open Data PH](https://www.gov.ph/data). I had to scrape election results from the 2015 COMELEC website because they don't have an API.

Fortunately for anyone trying this kind of thing today, election results are now available in CSV(?) on Open Data PH.

![detail view](../img/dynastymap_biv.jpg)

This project was developed as a requirement (Special Problem) for my Computer Science B.S. degree. The idea of political dynasty visualization came from one of my professors. It was also inspired by Hans Rosling's visualizations and [Trendalyzer](https://www.gapminder.org/tools).

An instance of the app is hosted on the university's development server, but it's not working and I no longer maintain it. You can still see the landing page and the bare app [there](http://agila.upm.edu.ph/~lgrada/dynavis).

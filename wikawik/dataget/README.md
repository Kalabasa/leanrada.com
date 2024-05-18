This sub-project is for data retrieval, scraping, and normalisation.

Data required by the application:

- PSGC mapping
- language statistics per province/area
- language information
- geo shapes
- phrases
- metadata (general info about areas and languages)
- media

Getting the PSGC mapping

- Pull git submodules to get `thinkingmachines/psgc`

Getting language info

- Run `./scraper/kwf.js` to download data from KWF into `./data/kwf.json`

Getting language stats

- Requires PSGC mapping (`./data/psgc.json`)
- Requires language info (`./data/kwf.json`)
- Open `./scraper/stats.html` in a web browser to download statistical tables from PSA 2010 census
- Copy downloaded xlsx files to `./data/`. Filenames must be in "s1234 Name.xlsx" format.
- Run `process_languages.js` to process xlsx data into `./data/languages.json`

Getting geo shapes

- Requires PSGC mapping (`./data/psgc.json`)
- Pull git submodules to get `faeldon/philippines-json-maps`
- Run `process_topo.js` to generate `./data/areas.topo.json` from 2015 geojson data

Phrases

- Requires language data (`./data/languages.json`)
- Phrases are manually curated in `/phrases/` directory.
- Run `process_phrases.js` to compile all `/phrases/*.csv` into `./data/phrases.json`

Metadata

- Requires PSGC mapping (`./data/psgc.json`)
- Requires language stats (`./data/languages.json`)
- Requires language info (`./data/kwf.json`)
- Run `process_metadata.js` to generate `./data/metadata.json`

Media

- Requires language data (`./data/languages.json`)
- Phrases are manually curated in `/media/` directory.
- Run `process_media.js` to compile all `/media/*.csv` into `./data/media.json`

Compile data for viz app

- Run `verify.js` to validate generated data.
- Run `compile.js` after all the steps above to produce `/viz/data/data.json`

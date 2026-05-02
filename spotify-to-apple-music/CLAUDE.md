# Playlist Converter

Converts music service playlist exports to formats other services can import.
Currently: Spotify CSV → Apple Music iTunes XML.

## How it works

### Input

Spotify playlists exported as CSV via [exportify.net](https://exportify.net).
Exportify produces a CSV with many columns; this tool only uses:

| Column | Used for |
|---|---|
| `Track Name` | Track name in XML |
| `Artist Name(s)` | Artist field — comma-separated if multiple; only the first is used |
| `Album Name` | Album field — empty string if missing |
| `Duration (ms)` | `Total Time` in XML — defaults to 0 if missing |
| `Disc Number` | `Disc Number` in XML — defaults to 1 |
| `Track Number` | `Track Number` in XML — defaults to 0 |

### Output

An iTunes Library XML plist (`output.xml`) that Apple Music accepts via
**File → Library → Import Playlist**. Apple Music then tries to match each
track against your local library or the Apple Music catalogue.

The format is a subset of the full iTunes Library XML spec:
- A `Tracks` dict keyed by sequential integer IDs (1, 2, 3…)
- A `Playlists` array with one entry containing the playlist name and a list of track ID references

### Key files

- `convert.js` — the entire tool; no external dependencies, Node.js built-ins only
- `output.xml` — sample output generated from a test CSV (Classic Rock tracks)

### Internal structure of convert.js

```
parseCsvLine()   hand-rolled CSV parser; handles quoted fields and escaped quotes
parseCsv()       async readline-based file reader; returns array of row objects keyed by header name
xmlEscape()      escapes &, <, >, ", ' for safe XML embedding
buildTrackXml()  renders one <key>/<dict> block for the Tracks section
buildXml()       assembles the full plist document
convertFile()    orchestrates parse → build → write for a single file
parseArgs()      minimal --flag value CLI parser
main()           entry point; handles single-file and batch modes
```

## Usage

### Prerequisites

Node.js (any version with async/await support — v12+). No `npm install` needed.

### Get a playlist CSV

1. Go to [exportify.net](https://exportify.net)
2. Log in with Spotify
3. Click **Export** next to a playlist
4. Save the `.csv` file

### Single playlist

```bash
node convert.js --input my_playlist.csv --name "My Playlist Name"
# writes output.xml in the current directory
```

`--name` is optional; defaults to the CSV filename without extension.

### Batch (whole folder)

```bash
node convert.js --batch ./my_playlists/
# writes one .xml per .csv in the same folder
```

### Import into Apple Music

1. Run the script to produce `output.xml`
2. Open Apple Music on Mac
3. **File → Library → Import Playlist**
4. Select `output.xml`

## Extending to other providers

The tool is deliberately split into three concerns to make new converters easy to add:

1. **Input parser** — reads a source format into a common array of track objects
2. **Output builder** — serialises that array into the target format
3. **CLI wiring** — `--input`, `--name`, `--batch` flags

### Adding a new source (e.g. TIDAL, Deezer)

Each service's export will have different column names. Add a normaliser function
that maps their headers to the shared internal shape:

```js
// internal track shape expected by buildTrackXml()
{
  'Track Name':    string,
  'Artist Name(s)': string,   // comma-separated if multiple
  'Album Name':    string,
  'Duration (ms)': string | number,
  'Track Number':  string | number,
  'Disc Number':   string | number,
}
```

### Adding a new target (e.g. Rekordbox XML, M3U)

Add a new builder function alongside `buildXml()` and a `--format` flag to
select it at runtime. The input pipeline stays the same.

### Suggested folder structure when adding converters

```
spotify-to-apple-music/
  convert.js          ← current tool, keep as reference implementation
  parsers/
    exportify.js      ← Spotify/exportify CSV → internal shape
    tidal.js          ← TIDAL CSV → internal shape
  builders/
    itunes-xml.js     ← internal shape → iTunes plist XML
    rekordbox.js      ← internal shape → Rekordbox XML
  cli.js              ← shared arg parsing and orchestration
```

This split only makes sense once there are 2+ parsers or 2+ builders —
don't refactor before then.

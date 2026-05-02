#!/usr/bin/env node
/*
 * Spotify → Apple Music Playlist Converter
 *
 * How to import into Apple Music:
 * 1. Run this script to generate output.xml
 * 2. Open Apple Music on Mac
 * 3. File → Library → Import Playlist
 * 4. Select output.xml
 * 5. Apple Music will attempt to match each track from your library or Apple Music catalogue
 *
 * Usage:
 *   node convert.js --input my_playlist.csv --name "My Playlist Name"
 *   node convert.js --input my_playlist.csv --name "My Playlist Name" --enrich
 *
 * Options:
 *   --input   Path to the CSV file exported from exportify.net (required)
 *   --name    Playlist name to use in Apple Music (defaults to CSV filename)
 *   --batch   Path to a folder of CSVs; converts all of them, one output XML per file
 *   --enrich  Look up each track on MusicBrainz and replace metadata with canonical values
 *             to improve Apple Music matching. Adds ~1s per track due to rate limiting.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

// ── XML helpers ──────────────────────────────────────────────────────────────

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── CSV parser (no external deps) ────────────────────────────────────────────

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function parseCsv(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const rows = [];
  let headers = null;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (!headers) {
      headers = fields.map(h => h.trim());
    } else {
      const row = {};
      headers.forEach((h, i) => {
        row[h] = (fields[i] || '').trim();
      });
      rows.push(row);
    }
  }

  return rows;
}

// ── XML builder ──────────────────────────────────────────────────────────────

function buildTrackXml(track, id) {
  const name      = xmlEscape(track['Track Name'] || '');
  const artists   = track['Artist Name(s)'] || '';
  const artist    = xmlEscape(artists.split(',')[0].trim());
  const album     = xmlEscape(track['Album Name'] || '');
  const duration  = parseInt(track['Duration (ms)'], 10) || 0;
  const trackNum  = parseInt(track['Track Number'], 10) || 0;
  const discNum   = parseInt(track['Disc Number'], 10) || 1;

  return `    <key>${id}</key>
    <dict>
      <key>Track ID</key><integer>${id}</integer>
      <key>Name</key><string>${name}</string>
      <key>Artist</key><string>${artist}</string>
      <key>Album</key><string>${album}</string>
      <key>Total Time</key><integer>${duration}</integer>
      <key>Track Number</key><integer>${trackNum}</integer>
      <key>Disc Number</key><integer>${discNum}</integer>
    </dict>`;
}

function buildXml(playlistName, tracks) {
  const trackEntries = tracks.map((t, i) => buildTrackXml(t, i + 1)).join('\n');

  const playlistItems = tracks
    .map((_, i) =>
      `        <dict><key>Track ID</key><integer>${i + 1}</integer></dict>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Major Version</key><integer>1</integer>
  <key>Minor Version</key><integer>1</integer>
  <key>Application Version</key><string>12.0</string>
  <key>Tracks</key>
  <dict>
${trackEntries}
  </dict>
  <key>Playlists</key>
  <array>
    <dict>
      <key>Name</key><string>${xmlEscape(playlistName)}</string>
      <key>Playlist Items</key>
      <array>
${playlistItems}
      </array>
    </dict>
  </array>
</dict>
</plist>
`;
}

// ── MusicBrainz enrichment ───────────────────────────────────────────────────

function mbGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'spotify-to-apple-music-converter/1.0 (github.com/vaggab0nd/fun-tetris)' },
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('MusicBrainz returned invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('MusicBrainz request timed out')); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function lookupMusicBrainz(trackName, artistName) {
  const q = encodeURIComponent(`recording:"${trackName}" AND artist:"${artistName}"`);
  const url = `https://musicbrainz.org/ws/2/recording/?query=${q}&fmt=json&limit=1`;

  try {
    const data = await mbGet(url);
    const recording = data.recordings && data.recordings[0];
    if (!recording || recording.score < 85) return null;

    const canonicalTitle  = recording.title || trackName;
    const canonicalArtist = recording['artist-credit'] && recording['artist-credit'][0]
      ? recording['artist-credit'][0].name
      : artistName;
    // Prefer the earliest release (index 0 from MusicBrainz ordering)
    const release = recording.releases && recording.releases[0];
    const canonicalAlbum = release ? release.title : null;

    return { title: canonicalTitle, artist: canonicalArtist, album: canonicalAlbum };
  } catch {
    return null;
  }
}

async function enrichTracks(tracks) {
  console.log(`Enriching ${tracks.length} tracks via MusicBrainz (1 req/sec)...`);
  let matched = 0, unchanged = 0, failed = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const originalName   = track['Track Name'] || '';
    const originalArtist = (track['Artist Name(s)'] || '').split(',')[0].trim();
    const originalAlbum  = track['Album Name'] || '';

    process.stdout.write(`  [${i + 1}/${tracks.length}] ${originalName} — `);

    const result = await lookupMusicBrainz(originalName, originalArtist);

    if (result) {
      const changes = [];
      if (result.title  !== originalName)   changes.push(`title: "${result.title}"`);
      if (result.artist !== originalArtist) changes.push(`artist: "${result.artist}"`);
      if (result.album  && result.album !== originalAlbum) changes.push(`album: "${result.album}"`);

      if (changes.length > 0) {
        track['Track Name']    = result.title;
        track['Artist Name(s)'] = result.artist;
        if (result.album) track['Album Name'] = result.album;
        console.log(`updated (${changes.join(', ')})`);
        matched++;
      } else {
        console.log('ok');
        unchanged++;
      }
    } else {
      console.log('no match, keeping original');
      failed++;
    }

    // MusicBrainz rate limit: 1 request per second
    if (i < tracks.length - 1) await sleep(1050);
  }

  console.log(`\nEnrichment complete: ${matched} updated, ${unchanged} already correct, ${failed} not found.\n`);
  return tracks;
}

// ── Conversion ───────────────────────────────────────────────────────────────

async function convertFile(inputPath, playlistName, outputPath, enrich = false) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  let tracks = await parseCsv(inputPath);
  if (tracks.length === 0) {
    throw new Error('No tracks found in CSV.');
  }

  if (enrich) tracks = await enrichTracks(tracks);

  const xml = buildXml(playlistName, tracks);
  fs.writeFileSync(outputPath, xml, 'utf8');

  console.log(`Converted ${tracks.length} tracks → ${outputPath}`);
}

// ── CLI arg parser ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return args;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  // Batch mode
  if (args.batch) {
    const dir = args.batch;
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      console.error(`Error: --batch path is not a directory: ${dir}`);
      process.exit(1);
    }
    const csvFiles = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.csv'));
    if (csvFiles.length === 0) {
      console.error('No CSV files found in directory.');
      process.exit(1);
    }
    for (const file of csvFiles) {
      const inputPath = path.join(dir, file);
      const name = path.basename(file, path.extname(file));
      const outputPath = path.join(dir, `${name}.xml`);
      try {
        await convertFile(inputPath, name, outputPath, !!args.enrich);
      } catch (err) {
        console.error(`Failed to convert ${file}: ${err.message}`);
      }
    }
    return;
  }

  // Single file mode
  if (!args.input) {
    console.error('Usage: node convert.js --input <file.csv> [--name "Playlist Name"]');
    console.error('       node convert.js --batch <folder/>');
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  const playlistName = args.name || path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.resolve('output.xml');

  try {
    await convertFile(inputPath, playlistName, outputPath, !!args.enrich);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

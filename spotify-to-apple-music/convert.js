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
 *
 * Options:
 *   --input   Path to the CSV file exported from exportify.net (required)
 *   --name    Playlist name to use in Apple Music (defaults to CSV filename)
 *   --batch   Path to a folder of CSVs; converts all of them, one output XML per file
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// ── Conversion ───────────────────────────────────────────────────────────────

async function convertFile(inputPath, playlistName, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const tracks = await parseCsv(inputPath);
  if (tracks.length === 0) {
    throw new Error('No tracks found in CSV.');
  }

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
        await convertFile(inputPath, name, outputPath);
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
    await convertFile(inputPath, playlistName, outputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

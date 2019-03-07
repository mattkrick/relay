#!/usr/bin/env node
"use strict";

var fs = require("fs");

var path = require("path");

var minimist = require("./minimist");

var pkg = require("./package.json");

var JSON5 = require("./.");

var argv = minimist(process.argv.slice(2), {
  alias: {
    'convert': 'c',
    'space': 's',
    'validate': 'v',
    'out-file': 'o',
    'version': 'V',
    'help': 'h'
  },
  "boolean": ['convert', 'validate', 'version', 'help'],
  string: ['space', 'out-file']
});

if (argv.version) {
  version();
} else if (argv.help) {
  usage();
} else {
  var inFilename = argv._[0];
  var readStream;

  if (inFilename) {
    readStream = fs.createReadStream(inFilename);
  } else {
    readStream = process.stdin;
  }

  var json5 = '';
  readStream.on('data', function (data) {
    json5 += data;
  });
  readStream.on('end', function () {
    var space;

    if (argv.space === 't' || argv.space === 'tab') {
      space = '\t';
    } else {
      space = Number(argv.space);
    }

    var value;

    try {
      value = JSON5.parse(json5);

      if (!argv.validate) {
        var json = JSON.stringify(value, null, space);
        var writeStream; // --convert is for backward compatibility with v0.5.1. If
        // specified with <file> and not --out-file, then a file with
        // the same name but with a .json extension will be written.

        if (argv.convert && inFilename && !argv.o) {
          var parsedFilename = path.parse(inFilename);
          var outFilename = path.format(Object.assign(parsedFilename, {
            base: path.basename(parsedFilename.base, parsedFilename.ext) + '.json'
          }));
          writeStream = fs.createWriteStream(outFilename);
        } else if (argv.o) {
          writeStream = fs.createWriteStream(argv.o);
        } else {
          writeStream = process.stdout;
        }

        writeStream.write(json);
      }
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });
}

function version() {
  console.log(pkg.version);
}

function usage() {
  console.log("\n  Usage: json5 [options] <file>\n\n  If <file> is not provided, then STDIN is used.\n\n  Options:\n\n    -s, --space              The number of spaces to indent or 't' for tabs\n    -o, --out-file [file]    Output to the specified file, otherwise STDOUT\n    -v, --validate           Validate JSON5 but do not output JSON\n    -V, --version            Output the version number\n    -h, --help               Output usage information");
}
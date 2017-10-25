/*
 * DOCUMENT
 *
 * A simple HTTP server for dictionary look up!
 *
 *
 * API:
 *
 * GET /detail/{word}
 * Get details of words
 * Response Type: JSON
 * Response Detail: Array<{ word: string, pos: string, definition: string }>
 *
 * GET /list/{prefix}
 * List words start with given prefix
 * Response Type: JSON
 * Response Detail: Array<string>
 *
 * How To Run:
 *
 * node ./server 8080
 *
 */

'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const dictionary = [];
const loadDictionary = function () {
  const filename = path.resolve(__dirname, 'dict.txt');
  const lines = String(fs.readFileSync(filename)).split(/(?:\r\n|\r|\n)/).map(x => x.split('\t'));
  lines.map(([word, pos, definition]) => {
    let p = dictionary;
    if (!/^[a-zA-Z]+$/.test(word)) return;
    Array.from(word + '@').map(x => x.charCodeAt(0) & 31).forEach(w => {
      p = p[w] = p[w] || [];
    });
    p.push({ word, pos, definition });
  });
};

const getNode = function (word) {
  return Array.from(word)
    .map(x => x.charCodeAt(0) & 31)
    .reduce((p, w) => p && p[w], dictionary);
};

const getDetail = function (word) {
  return getNode(word + '@') || [];
};

const getList = function (word) {
  const node = getNode(word);
  const list = [];
  (function getWords(node) {
    if (node[0] && node[0][0] && node[0][0].word) {
      list.push(node[0][0].word);
    }
    for (let i = 1; i <= 26; i++) {
      if (!node[i]) continue;
      if (list.length >= 100) return;
      getWords(node[i]);
    }
  }(node || []));
  return list;
};

const doQuery = {
  detail: getDetail,
  list: getList,
};

const errorResponse = function (res, code, message) {
  res.writeHead(code, { 'Content-Type': 'text/plain' });
  res.end(message);
};

const httpHandler = function (req, res) {
  console.log(`${req.method} ${req.url}`);
  const match = req.url.match(/^\/(detail|list)\/([a-zA-Z]+)/);
  if (!match) { errorResponse(res, 404, 'Not Found'); return; }
  const [queryType, queryText] = Array.prototype.slice.call(match, 1);
  if (req.method !== 'GET') { errorResponse(res, 405, 'Method not Allowed'); return; }
  const queryResult = doQuery[queryType](queryText);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(queryResult));
}

const startServer = function (port) {
  http.createServer(httpHandler).listen(port);
  console.log(`Server listened on port ${port}`);
};

if (!module.parent) {
  console.log(`Loading dictionary...`);
  loadDictionary();
  startServer(+process.argv[2] || 8080);
} else {
  loadDictionary();
  module.export = startServer;
}

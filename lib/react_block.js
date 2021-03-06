// React block
// An array of opening and corresponding closing sequences for react jsx tags,
// last argument defines whether it can terminate a paragraph or not
//
import {REACT_TAG_RE} from './constans';

var REACT_SEQUENCES = [
  // PascalCase Components
  [REACT_TAG_RE, /^$/, true],
  [/^<([A-Z][A-Za-z0-9]*)/, /^$/, true, (p1) => {
    return new RegExp(`<?\/(${p1})?>\\s*$`);
  }]
  // [ /^<![A-Z]/,     />/,     true ],
  // [ new RegExp('^</?(' + block_names.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true ],
  // [ new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + '\\s*$'),  /^$/, false ]
];


export default function react_block(state, startLine, endLine, silent) {
  var i, nextLine, token, lineText,
    pos = state.bMarks[startLine] + state.tShift[startLine],
    max = state.eMarks[startLine],
    match = '';

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (!state.md.options.html) { return false; }

  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

  lineText = state.src.slice(pos, max);

  for (i = 0; i < REACT_SEQUENCES.length; i++) {
    if (REACT_SEQUENCES[i][0].test(lineText)) {
      match = lineText.match(REACT_SEQUENCES[i][0])[1];
      break;
    }
  }

  if (i === REACT_SEQUENCES.length) { return false; }

  if (silent) {
    // true if this sequence can be a terminator, false otherwise
    return REACT_SEQUENCES[i][2];
  }

  nextLine = startLine + 1;

  if (typeof REACT_SEQUENCES[i][3] === 'function'){
    REACT_SEQUENCES[i][1] = REACT_SEQUENCES[i][3](match);
  }
  // If we are here - we detected HTML block.
  // Let's roll down till block end.
  if (!REACT_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) { break; }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);

      if (REACT_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) { nextLine++; }
        break;
      }
    }
  }

  state.line = nextLine;

  token         = state.push('react_block', '', 0);
  token.map     = [ startLine, nextLine ];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);

  return true;
}

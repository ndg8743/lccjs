import { LanguageSupport } from '@codemirror/language';
import { StreamLanguage } from '@codemirror/language';

/**
 * LCC Assembly language mode for CodeMirror
 * Provides syntax highlighting for LCC assembly language
 */
const lccLanguage = StreamLanguage.define({
  name: 'lcc',
  
  token(stream, state) {
    // Skip whitespace
    if (stream.eatSpace()) {
      return null;
    }

    // Comments
    if (stream.match(/^;.*$/)) {
      return 'comment';
    }

    // Labels (words followed by colon)
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
      return 'labelName';
    }

    // Directives (starting with dot)
    if (stream.match(/^\.(word|fill|string|stringz|str|blkw|ascii|asciiz|byte|data|text|global|extern|export|import|include|org|equ|set|align|space|section)\b/i)) {
      return 'meta';
    }

    // Instructions - purple in VSCode
    if (stream.match(/^(add|sub|mul|div|rem|and|or|xor|not|mov|ld|st|lea|ldr|str|push|pop|br|brz|brn|brp|brlt|brgt|brc|bral|jmp|jsr|ret|bl|blr|cmp|srl|sra|sll|rol|ror|mvr|sext|mvi|halt|nl|dout|udout|hout|aout|sout|din|hin|ain|sin|clear|sleep|nbain|cursor|srand|rand|millis|resetc|m|r|s|bp)\b/i)) {
      return 'keyword';
    }

    // Registers - cyan in VSCode
    if (stream.match(/^r[0-7]\b|^(sp|fp|lr)\b/i)) {
      return 'atom';
    }

    // Numbers (decimal, hex, binary)
    if (stream.match(/^#?-?0x[0-9a-f]+\b/i)) {
      return 'number';
    }
    if (stream.match(/^#?-?0b[01]+\b/i)) {
      return 'number';
    }
    if (stream.match(/^#?-?\d+\b/)) {
      return 'number';
    }

    // Strings
    if (stream.match(/^"([^"\\]|\\.)*"/)) {
      return 'string';
    }

    // Identifiers (labels, symbols)
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      return 'variableName';
    }

    // Operators and punctuation
    if (stream.match(/^[+\-*/%=<>!&|^~()[\]{},.]/)) {
      return 'operator';
    }

    // Skip unknown characters
    stream.next();
    return null;
  },

  startState() {
    return {};
  },
});

/**
 * Creates the LCC language support extension
 * @returns {LanguageSupport} The language support extension
 */
export function createLccMode() {
  return new LanguageSupport(lccLanguage);
}
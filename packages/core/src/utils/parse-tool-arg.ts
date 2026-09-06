/**
 * Defensive fallback for an upstream agno v2 bug — see:
 *   - https://github.com/agno-agi/agno/issues/8007 (upstream, closed)
 *   - https://github.com/rodrigocoliveira/agno-client/issues/11 (downstream)
 *
 * The agno v2 backend (Python) used to serialize list/dict values inside
 * `tool_args` via `str()` / `repr()`, producing single-quoted Python literals
 * that are NOT valid JSON. **Confirmed fixed in Agno v3** (`ToolExecution.tool_args`
 * is now `Dict[str, Any]`, serialized normally — verified against `agno==3.0.6`
 * source), so this coercion is no longer expected to ever trigger against a v3
 * backend. It's kept as a harmless, no-cost safety net (JSON.parse is tried
 * first) rather than removed outright, in case older Python-repr-style data is
 * still present in historical session records read from the database.
 */

/**
 * Coerce a single tool_args value into its structured JS form.
 *
 * Attempts, in order:
 *   1. Non-string  → return as-is (forward-compat: agno may emit structured)
 *   2. Empty/whitespace string → return as-is
 *   3. Valid JSON  → JSON.parse result
 *   4. Looks like a Python literal → parse with internal Python-literal parser
 *   5. Otherwise → return original string unchanged
 *
 * Never throws — failed parses fall through to the original value.
 */
export function parseToolArg(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  if (looksLikePythonLiteral(trimmed)) {
    try {
      return parsePythonLiteral(trimmed);
    } catch {
      // fall through to raw string
    }
  }

  return value;
}

/** Apply parseToolArg to every value of a tool_args dict. */
export function parseToolArgs(
  args: Record<string, unknown> | undefined | null
): Record<string, unknown> {
  if (!args || typeof args !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(args)) {
    out[key] = parseToolArg(args[key]);
  }
  return out;
}

function looksLikePythonLiteral(s: string): boolean {
  if (s.length === 0) return false;
  const c = s[0];
  if (c === '[' || c === '{' || c === '(' || c === "'") return true;
  return s === 'True' || s === 'False' || s === 'None';
}

/**
 * Minimal Python-literal parser. Handles the subset agno emits via repr():
 * - lists `[...]`, tuples `(...)` (treated as arrays), dicts `{...}`
 * - single- and double-quoted strings with `\\`, `\'`, `\"`, `\n`, `\r`,
 *   `\t`, `\b`, `\f`, `\0`, `\xHH`, `\uHHHH` escapes
 * - ints, floats (incl. negative, scientific), `True`, `False`, `None`
 * - trailing commas, arbitrary whitespace
 *
 * Recursive descent over a position index.
 */
function parsePythonLiteral(src: string): unknown {
  let i = 0;

  function err(msg: string): never {
    throw new Error(`parsePythonLiteral: ${msg} at offset ${i}`);
  }

  function skipWs(): void {
    while (i < src.length) {
      const c = src.charCodeAt(i);
      if (c === 32 || c === 9 || c === 10 || c === 13) i++;
      else break;
    }
  }

  function parseValue(): unknown {
    skipWs();
    if (i >= src.length) err('unexpected end');
    const c = src[i];

    if (c === '[' || c === '(') return parseList(c === '[' ? ']' : ')');
    if (c === '{') return parseDict();
    if (c === "'" || c === '"') return parseString(c);
    if (c === '-' || c === '+' || (c >= '0' && c <= '9')) return parseNumber();
    if (c === 'T' && src.startsWith('True', i)) {
      i += 4;
      return true;
    }
    if (c === 'F' && src.startsWith('False', i)) {
      i += 5;
      return false;
    }
    if (c === 'N' && src.startsWith('None', i)) {
      i += 4;
      return null;
    }
    err(`unexpected char '${c}'`);
  }

  function parseList(closer: string): unknown[] {
    i++; // consume opener
    const out: unknown[] = [];
    skipWs();
    if (src[i] === closer) {
      i++;
      return out;
    }
    while (i < src.length) {
      out.push(parseValue());
      skipWs();
      if (src[i] === ',') {
        i++;
        skipWs();
        if (src[i] === closer) {
          i++;
          return out;
        }
        continue;
      }
      if (src[i] === closer) {
        i++;
        return out;
      }
      err(`expected ',' or '${closer}'`);
    }
    err('unterminated list');
  }

  function parseDict(): Record<string, unknown> {
    i++; // consume '{'
    const out: Record<string, unknown> = {};
    skipWs();
    if (src[i] === '}') {
      i++;
      return out;
    }
    while (i < src.length) {
      skipWs();
      const key = parseValue();
      const keyStr = typeof key === 'string' ? key : String(key);
      skipWs();
      if (src[i] !== ':') err("expected ':' in dict");
      i++;
      const value = parseValue();
      out[keyStr] = value;
      skipWs();
      if (src[i] === ',') {
        i++;
        skipWs();
        if (src[i] === '}') {
          i++;
          return out;
        }
        continue;
      }
      if (src[i] === '}') {
        i++;
        return out;
      }
      err("expected ',' or '}'");
    }
    err('unterminated dict');
  }

  function parseString(quote: string): string {
    i++; // consume opener
    let out = '';
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') {
        i++;
        if (i >= src.length) err('dangling escape');
        const e = src[i++];
        switch (e) {
          case 'n': out += '\n'; break;
          case 't': out += '\t'; break;
          case 'r': out += '\r'; break;
          case 'b': out += '\b'; break;
          case 'f': out += '\f'; break;
          case '0': out += '\0'; break;
          case '\\': out += '\\'; break;
          case "'": out += "'"; break;
          case '"': out += '"'; break;
          case 'x': {
            const hex = src.slice(i, i + 2);
            if (!/^[0-9a-fA-F]{2}$/.test(hex)) err('bad \\x escape');
            out += String.fromCharCode(parseInt(hex, 16));
            i += 2;
            break;
          }
          case 'u': {
            const hex = src.slice(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) err('bad \\u escape');
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            // Unknown escape — keep the char literal (Python's behavior in
            // non-raw strings would warn; we just pass through).
            out += e;
        }
        continue;
      }
      if (c === quote) {
        i++;
        return out;
      }
      out += c;
      i++;
    }
    err('unterminated string');
  }

  function parseNumber(): number {
    const start = i;
    if (src[i] === '+' || src[i] === '-') i++;
    while (i < src.length && /[0-9]/.test(src[i])) i++;
    let isFloat = false;
    if (src[i] === '.') {
      isFloat = true;
      i++;
      while (i < src.length && /[0-9]/.test(src[i])) i++;
    }
    if (src[i] === 'e' || src[i] === 'E') {
      isFloat = true;
      i++;
      if (src[i] === '+' || src[i] === '-') i++;
      while (i < src.length && /[0-9]/.test(src[i])) i++;
    }
    const slice = src.slice(start, i);
    if (slice === '' || slice === '+' || slice === '-') err('expected number');
    const n = isFloat ? parseFloat(slice) : parseInt(slice, 10);
    if (Number.isNaN(n)) err(`bad number '${slice}'`);
    return n;
  }

  const result = parseValue();
  skipWs();
  if (i !== src.length) err('trailing characters');
  return result;
}

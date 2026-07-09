/**
 * Safe math expression evaluator — recursive-descent parser.
 * Supports arithmetic, parentheses, common functions, and constants.
 * No eval(), no dynamic code execution.
 */

type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: string }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "comma" }
  | { type: "ident"; value: string }
  | { type: "eof" };

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  π: Math.PI,
};

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  sin: (a) => Math.sin(a[0]),
  cos: (a) => Math.cos(a[0]),
  tan: (a) => Math.tan(a[0]),
  asin: (a) => Math.asin(a[0]),
  acos: (a) => Math.acos(a[0]),
  atan: (a) => Math.atan(a[0]),
  log: (a) => Math.log10(a[0]),
  ln: (a) => Math.log(a[0]),
  log2: (a) => Math.log2(a[0]),
  sqrt: (a) => Math.sqrt(a[0]),
  cbrt: (a) => Math.cbrt(a[0]),
  abs: (a) => Math.abs(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
  round: (a) => Math.round(a[0]),
  min: (a) => Math.min(...a),
  max: (a) => Math.max(...a),
  pow: (a) => Math.pow(a[0], a[1]),
};

class Lexer {
  private pos = 0;
  constructor(private readonly input: string) {}

  next(): Token {
    this.skipWhitespace();
    if (this.pos >= this.input.length) return { type: "eof" };

    const ch = this.input[this.pos]!;

    if (ch === "(") { this.pos++; return { type: "lparen" }; }
    if (ch === ")") { this.pos++; return { type: "rparen" }; }
    if (ch === ",") { this.pos++; return { type: "comma" }; }

    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "%" || ch === "^") {
      this.pos++;
      return { type: "op", value: ch };
    }

    if (this.isDigit(ch) || ch === ".") {
      return this.readNumber();
    }

    if (this.isAlpha(ch)) {
      return this.readIdent();
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && this.isSpace(this.input[this.pos]!)) {
      this.pos++;
    }
  }

  private readNumber(): Token {
    const start = this.pos;
    while (this.pos < this.input.length && (this.isDigit(this.input[this.pos]!) || this.input[this.pos] === ".")) {
      this.pos++;
    }
    // Handle scientific notation like 1e10 or 1E-5
    if (this.pos < this.input.length && (this.input[this.pos] === "e" || this.input[this.pos] === "E")) {
      const nextPos = this.pos + 1;
      if (nextPos < this.input.length && (this.input[nextPos] === "+" || this.input[nextPos] === "-" || this.isDigit(this.input[nextPos]!))) {
        this.pos++;
        if (this.input[this.pos] === "+" || this.input[this.pos] === "-") this.pos++;
        while (this.pos < this.input.length && this.isDigit(this.input[this.pos]!)) this.pos++;
      }
    }
    const num = Number(this.input.slice(start, this.pos));
    if (isNaN(num)) throw new Error(`Invalid number: ${this.input.slice(start, this.pos)}`);
    return { type: "number", value: num };
  }

  private readIdent(): Token {
    const start = this.pos;
    while (this.pos < this.input.length && (this.isAlpha(this.input[this.pos]!) || this.isDigit(this.input[this.pos]!))) {
      this.pos++;
    }
    return { type: "ident", value: this.input.slice(start, this.pos).toLowerCase() };
  }

  private isDigit(ch: string): boolean { return ch >= "0" && ch <= "9"; }
  private isAlpha(ch: string): boolean { return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z"); }
  private isSpace(ch: string): boolean { return ch === " " || ch === "\t" || ch === "\n" || ch === "\r"; }
}

class Parser {
  private tokens: Token[] = [];
  private pos = 0;

  constructor(input: string) {
    const lexer = new Lexer(input);
    const toks: Token[] = [];
    let tok = lexer.next();
    while (tok.type !== "eof") {
      toks.push(tok);
      tok = lexer.next();
    }
    toks.push({ type: "eof" });
    this.tokens = toks;
  }

  parse(): number {
    const result = this.parseExpr();
    if (this.peek().type !== "eof") {
      throw new Error(`Unexpected token: ${this.peek().type}`);
    }
    return result;
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "eof" };
  }

  private advance(): Token {
    const tok = this.tokens[this.pos] ?? { type: "eof" };
    this.pos++;
    return tok;
  }

  // Expression: term (('+' | '-') term)*
  private parseExpr(): number {
    let left = this.parseTerm();
    while (true) {
      const tok = this.peek();
      if (tok.type !== "op") break;
      if (tok.value !== "+" && tok.value !== "-") break;
      this.advance();
      const right = this.parseTerm();
      left = tok.value === "+" ? left + right : left - right;
    }
    return left;
  }

  // Term: power (('*' | '/' | '%') power)*
  private parseTerm(): number {
    let left = this.parsePower();
    while (true) {
      const tok = this.peek();
      if (tok.type !== "op") break;
      if (tok.value !== "*" && tok.value !== "/" && tok.value !== "%") break;
      this.advance();
      const right = this.parsePower();
      if (tok.value === "*") left = left * right;
      else if (tok.value === "/") {
        if (right === 0) throw new Error("Division by zero");
        left = left / right;
      } else left = left % right;
    }
    return left;
  }

  // Power: unary ('^' unary)*  (right-associative)
  private parsePower(): number {
    let base = this.parseUnary();
    const tok = this.peek();
    if (tok.type === "op" && tok.value === "^") {
      this.advance();
      const exp = this.parseUnary(); // right-associative: parseUnary not parsePower
      base = Math.pow(base, exp);
    }
    return base;
  }

  // Unary: ('+' | '-') unary | postfix
  private parseUnary(): number {
    const tok = this.peek();
    if (tok.type === "op" && tok.value === "-") {
      this.advance();
      return -this.parseUnary();
    }
    if (tok.type === "op" && tok.value === "+") {
      this.advance();
      return this.parseUnary();
    }
    return this.parsePostfix();
  }

  // Postfix: atom
  // Function calls are handled in parseAtom now
  private parsePostfix(): number {
    return this.parseAtom();
  }

  // Atom: number | constant | '(' expr ')' | ident
  private parseAtom(): number {
    const tok = this.peek();

    if (tok.type === "number") {
      this.advance();
      return tok.value;
    }

    if (tok.type === "ident") {
      this.advance();
      const name = tok.value;

      // Constant
      if (name in CONSTANTS) return CONSTANTS[name]!;

      // Function call: name '(' args ')'
      const func = FUNCTIONS[name];
      if (func) {
        if (this.peek().type === "lparen") {
          // Explicit parentheses: sin(x)
          this.advance(); // consume '('
          const args: number[] = [];
          if (this.peek().type !== "rparen") {
            args.push(this.parseExpr());
            while (this.peek().type === "comma") {
              this.advance();
              args.push(this.parseExpr());
            }
          }
          if (this.peek().type !== "rparen") throw new Error("Expected closing parenthesis");
          this.advance(); // consume ')'
          return func(args);
        }
        // Implicit parentheses: sin pi/2
        const arg = this.parseUnary();
        return func([arg]);
      }

      throw new Error(`Unknown identifier: ${name}`);
    }

    if (tok.type === "lparen") {
      this.advance();
      const val = this.parseExpr();
      if (this.peek().type !== "rparen") throw new Error("Expected closing parenthesis");
      this.advance();
      return val;
    }

    throw new Error(`Unexpected token: ${tok.type}`);
  }
}

/**
 * Evaluate a math expression string and return the numeric result.
 * Throws on invalid syntax, division by zero, or unknown identifiers.
 */
export function evaluate(expr: string): number {
  const cleaned = expr.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  if (cleaned.length === 0) throw new Error("Empty expression");
  const parser = new Parser(cleaned);
  const result = parser.parse();
  if (!isFinite(result)) throw new Error("Result is not a finite number");
  return result;
}

/**
 * Format a number to the given precision (significant digits).
 */
export function formatResult(value: number, precision: number): string {
  const p = Math.max(1, Math.min(15, Math.floor(precision)));
  // Use toPrecision for significant digits, then strip trailing zeros after decimal
  const formatted = Number(value.toPrecision(p));
  // If it's an integer and within safe range, show without decimal
  if (Number.isInteger(formatted) && Math.abs(formatted) < 1e15) {
    return String(formatted);
  }
  return String(formatted);
}

import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { evaluate, formatResult } from "../math-eval.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const DEFAULT_PRECISION = 8;

const composer = new Composer<Ctx>();

function looksLikeMath(text: string): boolean {
  const cleaned = text.trim();
  if (cleaned.length === 0) return false;
  if (cleaned.startsWith("/")) return false;
  const hasDigit = /\d/.test(cleaned);
  const hasOp = /[+\-*/^%()]/.test(cleaned);
  const hasFunc = /^(sin|cos|tan|asin|acos|atan|log|ln|log2|sqrt|cbrt|abs|floor|ceil|round|min|max|pow|pi|e|π)\b/i.test(cleaned);
  return hasDigit && (hasOp || hasFunc);
}

composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text.trim();

  // In group chat, only trigger on /calc or @botname
  if (ctx.chat.type !== "private") {
    if (text.startsWith("/calc")) {
      const expr = text.replace(/^\/calc(@\w+)?\s*/, "").trim();
      if (expr.length === 0) {
        await ctx.reply("Send an expression after /calc, like: /calc 2+2");
        return;
      }
      await handleCalc(ctx, expr);
      return;
    }
    return next(); // let other handlers process this
  }

  // Private chat: auto-detect math expressions
  if (looksLikeMath(text)) {
    await handleCalc(ctx, text);
    return;
  }

  // Not a math expression - let other handlers process it
  return next();
});

composer.command("calc", async (ctx) => {
  if (!ctx.message) return;
  const args = ctx.message.text.split(/\s+/).slice(1).join(" ").trim();
  if (args.length === 0) {
    await ctx.reply(
      "Send a math expression to evaluate it.\n\n" +
      "Examples: 2+2, sin(pi/2), sqrt(144), 2^10",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }
  await handleCalc(ctx, args);
});

async function handleCalc(ctx: Ctx, expr: string) {
  const precision = ctx.session.preferredPrecision ?? DEFAULT_PRECISION;
  try {
    const result = evaluate(expr);
    const formatted = formatResult(result, precision);
    await ctx.reply(`${expr} = ${formatted}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    let hint = "Try a valid math expression like 2+2 or sin(pi/2).";
    if (msg.includes("Division by zero")) {
      hint = "Cannot divide by zero.";
    } else if (msg.includes("Unknown function")) {
      hint = "That function isn't supported. Try sin, cos, tan, log, sqrt, or abs.";
    } else if (msg.includes("Unknown identifier")) {
      hint = "That name isn't recognized. Use pi for π or e for Euler's number.";
    } else if (msg.includes("Unexpected token") || msg.includes("Expected closing")) {
      hint = "Check your parentheses — they might be mismatched.";
    }
    await ctx.reply(`Couldn't evaluate that.\n${hint}`);
  }
}

export default composer;

import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { evaluate, formatResult } from "../math-eval.js";

const DEFAULT_PRECISION = 8;

registerMainMenuItem({ label: "⚙️ Precision", data: "precision:configure", order: 30 });

const composer = new Composer<Ctx>();

composer.command("precision", async (ctx) => {
  if (!ctx.message) return;
  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length === 0) {
    const current = ctx.session.preferredPrecision ?? DEFAULT_PRECISION;
    await ctx.reply(
      `Current precision: ${current} significant digits.\n\n` +
      `Send a number between 1 and 15 to change it, or tap the button below.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⚙️ Set precision", "precision:configure")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const value = parseInt(args[0]!, 10);
  if (isNaN(value) || value < 1 || value > 15) {
    await ctx.reply(
      "Precision must be a whole number between 1 and 15. Try again.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  ctx.session.preferredPrecision = value;
  const example = formatResult(Math.PI, value);
  await ctx.reply(
    `Precision set to ${value} significant digits.\nFor example, π = ${example}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("precision:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const current = ctx.session.preferredPrecision ?? DEFAULT_PRECISION;
  await ctx.editMessageText(
    `Current precision: ${current} significant digits.\n\nSend a number between 1 and 15 to change it, or tap the button below.`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⚙️ Set precision", "precision:configure")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

export default composer;

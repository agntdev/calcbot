import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { formatResult } from "../math-eval.js";

const DEFAULT_PRECISION = 8;

const composer = new Composer<Ctx>();

const PRESETS = [2, 4, 6, 8, 10, 12];

composer.callbackQuery("precision:configure", async (ctx) => {
  await ctx.answerCallbackQuery();
  const current = ctx.session.preferredPrecision ?? DEFAULT_PRECISION;

  const presetRows = PRESETS.map((p) => {
    const marker = p === current ? " ✓" : "";
    return [inlineButton(`${p}${marker}`, `precision:set:${p}`)];
  });

  await ctx.editMessageText(
    `Choose a precision level (significant digits):\nCurrent: ${current}`,
    {
      reply_markup: inlineKeyboard([
        ...presetRows,
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery(/^precision:set:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const match = ctx.callbackQuery.data.match(/^precision:set:(\d+)$/);
  if (!match) return;
  const value = parseInt(match[1]!, 10);
  if (value < 1 || value > 15) return;

  ctx.session.preferredPrecision = value;
  const example = formatResult(Math.PI, value);
  await ctx.editMessageText(
    `Precision set to ${value} significant digits.\nFor example, π = ${example}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

export default composer;

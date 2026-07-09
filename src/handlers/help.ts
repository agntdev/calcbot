import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "How to use this calculator:\n\n" +
  "Just type a math expression and I'll evaluate it.\n\n" +
  "Operators: + - * / ^ %\n" +
  "Functions: sin cos tan log sqrt abs floor ceil round\n" +
  "Constants: pi e\n" +
  "Grouping: (parentheses)\n\n" +
  "Examples:\n" +
  "  2 + 2\n" +
  "  sin(pi/2)\n" +
  "  sqrt(144)\n" +
  "  2^10\n\n" +
  "In groups, send /calc followed by your expression.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP, { reply_markup: backToMenu });
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;

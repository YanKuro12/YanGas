/*
  @ Credited to GuckTube
  @ Remaked by ReallBoyy
*/

import { promises as fs } from "fs";
import path from "path";
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';

const fname = fileURLToPath(import.meta.url);
const __dir = path.dirname(fname);
const bot = new Telegraf('8411521862:AAGheaW9KKF55QG2joWlnY3ZZ5Sa8_RyTbs');
let helpCmd;

async function Commands() {
  const pluginsdir = path.join(__dir, "code");
  const files =  await fs.readdir('./code');
  const plugins = files.filter((f) => f.endsWith('.js'));
  var menuCommands = []
  for (const file of plugins) {
    const { default: handler } = await import(`file://${pluginsdir}/${file}`);

    if (handler.command && Array.isArray(handler.command)) {
       handler.command.forEach((cmd) => { bot.command(cmd, (ctx) => { handler(ctx, { conn: bot }) })})
       if (handler.help) {
         menuCommands.push({ command: handler.command[0], description: handler.help});
       }
    }
  }
  if (menuCommands.length) {
    bot.telegram.setMyCommands(menuCommands);
    helpCmd = menuCommands;
  }
}

bot.use((ctx, next) => {
  console.log(ctx.from);
  console.log(ctx.message);
  next();
});

bot.start((ctx) => {
  ctx.reply('Hello there! use /help to show all bot commands.');
});
bot.help((ctx) => {
  var msgToSent = '';
  for (const cmd of helpCmd) {
    if (cmd !== null) msgToSent += `<\\-\\> ${cmd.command} \\- ${cmd.description}\n`;
  }
  ctx.replyWithMarkdownV2(`**Available Command List:**\n${msgToSent}`);
  return;
})

await Commands();

bot.launch(() => console.log('Telegram bot is online!'));




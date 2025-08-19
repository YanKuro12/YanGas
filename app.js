const { Telegraf } = require("telegraf");
const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

const bot = new Telegraf("8411521862:AAGheaW9KKF55QG2joWlnY3ZZ5Sa8_RyTbs");

// Import tools modular
const decode = require("./code/decode");
const encode = require("./code/encode");
const rttexToPng = require("./code/rttextopng");
const pngToRttex = require("./code/pngtorttex");
const resize = require("./code/resize");
const protonhash = require("./code/protonhash");
const itemtools = require("./code/src/itemtools");

// Session
const sessions = {};
bot.use((ctx, next) => {
  const id = ctx.from?.id;
  if (!sessions[id]) sessions[id] = {};
  ctx.session = sessions[id];
  return next();
});

// Register semua command
const commands = [
  "decode", "encode", "rttextopng", "pngtorttex",
  "resize", "itemtxt", "itemdat", "protonhash"
];

commands.forEach(cmd => {
  bot.command(cmd, (ctx) => {
    ctx.session.awaitingFile = cmd;
    ctx.reply(`Kirim file untuk *${cmd}*`, { parse_mode: "Markdown" });
  });
});

// Saat file dikirim
bot.on("document", async (ctx) => {
  const cmd = ctx.session?.awaitingFile;
  if (!cmd) return ctx.reply("Ketik command dulu (misal /decode)");

  const file = ctx.message.document;
  const link = await ctx.telegram.getFileLink(file.file_id);
  const res = await fetch(link.href);
  const buffer = await res.buffer();

  try {
    let result;

    switch (cmd) {
      case "decode":
        result = await decode(buffer);
        break;
      case "encode":
        result = await encode(buffer);
        break;
      case "rttextopng":
        result = await rttexToPng(buffer);
        break;
      case "pngtorttex":
        result = await pngToRttex(buffer);
        break;
      case "resize":
        result = await resize(buffer);
        break;
      case "itemtxt":
        result = await itemtools.itemDatToTxt(buffer);
        break;
      case "itemdat":
        result = await itemtools.itemTxtToDat(buffer);
        break;
      case "protonhash":
        result = await protonhash(buffer);
        break;
    }

    if (Buffer.isBuffer(result)) {
      await ctx.replyWithDocument({ source: result, filename: `${cmd}_result.bin` });
    } else {
      await ctx.reply(result.length > 4096 ? "Output terlalu panjang." : `\`\`\`\n${result}\n\`\`\``, { parse_mode: "Markdown" });
    }
  } catch (e) {
    console.error(e);
    ctx.reply("Gagal proses file.");
  }

  ctx.session.awaitingFile = null;
});

bot.launch();
console.log("Bot jalan...");
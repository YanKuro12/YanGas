import { item_decoder } from "./src/itemtools.js";

const handler = async (ctx, { conn }) => {
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        await ctx.reply("Please reply your items.dat file");
    }
    else {
        const flink = await ctx.telegram.getFileLink(ctx.message.reply_to_message.document.file_id);
        const res = await fetch(flink);
        if (res.ok) {
            const buff = await res.arrayBuffer();
            const file = Buffer.from(JSON.stringify(item_decoder(buff), null, 2), 'utf-8');
            await ctx.replyWithDocument({ source: file, filename: 'items.json'});
            await ctx.reply('Here is your decoded items.dat');
        }
        else {
            await ctx.reply('Something is wrong');
        }
    }
}

handler.command = ["decode"];
handler.help = "Decode your items\\.dat to items\\.json";

export default handler;

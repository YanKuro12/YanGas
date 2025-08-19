import { item_encoder } from "./src/itemtools.js";

const handler = async (ctx, { conn }) => {
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        await ctx.reply("Please reply your items.json");
    }
    else {
        const flink = await ctx.telegram.getFileLink(ctx.message.reply_to_message.document.file_id);
        const res = await fetch(flink);
        if (res.ok) {
            const buff = await res.arrayBuffer();
            const buffer = item_encoder(buff);
            await ctx.replyWithDocument({ source: buffer, filename: 'items.dat'});
            await ctx.reply('Here is your encoded items.dat');
        }
        else {
            await ctx.reply('Something is wrong');
        }
    }
}

handler.command = ["encode"];
handler.help = "Encode your items\\.json to items\\.dat";

export default handler;

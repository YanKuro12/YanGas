function protonHash(buffer) {
    var hash = 0x55555555;
    var toBuffer = new Uint8Array(buffer);
    for (let a = 0; a < toBuffer.length; a++) hash = (hash >>> 27) + (hash << 5) + toBuffer[a];
    return hash;
}

const handler = async (ctx, { conn }) => {
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
        await ctx.reply("Please reply file that you want to get the hash");
    }
    else {
        const flink = await ctx.telegram.getFileLink(ctx.message.reply_to_message.document.file_id);
        const res = await fetch(flink);
        if (res.ok) {
            const buffers = await res.arrayBuffer();
            const hash = protonHash(buffers);
            await ctx.reply(`${ctx.message.reply_to_message.document.file_name} hash: ${hash}`);
            
        }
        else {
            return;
        }
    }
}

handler.command = ["protonhash"];
handler.help = "Reply file to get file hash";
export default handler;
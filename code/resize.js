import { Jimp } from "jimp";

async function getImage(url) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const image = await Jimp.read(buffer);
    return image;
}

const handler = async (ctx, { conn }) => {
    const reply = ctx.message.reply_to_message;
    if (!reply) {
        await ctx.reply('Please reply file/image that you want to resize.');
        return;
    }
    else {
        const args = ctx.message.text.slice(8).trim();
        const w_h = args.split(",");
        if (w_h.length !== 2) {
            await ctx.reply('Usage: /resize <width,height>');
            return;
        }
        const image = reply.document ? reply.document : reply.photo[reply.photo.length - 1];
        if (!image) {
            await ctx.reply('Please reply file/image that you want to resize.');
            return;
        }
        const flink = await ctx.telegram.getFileLink(image.file_id);
        const img = await getImage(flink);
        img.resize({ w: parseInt(w_h[0]), h: parseInt(w_h[1]) });
        const buffer = await img.getBuffer("image/png", { quality: 100,});
        await ctx.replyWithDocument({ source: buffer, filename: image.file_name ? image.file_name : 'processed.png'})
        await ctx.reply("Here is your processed image.");
    }
}

handler.command = ["resize"];
handler.help = "Resize image";
export default handler;


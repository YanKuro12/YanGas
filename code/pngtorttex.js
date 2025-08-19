import pako from 'pako';
import { Jimp } from 'jimp';

function protonHash(buffer) {
    var hash = 0x55555555;
    var toBuffer = new Uint8Array(buffer);
    for (let a = 0; a < toBuffer.length; a++) hash = (hash >>> 27) + (hash << 5) + toBuffer[a];
    return hash;
}

function write_buffer_number(dest, pos, len, value) {
    for (let a = 0; a < len; a++) {
        dest[pos + a] = (value >> (a * 8)) & 255;
    }
}

function process_png_to_rttex(img, noCompress) {
    var { width, height, data } = img.bitmap;
    const pixelBuffer = new Uint8Array(data.buffer);
    var RTTEXBuffer = [0x52, 0x54, 0x54, 0x58, 0x54, 0x52]

    write_buffer_number(RTTEXBuffer, 8, 4, height)
    write_buffer_number(RTTEXBuffer, 12, 4, width)
    write_buffer_number(RTTEXBuffer, 16, 4, 5121)
    write_buffer_number(RTTEXBuffer, 20, 4, height)
    write_buffer_number(RTTEXBuffer, 24, 4, width)
    RTTEXBuffer[28] = 1;
    RTTEXBuffer[29] = 0;
    write_buffer_number(RTTEXBuffer, 32, 4, 1)
    write_buffer_number(RTTEXBuffer, 100, 4, height)
    write_buffer_number(RTTEXBuffer, 104, 4, width)
    write_buffer_number(RTTEXBuffer, 108, 4, pixelBuffer.length);
    write_buffer_number(RTTEXBuffer, 112, 4, 0)
    write_buffer_number(RTTEXBuffer, 116, 4, 0)
    write_buffer_number(RTTEXBuffer, 120, 4, 0)

    var deflateBuffer = pako.deflate(new Uint8Array([...RTTEXBuffer, ...pixelBuffer]));
    if (noCompress) return new Uint8Array([...RTTEXBuffer, ...pixelBuffer])
    var RTPACKBuffer = [0x52, 0x54, 0x50, 0x41, 0x43, 0x4B]
    
    write_buffer_number(RTPACKBuffer, 8, 4, deflateBuffer.length);
    write_buffer_number(RTPACKBuffer, 12, 4, 0x7c + pixelBuffer.length)
    RTPACKBuffer[16] = 1
    for (let a = 17; a < 32; a++) RTPACKBuffer[a] = 0;
    return new Uint8Array([...RTPACKBuffer, ...deflateBuffer])
}

const handler = async (ctx, { conn }) => {
    const reply = ctx.message.reply_to_message;
    if (!reply) {
        await ctx.reply('Please reply PNG file that you want to convert.');
        return;
    }

    const file = reply.document;
    if (!file) {
        await ctx.reply('Please reply PNG file that you want to convert to RTTEX file.');
        return;
    }

    const fileName = file.file_name.toLowerCase();
    if (fileName && !fileName.endsWith('.png')) {
        await ctx.reply('Only PNG files are supported for conversion.');
        return;
    }

    const f = await ctx.telegram.getFileLink(file.file_id);
    const res = await fetch(f);
    if (res.ok) {
        const ab = await res.arrayBuffer();
        const buffer = Buffer.from(ab);
        const img = await Jimp.read(buffer);
        const getOutputBuffer = process_png_to_rttex(img, true);

        const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "output";
        const name = baseName + ".rttex";
        const bFile = Buffer.from(getOutputBuffer);
        await ctx.replyWithDocument({ source: bFile, filename: name});
        await ctx.reply(`${name} hash: ${protonHash(bFile)}`);
    }
}

handler.command = ['pngtorttex'];
handler.help = "Convert PNG to RTTEX file";
export default handler;
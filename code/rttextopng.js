import pako from "pako";
import { createCanvas, ImageData } from "canvas";

function protonHash(buffer) {
    var hash = 0x55555555;
    var toBuffer = new Uint8Array(buffer);
    for (let a = 0; a < toBuffer.length; a++) hash = (hash >>> 27) + (hash << 5) + toBuffer[a];
    return hash;
}

function read_buffer_string(buffer, pos, len) {
  let result = "";
  for (let a = 0; a < len; a++) {
    result += String.fromCharCode(buffer[a + pos]);
  }
  return result;
}

function read_buffer_number(buffer, pos, len) {
  let value = 0;
  for (let a = 0; a < len; a++) value += buffer[pos + a] << (a * 8);
  return value;
}

function rttex_to_png_buffer(fileBuffer) {
  let arrayBuffer = new Uint8Array(fileBuffer);

  if (read_buffer_string(arrayBuffer, 0, 6) === "RTPACK") {
    arrayBuffer = pako.inflate(arrayBuffer.slice(32));
  }

  if (read_buffer_string(arrayBuffer, 0, 6) !== "RTTXTR") {
    throw new Error("❌ Not a valid RTTEX File");
  }

  const packedHeight = read_buffer_number(arrayBuffer, 8, 4);
  const packedWidth = read_buffer_number(arrayBuffer, 12, 2);
  const usesAlpha = arrayBuffer[0x1c];

  const canvas = createCanvas(packedWidth, packedHeight);
  const ctx = canvas.getContext("2d");

  const pixelData = new Uint8ClampedArray(
    arrayBuffer.slice(0x7c, 0x7c + packedHeight * packedWidth * (3 + usesAlpha))
  );

  const imageData = new ImageData(pixelData, packedWidth, packedHeight);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toBuffer("image/png");
}

const handler = async (ctx, { conn }) => {
    const document = ctx.message.reply_to_message.document;
    if (!document) {
        await ctx.reply('Please reply your rttex file.');
    }
    else {
        const fl = await ctx.telegram.getFileLink(document.file_id);
        const res = await fetch(fl);
        if (res.ok) {
            const ab = await res.arrayBuffer();
            const buffer = rttex_to_png_buffer(ab);
            let fname = document.file_name.split('.');
            fname.pop();
            const fileName = fname.join('.') + '.png';
            const hash = protonHash(buffer);
            await ctx.replyWithDocument({ source: buffer, filename: fileName });
            await ctx.reply(`${fileName} hash: ${hash}`);
        }
    }
}

handler.command = ["rttextopng"];
handler.help = "Convert RTTEX to PNG";
export default handler;

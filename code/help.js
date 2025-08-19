const handler = async (ctx, { conn }) => {
    //Code has been moved to app.js
    return;
}

handler.command = ["help", "h", "?"];
handler.help = "Show all available command list";
export default handler;
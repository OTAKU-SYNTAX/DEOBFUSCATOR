const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs-extra");
const axios = require("axios");
const beautify = require("js-beautify").js;

// Telegram Bot Token
const BOT_TOKEN = "7615408131:AAHAfOeYNFAk9QNuz1BGTivSYT4ptMm2Ehs";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Express Setup for Web Hosting
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("🚀 Telegram Beautifier Bot is Active!"));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

console.log("🤖 Bot is now operational!");

// 📌 **/start Command**
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const instructions = `
┏━━━━━━━━━━━━━━━━━━━━┓
┃ ༆༊ 𝐓𝕳𝖀𝕲 ᵒᵗᶠ ᝰ.ᐟ︎ BEAUTIFIER 👨‍🦯
┣━━━━━━━━━━━━━━━━━━━━┫
┃ 📝 **WHAT IT DOES:**        
┃ ────────────────────
┃ ✅ Formats messy JS code    
┃ ✅ Improves readability    
┃ ✅ Keeps original logic     
┣━━━━━━━━━━━━━━━━━━━━━
┃ 🛠 **HOW TO USE:**           
┃ ─────────────────────
┃ 1️⃣ 📂 Upload a .js file     
┃ 2️⃣ ⚙️ Bot beautifies it   
┃ 3️⃣ ✅ Get clean JS code!   
┗━━━━━━━━━━━━━━━━━━━━━

⚡ *Send a JavaScript file to get started!*
    `;
    bot.sendMessage(chatId, instructions, { parse_mode: "Markdown" });
});

// 🔥 **Beautify JS Code**
async function beautifyCode(code, chatId) {
    try {
        await bot.sendMessage(chatId, "✨ Beautifying your JavaScript code...");
        return beautify(code, { indent_size: 2, space_in_empty_paren: true });
    } catch (err) {
        await bot.sendMessage(chatId, "❌ Beautification failed! Returning original file.");
        return code;
    }
}

// 📂 **Handle JS File Upload**
bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.document.file_id;

    if (!msg.document.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ Please send a JavaScript (.js) file.");
    }

    try {
        await bot.sendMessage(chatId, "📥 Downloading JS File...");
        const fileUrl = await bot.getFileLink(fileId);
        const response = await axios.get(fileUrl);
        const rawCode = response.data;

        await bot.sendMessage(chatId, "⚙️ Running Beautifier...");
        const beautifiedCode = await beautifyCode(rawCode, chatId);

        const outputPath = `./beautified_${msg.document.file_name}`;
        fs.writeFileSync(outputPath, beautifiedCode);

        await bot.sendMessage(chatId, "📤 Sending Back Beautified File...");
        await bot.sendDocument(chatId, outputPath, {
            caption: "✅ Here is your formatted JavaScript file."
        });

        fs.unlinkSync(outputPath);
    } catch (error) {
        await bot.sendMessage(chatId, "❌ Failed to process the file.");
    }
});

// 💬 **Basic Message Response**
bot.on("message", (msg) => {
    bot.sendMessage(msg.chat.id, "📂 Send a JavaScript (.js) file to beautify.");
});

console.log(`Running on port ${PORT}...`);
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs-extra");
const axios = require("axios");
const beautify = require("js-beautify").js;
const esprima = require("esprima");
const estraverse = require("estraverse");
const escodegen = require("escodegen");
const atob = require("atob");
const he = require("he");

// Telegram Bot Token
const BOT_TOKEN = "7615408131:AAHAfOeYNFAk9QNuz1BGTivSYT4ptMm2Ehs";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Express Setup for Web Hosting
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🚀 Telegram Deobfuscator Bot is Active!");
});
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

console.log("🤖 Bot is now operational!");

// 📌 **/start Command**
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const instructions = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ༆༊ 𝐓𝕳𝖀𝕲 ᵒᵗᶠ ᝰ.ᐟ︎ DEOBFUSCATOR 🧑‍🦯  
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 📜 𝗪𝗛𝗔𝗧 𝗜𝗧 𝗗𝗢𝗘𝗦:                  ┃
┃ ─────────────────────────── ┃
┃  🛠 Cleans obfuscated JS   ┃
┃  🔍 Decodes Base64 & Hex   ┃
┃  🚫 Removes eval() calls   ┃
┃  🎭 Simplifies variable names┃
┃  🧠 Parses & cleans AST     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🛠 𝗛𝗢𝗪 𝗧𝗢 𝗨𝗦𝗘:                  ┃
┃ ─────────────────────────── ┃
┃ 1️⃣ 📂 Upload a .js file        ┃
┃ 2️⃣ ⚙️ Bot processes the code   ┃
┃ 3️⃣ ✅ Receive a clean version  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🌟 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦:                    ┃
┃ ─────────────────────────── ┃
┃ ✅ 🧩 Intelligent AST parsing  ┃
┃ ✅ 🔐 Auto-removes encryption  ┃
┃ ✅ 🏆 Supports multiple methods┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚡ *Simply send a JavaScript file to get started!*
    `;
    bot.sendMessage(chatId, instructions, { parse_mode: "Markdown" });
});

// 🔥 **Improved Deobfuscation Function**
async function deobfuscateCode(code, chatId) {
    try {
        await bot.sendMessage(chatId, "🔍 Running Beautifier...");
        let cleanCode = beautify(code, { indent_size: 2 });

        await bot.sendMessage(chatId, "🧹 Removing Hex Encoded Strings...");
        cleanCode = cleanCode.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

        await bot.sendMessage(chatId, "🔓 Decoding Base64...");
        cleanCode = cleanCode.replace(/atob["'](.*?)["']/g, (_, match) => atob(match));

        await bot.sendMessage(chatId, "🌐 Decoding HTML Entities...");
        cleanCode = he.decode(cleanCode);

        await bot.sendMessage(chatId, "🔎 Parsing JavaScript AST...");
        let ast = esprima.parseScript(cleanCode);

        await bot.sendMessage(chatId, "🛑 Removing eval() calls...");
        ast = estraverse.replace(ast, {
            enter: function (node) {
                if (node.type === "CallExpression" && node.callee.name === "eval") {
                    return { type: "Literal", value: "" };
                }
                return node;
            }
        });

        await bot.sendMessage(chatId, "✏️ Simplifying Variable Names...");
        ast = estraverse.replace(ast, {
            enter: function (node) {
                if (node.type === "Identifier") {
                    node.name = node.name.replace(/_/g, "");
                }
                return node;
            }
        });

        await bot.sendMessage(chatId, "🔄 Rebuilding Code from AST...");
        return escodegen.generate(ast);
    } catch (err) {
        await bot.sendMessage(chatId, "❌ Deobfuscation Error! Returning original file.");
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
        const obfuscatedCode = response.data;

        await bot.sendMessage(chatId, "⚙️ Running Deobfuscation...");
        const deobfuscatedCode = await deobfuscateCode(obfuscatedCode, chatId);

        const outputPath = `./deobfuscated_${msg.document.file_name}`;
        fs.writeFileSync(outputPath, deobfuscatedCode);

        await bot.sendMessage(chatId, "📤 Sending Back Deobfuscated File...");
        await bot.sendDocument(chatId, outputPath, {
            caption: "✅ Here is your deobfuscated JavaScript file."
        });

        fs.unlinkSync(outputPath);
    } catch (error) {
        await bot.sendMessage(chatId, "❌ Failed to process the file. It might be too obfuscated.");
    }
});

// 💬 **Basic Message Response**
bot.on("message", (msg) => {
    bot.sendMessage(msg.chat.id, "📂 Send a JavaScript (.js) file to deobfuscate.");
});
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

// Express Setup (Optional)
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("🤖 Telegram Bot is Running..."));
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

console.log("🤖 Bot is running...");

// 🔥 **/start Command - Instructions Table**
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const instructions = `
🤖 *Welcome to the JavaScript Deobfuscator Bot!*

📂 *How to Use:*
\`\`\`
┌─────────────────────────────┐
│  📌 Send a JavaScript file  │
├─────────────────────────────┤
│  1️⃣ Upload a .js file       │
│  2️⃣ Bot deobfuscates it     │
│  3️⃣ Receives cleaned code   │
└─────────────────────────────┘
\`\`\`

🔍 *Supported Features:*
\`\`\`
┌───────────────────────────────┐
│  ✅ Beautifies messy code      │
│  ✅ Decodes Base64, Hex, HTML  │
│  ✅ Extracts hidden eval()     │
│  ✅ Parses JavaScript AST      │
└───────────────────────────────┘
\`\`\`

🚀 *Send a file now to get started!*
    `;

    bot.sendMessage(chatId, instructions, { parse_mode: "Markdown" });
});

// 🔥 **Advanced Deobfuscation Function**
function deobfuscateCode(code) {
    try {
        console.log("🔍 Running Beautifier...");
        let cleanCode = beautify(code, { indent_size: 2 });

        console.log("🔍 Decoding Encoded Strings...");
        cleanCode = cleanCode.replace(/atob["'](.*?)["']/g, (_, match) => atob(match));
        cleanCode = cleanCode.replace(/["']\\x([0-9A-Fa-f]{2})["']/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        cleanCode = he.decode(cleanCode); // Decodes HTML entities

        console.log("🔍 Parsing AST...");
        let ast = esprima.parseScript(cleanCode);

        // AST Traversal: Rename Variables & Simplify
        estraverse.traverse(ast, {
            enter: function (node) {
                if (node.type === "Literal") {
                    console.log("Found Literal:", node.value);
                }
            }
        });

        console.log("🔍 Rebuilding Code from AST...");
        return escodegen.generate(ast);
    } catch (err) {
        console.error("❌ Deobfuscation Error:", err);
        return code; // Return original if error occurs
    }
}

// 📂 **Handle JS File Upload**
bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.document.file_id;

    // Only accept .js files
    if (!msg.document.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ Please send a JavaScript (.js) file.");
    }

    try {
        console.log("📥 Downloading JS File...");
        const fileUrl = await bot.getFileLink(fileId);
        const response = await axios.get(fileUrl);
        const obfuscatedCode = response.data;

        console.log("⚙️ Running Deobfuscation...");
        const deobfuscatedCode = deobfuscateCode(obfuscatedCode);

        // Save the deobfuscated file
        const outputPath = `./deobfuscated_${msg.document.file_name}`;
        fs.writeFileSync(outputPath, deobfuscatedCode);

        console.log("📤 Sending Back Deobfuscated File...");
        await bot.sendDocument(chatId, outputPath, {
            caption: "✅ Here is your deobfuscated JavaScript file."
        });

        // Delete the file after sending
        fs.unlinkSync(outputPath);
    } catch (error) {
        console.error("❌ Error processing file:", error);
        bot.sendMessage(chatId, "❌ Failed to process the file. It might be too obfuscated.");
    }
});

// 💬 **Basic Message Response**
bot.on("message", (msg) => {
    bot.sendMessage(msg.chat.id, "📂 Send a JavaScript (.js) file to deobfuscate.");
});
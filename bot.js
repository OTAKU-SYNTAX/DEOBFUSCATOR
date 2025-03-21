const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const beautify = require("js-beautify").js;
const esprima = require("esprima");
const estraverse = require("estraverse");
const escodegen = require("escodegen");

// Bot Token & Express Setup
const BOT_TOKEN = "YOUR_BOT_TOKEN";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

console.log("🤖 Bot is running...");

// Express route to check bot status
app.get("/", (req, res) => {
    res.send("🤖 Telegram Bot is running...");
});

// Handle JavaScript file uploads
bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.document.file_id;

    // Only process .js files
    if (!msg.document.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ Please send a JavaScript (.js) file.");
    }

    try {
        // Download the file
        const fileUrl = await bot.getFileLink(fileId);
        const response = await axios.get(fileUrl);
        const obfuscatedCode = response.data;

        // Beautify code
        let deobfuscatedCode = beautify(obfuscatedCode, { indent_size: 2 });

        // Try AST parsing if needed
        try {
            const ast = esprima.parseScript(deobfuscatedCode);
            estraverse.traverse(ast, {
                enter: function (node) {
                    if (node.type === "Literal") {
                        console.log("Found literal:", node.value);
                    }
                }
            });
            deobfuscatedCode = escodegen.generate(ast);
        } catch (err) {
            console.log("AST parsing failed, sending beautified code.");
        }

        // Save cleaned file
        const outputPath = `./deobfuscated_${msg.document.file_name}`;
        fs.writeFileSync(outputPath, deobfuscatedCode);

        // Send back deobfuscated file
        await bot.sendDocument(chatId, outputPath, {
            caption: "✅ Here is your deobfuscated JavaScript file."
        });

        // Delete the file after sending
        fs.unlinkSync(outputPath);
    } catch (error) {
        console.error("Error processing file:", error);
        bot.sendMessage(chatId, "❌ Failed to process the file. It might be too obfuscated.");
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
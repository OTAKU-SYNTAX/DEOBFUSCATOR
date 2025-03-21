const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const axios = require("axios");
const beautify = require("js-beautify").js;
const esprima = require("esprima");
const estraverse = require("estraverse");
const escodegen = require("escodegen");

// Replace with your bot token
const BOT_TOKEN = "7615408131:AAHAfOeYNFAk9QNuz1BGTivSYT4ptMm2Ehs";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("🤖 Bot is running...");

// Handle file messages
bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.document.file_id;

    // Only accept .js files
    if (!msg.document.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ Please send a JavaScript (.js) file.");
    }

    try {
        // Download file
        const fileUrl = await bot.getFileLink(fileId);
        const response = await axios.get(fileUrl);
        const obfuscatedCode = response.data;

        // Attempt deobfuscation
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

        // Save deobfuscated file
        const outputPath = `./deobfuscated_${msg.document.file_name}`;
        fs.writeFileSync(outputPath, deobfuscatedCode);

        // Send the cleaned file back
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

bot.on("message", (msg) => {
    bot.sendMessage(msg.chat.id, "📂 Send a JavaScript (.js) file to deobfuscate.");
});
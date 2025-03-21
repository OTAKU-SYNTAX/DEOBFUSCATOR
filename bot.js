const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const JavaScriptObfuscator = require("javascript-obfuscator");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your bot token
const BOT_TOKEN = "7615408131:AAHAfOeYNFAk9QNuz1BGTivSYT4ptMm2Ehs";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const japaneseChars = [
    "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も", "や", "ゆ", "よ"
];

const generateJapaneseName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) {
        name += japaneseChars[Math.floor(Math.random() * japaneseChars.length)];
    }
    return name;
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Send me JavaScript code or a `.js` file, and I'll obfuscate it for you!");
});

bot.on("message", (msg) => {
    if (msg.text && !msg.text.startsWith("/")) {
        try {
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(msg.text, {
                target: "node",
                compact: true,
                renameVariables: true,
                renameGlobals: true,
                identifierGenerator: () => generateJapaneseName(),
                stringEncoding: true,
                stringSplitting: true,
                controlFlowFlattening: 0.9,
                flatten: true,
                shuffle: true,
                duplicateLiteralsRemoval: true,
                deadCode: true,
                calculator: true,
                opaquePredicates: true,
                lock: {
                    selfDefending: true,
                    antiDebug: true,
                    integrity: true,
                    tamperProtection: true
                }
            }).getObfuscatedCode();

            bot.sendMessage(msg.chat.id, "Here’s your obfuscated code:");
            bot.sendDocument(msg.chat.id, {
                filename: "obfuscated.js",
                content: obfuscatedCode,
            });
        } catch (error) {
            bot.sendMessage(msg.chat.id, "⚠️ Error obfuscating code: " + error.message);
        }
    }
});

// Handle JavaScript file uploads
bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.document.file_id;

    if (!msg.document.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ Please send a JavaScript (.js) file.");
    }

    try {
        // Get file URL
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

        // Download the file
        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
        const jsCode = response.data.toString("utf-8");

        // Obfuscate the JavaScript code
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(jsCode, {
            target: "node",
            compact: true,
            renameVariables: true,
            renameGlobals: true,
            identifierGenerator: () => generateJapaneseName(),
            stringEncoding: true,
            stringSplitting: true,
            controlFlowFlattening: 0.9,
            flatten: true,
            shuffle: true,
            duplicateLiteralsRemoval: true,
            deadCode: true,
            calculator: true,
            opaquePredicates: true,
            lock: {
                selfDefending: true,
                antiDebug: true,
                integrity: true,
                tamperProtection: true
            }
        }).getObfuscatedCode();

        // Save the obfuscated code to a file
        const outputFile = `obfuscated_${Date.now()}.js`;
        fs.writeFileSync(outputFile, obfuscatedCode);

        // Send the obfuscated file back
        bot.sendDocument(chatId, fs.createReadStream(outputFile), {}, {
            filename: "obfuscated.js",
            contentType: "application/javascript"
        });

        // Delete the file after sending
        setTimeout(() => fs.unlinkSync(outputFile), 5000);
    } catch (error) {
        bot.sendMessage(chatId, "⚠️ Error processing the file: " + error.message);
    }
});

// Express server to keep the bot alive
app.get("/", (req, res) => {
    res.send("🚀 Telegram Obfuscation Bot is running!");
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

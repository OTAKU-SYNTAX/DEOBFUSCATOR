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

bot.on("message", async (msg) => {
    if (msg.text && !msg.text.startsWith("/")) {
        try {
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(msg.text, {
                target: "node",
                compact: true,
                renameVariables: false, // Prevent renaming variables (avoids errors)
                renameGlobals: false, // Prevent renaming globals (avoids errors)
                stringConcealing: true,
                stringSplitting: false,
                controlFlowFlattening: false, // Or false, depending on whether you want it enabled
                flatten: false,
                shuffle: true,
                duplicateLiteralsRemoval: false,
                deadCode: false,
                numbersToExpressions: true, // Converts numbers to expressions (hex-like)
                ignoreImports: true // Helps preserve function length
            }).getObfuscatedCode();

            bot.sendMessage(msg.chat.id, "Here’s your obfuscated code:");
            bot.sendDocument(msg.chat.id, fs.createReadStream(saveToFile(obfuscatedCode, "obfuscated.js")));
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
            renameVariables: false, // Prevent renaming variables (avoids errors)
            renameGlobals: false, // Prevent renaming globals (avoids errors)
            stringEncoding: true,
            stringSplitting: true,
            controlFlowFlattening: 0.9,
            flatten: true,
            shuffle: true,
            duplicateLiteralsRemoval: true,
            deadCode: true,
            numbersToExpressions: true, // Converts numbers to expressions (hex-like)
            ignoreImports: true // Helps preserve function length
        }).getObfuscatedCode();

        // Save and send the obfuscated file
        const filePath = saveToFile(obfuscatedCode, "obfuscated.js");
        bot.sendDocument(chatId, fs.createReadStream(filePath));

        // Delete the file after sending
        setTimeout(() => fs.unlinkSync(filePath), 5000);
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

function saveToFile(content, filename) {
    const filePath = `./${filename}`;
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
}

const TelegramBot = require("node-telegram-bot-api");
const JavaScriptObfuscator = require("javascript-obfuscator");

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
    bot.sendMessage(msg.chat.id, "Send me JavaScript code, and I'll obfuscate it for you!");
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
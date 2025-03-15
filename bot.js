const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

const token = '7468048833:AAHa2hILMy2mAedb1HRSk-70lBqmtHcRkB4';
const auddApiKey = '69066e6fde2bd1d8d086b39ce5ddca76'; // Get this from Audd.io

const bot = new TelegramBot(token, { polling: true });

bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.voice.file_id;

    try {
        const file = await bot.getFile(fileId);
        const filePath = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        // Download the file
        const response = await axios({
            url: filePath,
            method: 'GET',
            responseType: 'stream',
        });

        const fileName = `audio.ogg`;
        const writer = fs.createWriteStream(fileName);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            // Send to Audd.io
            const formData = new FormData();
            formData.append('file', fs.createReadStream(fileName));
            formData.append('return', 'apple_music,spotify');
            formData.append('api_token', auddApiKey);

            const result = await axios.post('https://api.audd.io/', formData, {
                headers: formData.getHeaders(),
            });

            const song = result.data.result;
            if (song) {
                bot.sendMessage(chatId, `🎵 *Song:* ${song.title}\n🎤 *Artist:* ${song.artist}\n🔗 [Listen Here](${song.spotify.url})`, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, "Sorry, I couldn't recognize the song.");
            }

            fs.unlinkSync(fileName); // Delete temp file
        });
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'An error occurred while processing the audio.');
    }
});

console.log('Bot is running...');
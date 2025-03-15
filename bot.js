const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const app = express(); // Initialize Express

const token = '7468048833:AAHa2hILMy2mAedb1HRSk-70lBqmtHcRkB4';
const auddApiKey = '69066e6fde2bd1d8d086b39ce5ddca76'; // Get this from Audd.io

const bot = new TelegramBot(token, { polling: true });

bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.voice.file_id;

    try {
        // Get file path from Telegram
        const file = await bot.getFile(fileId);
        const filePath = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        // Download the voice message
        const response = await axios({
            url: filePath,
            method: 'GET',
            responseType: 'stream',
        });

        const fileName = `audio.ogg`;
        const writer = fs.createWriteStream(fileName);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            console.log("Audio file downloaded. Sending to Audd.io...");

            // Prepare form data for Audd.io
            const formData = new FormData();
            formData.append('file', fs.createReadStream(fileName));
            formData.append('return', 'apple_music,spotify');
            formData.append('api_token', auddApiKey);

            // Send to Audd.io for song recognition
            const result = await axios.post('https://api.audd.io/', formData, {
                headers: formData.getHeaders(),
            });

            const song = result.data.result;

            if (song) {
                let replyMessage = `🎵 *Song:* ${song.title}\n🎤 *Artist:* ${song.artist}`;

                // Add Spotify link if available
                if (song.spotify && song.spotify.external_urls) {
                    replyMessage += `\n🔗 [Listen on Spotify](${song.spotify.external_urls.spotify})`;
                }

                // Add Apple Music link if available
                if (song.apple_music && song.apple_music.url) {
                    replyMessage += `\n🍏 [Listen on Apple Music](${song.apple_music.url})`;
                }

                // If a song cover image exists, send it with the message
                if (song.apple_music && song.apple_music.artwork) {
                    bot.sendPhoto(chatId, song.apple_music.artwork.url, {
                        caption: replyMessage,
                        parse_mode: 'Markdown'
                    });
                } else {
                    bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
                }
            } else {
                bot.sendMessage(chatId, "❌ Sorry, I couldn't recognize the song.");
            }

            // Delete the temporary audio file
            fs.unlinkSync(fileName);
        });
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, '🚨 An error occurred while processing the audio.');
    }
});

// Express Route for Health Check
app.get('/', (req, res) => {
    res.send('✅ Telegram Bot is running!');
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot is running on port ${PORT}!`));
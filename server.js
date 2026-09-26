const express = require('express');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const app = express();
app.use(express.json());
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
const SESS_DIR = path.join(__dirname, 'sessions');
if(!fs.existsSync(SESS_DIR)) fs.mkdirSync(SESS_DIR,{recursive:true});

app.post('/pair', async (req,res)=>{
  let num = req.body.number.replace(/[^0-9]/g,'');
  if(!num.startsWith('254')) num = '254'+num.slice(-9);
  const dir = path.join(SESS_DIR, num);
  if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
  fs.mkdirSync(dir,{recursive:true});
  
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, fs.createWriteStream) },
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  try {
    await new Promise(r=>setTimeout(r, 3000));
    const code = await sock.requestPairingCode(num);
    const formatted = code.match(/.{1,4}/g).join('-');
    console.log(`PAIR CODE for ${num}: ${formatted}`);
    res.json({ code: formatted });
  } catch(e){
    console.log(e);
    res.status(500).json({ error: 'Failed, refresh page' });
  }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT, ()=> console.log('MTAANI LIVE '+PORT));

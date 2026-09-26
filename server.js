const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if(!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, {recursive:true});

// HOME
app.get('/', (req,res)=>{
  res.send('MTAANI ENGINEER BOARD - LIVE ✅<br><br>Endpoints:<br>POST /pair {number}<br>GET /recover/:number<br>POST /restore');
});

// 1. PAIR CODE
app.post('/pair', async (req,res)=>{
  let { number } = req.body;
  if(!number) return res.status(400).json({error:'Number required'});
  number = number.replace(/[^0-9]/g,'');
  if(!number.startsWith('254')) return res.status(400).json({error:'Number must start with 254 e.g 254703182307'});

  const sessionDir = path.join(SESSIONS_DIR, number);
  if(fs.existsSync(sessionDir)){
    fs.rmSync(sessionDir, {recursive:true, force:true});
  }
  fs.mkdirSync(sessionDir, {recursive:true});

  try{
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Mtaani Cloud','Chrome','1.0']
    });

    sock.ev.on('creds.update', saveCreds);

    // Wait a bit then request pair code
    await new Promise(r=>setTimeout(r,2000));
    if(!sock.authState.creds.registered){
      let code = await sock.requestPairingCode(number);
      // format like R8TM-A5BL
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      console.log(`Pair code for ${number}: ${code}`);
      return res.json({code: code, number: number, message:'Enter this code in WhatsApp > Linked Devices > Link with phone number'});
    } else {
      return res.json({message:'Already registered', number});
    }
  } catch(e){
    console.error(e);
    return res.status(500).json({error: e.message});
  }
});

// 2. RECOVERY - GET CREDS
app.get('/recover/:number', (req,res)=>{
  let number = req.params.number.replace(/[^0-9]/g,'');
  const sessionDir = path.join(SESSIONS_DIR, number);
  const credsPath = path.join(sessionDir, 'creds.json');

  if(!fs.existsSync(credsPath)){
    return res.status(404).json({error:'No backup found for '+number+'. Please pair again.'});
  }

  try{
    const creds = fs.readFileSync(credsPath, 'utf8');
    const base64Creds = Buffer.from(creds).toString('base64');
    // Hii ndio inarudi kwa website kama MTAANI~....
    const sessionId = 'MTAANI~' + base64Creds.substring(0,80) + '...FULL_RECOVERY';
    return res.json({
      number,
      creds: base64Creds,
      sessionId: sessionId,
      fullCreds: creds
    });
  } catch(e){
    return res.status(500).json({error:e.message});
  }
});

// 3. RESTORE - POST CREDS
app.post('/restore', (req,res)=>{
  const { number, creds } = req.body;
  if(!number || !creds) return res.status(400).json({error:'number and creds required'});

  const cleanNumber = number.replace(/[^0-9]/g,'');
  const sessionDir = path.join(SESSIONS_DIR, cleanNumber);
  fs.mkdirSync(sessionDir, {recursive:true});

  try{
    const decoded = Buffer.from(creds, 'base64').toString('utf8');
    fs.writeFileSync(path.join(sessionDir, 'creds.json'), decoded);
    return res.json({success:true, message:'Session restored for '+cleanNumber});

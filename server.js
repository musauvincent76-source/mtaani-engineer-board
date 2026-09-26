import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname,'public','index.html'));
});

app.post('/pair', async (req,res)=>{
  let num = req.body.number.replace(/[^0-9]/g,'');
  const { state, saveCreds } = await useMultiFileAuthState('./auth/'+num);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on('creds.update', saveCreds);
  await new Promise(r=>setTimeout(r,2000));
  let code = await sock.requestPairingCode(num);
  console.log('CODE FOR',num,':',code);
  res.json({code: code});
});

app.listen(10000, ()=>console.log('running'));

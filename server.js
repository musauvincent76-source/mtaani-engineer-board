const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MTAANI CLOUD ENGINEER BOARD LIVE ✅ - /pair ready');
});

app.post('/pair', async (req, res) => {
  let { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  
  number = number.replace(/[^0-9]/g, '');
  if (!number.startsWith('254')) return res.status(400).json({ error: 'Number must start with 254' });

  const sessionDir = path.join(__dirname, 'sessions', number);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Mtaani Cloud", "Chrome", "1.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    // Wait 3 seconds then request pair code
    await delay(3000);
    
    let code = await sock.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join('-') || code;
    
    console.log(`Pair code for ${number}: ${code}`);
    
    res.json({ code: code, pairCode: code, number: number, status: 'generated' });

    // Close socket after 60 sec
    setTimeout(() => {
      try { sock.ws.close(); } catch(e) {}
    }, 60000);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate: ' + e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Board LIVE on', PORT));

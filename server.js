import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Home - kuona kama board iko live
app.get('/', (req, res) => {
  res.json({ 
    status: 'MTAANI CLOUD ENGINEER BOARD LIVE ✅',
    owner: 'musauvincent76-source',
    endpoints: ['/pair', '/sessions', '/']
  });
});

// Sessions folder
if (!fs.existsSync('./sessions')) {
  fs.mkdirSync('./sessions');
}

app.get('/sessions', (req, res) => {
  const files = fs.readdirSync('./sessions');
  res.json({ total: files.length, sessions: files });
});

// Pairing API - hii ndio website yako itaita
app.get('/pair', (req, res) => {
  res.json({ 
    message: 'Use POST with { number: 2547... }',
    example: 'POST /pair { "number": "254703182307" }'
  });
});

app.post('/pair', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required e.g 254703182307' });
  
  try {
    const { default: makeWASocket, useMultiFileAuthState } = await import('@whiskeysockets/baileys');
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${number}`);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'silent', child: () => ({ level: 'silent' }) }
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number.replace(/[^0-9]/g,''));
      console.log(`Pair code for ${number}: ${code}`);
      return res.json({ pairCode: code, number });
    } else {
      return res.json({ message: 'Already paired', number });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Engineer Board running on ${PORT}`));

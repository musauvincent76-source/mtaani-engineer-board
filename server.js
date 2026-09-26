const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/pair', async (req,res)=>{
  try{
    const { number } = req.body;
    // Simple mock for now - Baileys pairing itaongezwa
    const code = Math.random().toString(36).substring(2,6).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase();
    console.log('Pair request for', number, 'Code:', code);
    res.json({ code: code, message: 'Code generated' });
  }catch(e){
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Mtaani running on', PORT));

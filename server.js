const express=require('express');
const path=require('path');
const app=express();
app.use(express.json());
app.use(express.static('public'));
app.get('/',(req,res)=>{
res.sendFile(path.join(__dirname,'public','index.html'));
});
app.post('/pair',(req,res)=>{
let a=Math.floor(1000+Math.random()*9000);
let b=Math.floor(1000+Math.random()*9000);
res.json({code:a+'-'+b});
});
app.listen(10000);

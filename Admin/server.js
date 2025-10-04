require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.static('public'));
app.get('/health', (_,res)=>res.json({ok:true}));

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`ADMIN running on ${PORT}`));

const express=require('express')
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const multer=require('multer')

const  route  = require('./routes/route')

const app=express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(multer().any())
app.use('/',route)

const url="mongodb+srv://Deependra1999:Z1ZWVlMvcAFQsu2u@cluster0.4nkid.mongodb.net/project_05"

mongoose.connect(url,{useNewUrlParser:true})
.then(()=>console.log("mongoose is connected successfully...."))
.catch(err=>console.log(err))

app.listen(3000,()=>console.log("running on prot 3000"))
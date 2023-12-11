const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()
const mongoose = require('mongoose')
const bodyparser= require('body-parser')
const bcrypt = require("bcryptjs")
const session  = require("express-session")
const auth = require("../Hotel Management/auth/auth")
mongoose.connect('mongodb://127.0.0.1:27017/hotel', {useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 30000})
const port = 3000

// NEW SCHEMA
const hotelSchema = new mongoose.Schema({
    name: {type: String, required:true},
    phone : {type: Number, required:true, unique:true}, 
    email : {type: String, required:true, unique:true},
    number : {type: Number, required:true},
    room : {type: Number, required:true},
    date : {type: Date, required:true},
    ldate : {type: Date, required:true},
    pass : {type: String, required:true},
    con_pass : {type: String}
})

const tempSchema = new mongoose.Schema({
    name: {type: String, required:true},
    phone : {type: Number, required:true,}, 
    email : {type: String, required:true,},
    number : {type: Number, required:true},
    room : {type: Number, required:true},
    date : {type: Date, required:true},
    ldate : {type: Date, required:true},
    pass : {type: String, required:true},
    con_pass : {type: String}
})

const staffSchema = new mongoose.Schema({
    name : {type: String},
    email : {type: String},
    dob : {type: Date},
    pass : {type: String}
})

const foodSchema = new mongoose.Schema({
    room : {type: Number},
    email : {type: String},
    starters : {type: String},
    main_course : {type: String},
    desserts: {type: String},
    extras: {type: String},
    status: {type: String}
})

const serviceSchema = new mongoose.Schema({
    room : {type: Number},
    email : {type: String},
    date : {type: Date}
})

const complainSchema = new mongoose.Schema({
    room : {type: Number},
    email : {type: String},
    complain : {type: String}
})


// MODELLING THE SCHEMA
const customer = mongoose.model('customer', hotelSchema)
const tempCustomer = mongoose.model('tempcustomer', tempSchema)
const staff = mongoose.model('staff', staffSchema)
const order = mongoose.model('order', foodSchema)
const service = mongoose.model('service', serviceSchema)
const complain = mongoose.model('complain', complainSchema)

// EXPRESS SPECIFIC STUFF
app.use('/static', express.static('static'))
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: '123-456-789',
    resave: false,
    saveUninitialized: true
}))


// SETTING UP THE TEMPLATE ENGINE
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))


// HANDLING REQUESTS
app.get('/', (req, res)=>{
    res.status(200).render('home.pug')
})

app.get('/contact', (req, res)=>{
    res.status(200).render('contact.pug')
})

app.get('/about-us', (req, res)=>{
    res.status(200).render('about_us.pug')
})

app.get('/check-in', auth.isLogin ,(req, res)=>{
    res.status(200).render('index.pug')
})

app.get('/login' , (req,res)=>{
    res.status(200).render('login.pug')
})

app.get('/cust-login',(req,res)=>{
    res.status(200).render('cust-login.pug')
})

app.get('/complain', auth.userLogin , async (req,res)=>{
    const id = req.session.user_id
    const det = await tempCustomer.findOne({ email : id})
    if(det){
        res.status(200).render('complain.pug', { det })
    }
    else{
        console.log(det)
    }
})

app.post('/complain', auth.userLogin, (req,res)=>{
    var newComplain = new complain(req.body)
    console.log(newComplain)
    newComplain.save().then(()=>{
        res.status(200).redirect('/services')
    }).catch(()=>{
        res.status(200).send("Go Back and File the complain again")
    })
})

app.get('/staff-login', (req,res)=>{
    res.status(200).render('staff-login.pug')
})

app.get('/staff-page', auth.isLogin, (req,res)=>{
    res.status(200).render('staff-page.pug')
})

app.get('/services', auth.userLogin, (req, res)=>{
    res.status(200).render('services.pug')
})

app.get('/cust-details', auth.userLogin, async (req,res)=>{
    const id = req.session.user_id
    const detail = await tempCustomer.findOne({email : id})
    // console.log(detail)
    res.render('cust-details.pug', { detail })
})

app.get('/food', auth.userLogin, async(req,res)=>{
    const id = req.session.user_id
    const det = await tempCustomer.findOne({ email : id})
    console.log(det)
    res.status(200).render('food.pug', { det })
})

app.post('/food', auth.userLogin, async (req, res)=>{
    var foodData = new order(req.body)
    console.log(foodData)
    foodData.save().then(()=>{
        res.status(200).redirect('/food')
    }).catch(()=>{
        res.status(500).send("Data Cannot Be saved")
    })
})

app.get('/your-orders', auth.userLogin, async(req, res)=>{
    const id = req.session.user_id
    const det = await order.find({ email : id })
    res.status(200).render('your-order.pug', { dets : det })
})

app.get('/room-service', auth.userLogin, async (req,res)=>{
    const id = req.session.user_id
    const det = await tempCustomer.findOne({ email : id })
    res.status(200).render("room-service.pug",{ det })
})

app.post('/room-service', auth.userLogin, async (req,res)=>{
    var serviceData = new service(req.body)
    serviceData.save().then(()=>{
        res.redirect('/room-service')
    }).catch(()=>{
        res.send("Service Data Cannot be Saved")
    })
})

app.get('/service-history', auth.userLogin, async(req,res)=>{
    const id = req.session.user_id
    const det = await service.find({ email : id })
    res.status(200).render('rs-history.pug', { dets : det })
})

app.get('/service-req', auth.isLogin, async (req, res)=>{
    const det = await order.find()
    const rs = await service.find()
    res.status(200).render('serviceReq.pug', { dets : det , rss : rs})
})

app.post('/service-req/:id', auth.isLogin, async(req,res)=>{
    const deleteID = req.params.id
    console.log(deleteID)
    try{
        let id = await order.findOne({ email : deleteID})
        console.log(id)
        if(id){
            const deletereq = await order.findOneAndDelete({ email : deleteID })
            console.log(deletereq)
            res.status(200).redirect('/service-req')
        }
        else{
            id = await service.findOne({ date : deleteID})
            if(id){
                const deletereq = await service.findOneAndDelete({ date : deleteID})
                res.status(200).redirect('/service-req')
            }
        }

    }catch(error){
        console.log(error)
    }
})

app.get('/records', auth.isLogin, async(req,res)=>{
    const result = await customer.find()
    res.status(200).render('allRecords.pug', {
        results : result
    })
})

app.get('/customers',auth.isLogin ,async (req,res)=>{
    const tempResult = await tempCustomer.find();
    res.status(200).render('customers.pug',{
        tempResults : tempResult
    })
})

app.get('/logout', auth.isLogin, async (req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/login')
        
    } catch (error) {
        console.log(error.message)
    }
})

app.get('/userLogout', auth.userLogin, (req,res)=>{
    try {
            req.session.destroy();
            res.redirect('/cust-login')
    } catch (error) {
        console.log(error.message)
    }
})

app.get('/staffLogout', auth.isLogin, (req,res)=>{
    try{
        req.session.destroy();
        res.redirect('/staff-login')
    } catch(error){
        console.log(error)
    }
})

app.post('/staff-login', async (req,res)=>{
    const email = req.body.email
    const pass = req.body.password

    const staff_mail = await staff.findOne({email:email})
    
    if(pass === staff_mail.pass){
        req.session.staff_id = staff_mail._id
        if(auth.isLogin){
            res.status(200).render('staff-page.pug')
        }
    }
    else{
        res.status(200).redirect('/staff-login')
    }
})

app.post('/check-in', auth.isLogin, async (req, res)=>{
    const pass = req.body.pass
    req.body.pass = await bcrypt.hash(pass, 10)
    const con_pass = req.body.con_pass

    if(pass === con_pass){

        req.body.con_pass = ''

        var myData = new customer(req.body)
        myData.save().then(()=>{
            res.status(200).redirect('/check-in')
        }).catch(()=>{
            res.status(500).send("Data cannot be saved")
        })

        var tempData = new tempCustomer(req.body)
        tempData.save().then(()=>{
            console.log("Data is saved in temp")
        }).catch((error)=>{
            console.error(error)
        })
    }
    else{
        res.send("Passwords are not matching")
    }
})
    
app.post('/cust-login', async (req,res)=>{
    try {
        const email = req.body.username
        console.log(email)
        const password = req.body.password
        console.log(password)
        
        const custEmail = await customer.findOne({email:email})
        console.log(custEmail.email)
        const passMatch = await bcrypt.compare(password,custEmail.pass)

        if(custEmail){    
            if(passMatch){
                req.session.user_id = custEmail.email
                res.redirect('/services')
            }
            else{
                res.status(200).redirect('/cust-login')
            }
        }
        else{
            res.send("Email does not exist")
        }
        
    } catch (error) {
        console.log(error.message)
    }
})

app.post('/customers/:id', auth.isLogin, async (req, res)=>{
    const customerId = req.params.id

    try{
        const deleteCustomer = await tempCustomer.findByIdAndDelete(customerId)
        if(deleteCustomer){
            console.log("Customer Deleted:", deleteCustomer)
            // res.json({success:true, message:'Customer Deleted'})
            res.status(200).redirect('/customers')
        }else{
            console.log('Customer not found')
            res.json({ success: false, message: 'Customer not found' })
        }
    }catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'Error deleting customer' })
    }
})

app.get('/complaints', auth.isLogin,async(req, res)=>{
    const com = await complain.find()
    if(com){
        res.render('complain-pull.pug', { coms : com})
    }  
})


// LISTENING
app.listen(port, ()=>{
    console.log(`Listening on port ${port}`)
})

module.exports = {customer, tempCustomer};
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const keys = require("./config/keys.js");
const path=require("path");
const uniqid = require("uniqid");
var QRCode = require('qrcode');
var nodemailer = require('nodemailer');

//middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//ejs
app.set("view engine","ejs");

//static files
app.use("/public",express.static(path.join(__dirname,"public")));

//db connection
var db = mysql.createConnection({
    host:'localhost',
    user:keys.localdb.username,
    password:keys.localdb.password,
    database:'courier'
});

db.connect(function (err){
    if(err) throw err;
    console.log("Connected"); 
});

app.get("/",(req,res)=>{
    res.render("company");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/verify",(req,res)=>{
    var q = "select * from admin where email="+mysql.escape(req.body.email);
    db.query(q,(err,result)=>{
        if(err) throw err;
        if(result[0]){
            if(req.body.password === result[0].password){
                res.redirect("adminAccess");
            }
            else{
                res.send("Incorrect Password");
            }
        }else{
            res.send("Email not registered as Admin");
        }
    })
});

app.get("/adminAccess",(req,res)=>{
    let q = "select * from user";
    db.query(q,(err,result)=>{
        if(err) throw err;
        res.render("adminAccess",{users:result});
    })
});

app.get("/delete/:email",(req,res)=>{
    let email = req.params.email;
    let q ="delete from user where email="+mysql.escape(email);
    db.query(q,(err,rows,fields)=>{
        if(err) throw err;
        res.redirect("/adminAccess");
    })
})

app.post("/add",(req,res)=>{
    var q = "insert into user values("+mysql.escape(req.body.name)+","+mysql.escape(req.body.phone)+","+mysql.escape(req.body.address)+","+mysql.escape(req.body.branch)+","
            +mysql.escape(req.body.email)+","+mysql.escape(req.body.password)+");";
    db.query(q,(err,rows,fields)=>{
        if(err) throw err;
        res.redirect("success");
    })
});

app.get("/success",(req,res)=>{
    res.render("success");
});

app.get("/statusUpdate",(req,res)=>{
    res.render("statusUpdate");
});

app.post("/verifyUser",(req,res)=>{
    var q = "select * from user where email="+mysql.escape(req.body.email);
    db.query(q,(err,result)=>{
        if(err) throw err;
        if(result[0]){
            if(req.body.password === result[0].password){
                var branch= result[0].branch;
                res.redirect("/options/"+branch);
                //res.redirect("packageUpdate/"+branch);
            }
            else{
                res.send("Incorrect Password");
            }
        }else{
            res.send("Email not registered");
        }
    })
});

app.get("/packageUpdate/:branch",(req,res)=>{
    var cv = req.params.branch;
    res.render("packageUpdate",{details:null,cookie_value:cv});
});

app.get("/options/:branch",(req,res)=>{
    var b = req.params.branch;
    res.render("options",{branch:b});
});

app.get("/addPackage",(req,res)=>{
    res.render("addPackage");
});

app.post("/addPackage",(req,res)=>{
    var id = uniqid();
    var qrcode;
    QRCode.toDataURL(id, function (err, url) {
        qrcode=url;
        let q = "insert into orderDetails values("+
        mysql.escape(id)+","+
        mysql.escape(req.body.clientName)+","+
        mysql.escape(req.body.source)+","+
        mysql.escape(req.body.destination)+","+mysql.escape(req.body.source)+","+
        mysql.escape(req.body.priority)+","+
        mysql.escape(req.body.estimated_time)+","+
        mysql.escape(qrcode)+","+mysql.escape(req.body.email)+");"
        db.query(q,(err,rows,fields)=>{
            if(err) throw err;
            res.send({mssg:"Courier request placed",id});
        });
      });
});

app.get("/pdf/:id",(req,res)=>{
    var id = req.params.id;
    let q = "select * from orderDetails where orderId="+mysql.escape(id);
    db.query(q,(err,result)=>{
        if(err) throw err;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: keys.email.user,
              pass: keys.email.password
            }
          });
          
          var mailOptions = {
            from: keys.email.user,
            to: result[0].email,
            subject: 'Order Placed',
            text: "Your Tracking id is"+result[0].orderId
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        res.render("pdf",{details:result[0]});
    });
});

app.post("/fetch",(req,res)=>{
    var orderId = req.body.orderId;
    var q = "select * from orderDetails where orderId="+orderId;
    db.query(q,(err,result)=>{
        if(err) throw err;
        if(result[0]){
            res.render("packageUpdate",{details:result[0],cookie_value:null});
        }else{
            res.send("Incorrect ID");
        }
    });
});

app.get("/map",(req,res)=>{
    res.render("map");
});

app.post("/confirmUpdate",(req,res)=>{
    let q = "update orderDetails set destination="+mysql.escape(req.body.destination)+",current_location="+mysql.escape(req.body.current_location)+",priority="+mysql.escape(req.body.priority)+",estimated_time="+mysql.escape(req.body.estimated_time1)+" where orderId ="+mysql.escape(req.body.oid)+";";
    console.log(q);
    db.query(q,(err,rows,fields)=>{
        if(err) throw err;
        res.render("packageUpdate",{details:null,cookie_value:null});
    });
});

app.get("/qr",(req,res)=>{
    res.render("scanqr");
});

app.get("/addOrderId/:id",(req,res)=>{
    var orderId = req.params.id;
    var q = "select * from orderDetails where orderId="+mysql.escape(orderId);
    db.query(q,(err,result)=>{
        if(err) throw err;
        if(result[0]){
            res.render("packageUpdate",{details:result[0],cookie_value:null});
        }else{
            res.send("Incorrect ID");
        }
    });
});

app.get("/tracking/:id",(req,res)=>{
    var id = req.params.id;
    let q = "select current_location,destination from orderDetails where orderId="+mysql.escape(id);
    db.query(q,(err,result)=>{
        if(result[0]){
            res.send(result[0]);
        }else{
            res.send("Invalid");
        }
    });
});

app.listen(3000,function(){
    console.log("Listening on 3000...");
});

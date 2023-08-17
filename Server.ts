
import express from 'express';
import  cors from 'cors';
import path from 'path';
// import { API } from 'ejabberd-api'; 
import { v4 as uuidv4 } from 'uuid'
import Uuid from 'uuid'
// import {client} from './dbconnect/pgdbconnect';
import {sendmail} from './Mailer';
import  {Client} from 'pg';
import md5 from 'md5';
const PORT:any =process.env.PORT || 5876;
const app:any = express();
app.use(express.static(path.join(__dirname, 'public')));
 //---use----------------------------------------
app.use(express.json());
app.use(cors())
const client:Client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'chattbackend',
    password: '1234',
    port: 5432,
  })
const connect:any = async()=>{   
     try {  
        await client.connect();
               console.log("postgres database connected succesfully") 
      
   } catch(err:any) { 
       console.error(err) 
   } 
}
connect()
function generateRandomSixDigitNumber() {
    const min = 100000; // Smallest 6-digit number
    const max = 999999; // Largest 6-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
app.post('/api/user/insert',(req:any,res:any)=>{
    
    const data:any= req.body;

      const email:string=data.email;
    const name:string = data.name; 
    const  date_of_birth:string = data.date_of_birth;
    const  gender:String=data.gender;
    const  profile_picture:string=data.profile_picture;
    const  is_verified:boolean =false;
    const otp:Number=generateRandomSixDigitNumber();
  const userid=uuidv4();
      const salt =  (Math.random() + 1).toString(36).substring(7);
      const password_hash:string =md5(data.password_hash+salt)
     
      const query:any = {
        text:  `SELECT * FROM users	 
       WHERE email =$1`,  
        values : [email] }
 
      client.query(query).then((data:any)=>{ 
                  
              if (data.rows.length>0) {     
                res.send({status:"emailalreadyexists", message:"email already exists"})
                console.log({status:"failed", message:"email already exists"})
              }else{
                const queryData:any = {
                  text: `INSERT INTO users (email,password_hash,name,date_of_birth,gender,profile_picture,is_verified,useruid,salt,otp)
                                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                values: [email,password_hash,name,date_of_birth,gender,profile_picture,is_verified,salt,userid,otp],
                }
            
                client.query(queryData).then((res:any)=>{ 
                        sendmail(email,otp)
                    res.send({status:true, message:"insert successfully done"})
               
       }).catch((error:any) =>{ 
        console.log({status: false,message:error.message})
        res.send({status: false,message:"insert  failed"}) 
               
           
          
          })

        }
    })
});


app.post('/api/user/login',(req:any,res:any)=>{
    
    const body:any= req.body; 
    const email:string =body.email;
    const password:string = body.password_hash;
    
    const query:any = {
      text:  `SELECT * FROM users	 
     WHERE email =$1`,
      values : [email] }

    client.query(query).then((data:any)=>{ 
         const userData:any = data.rows[0];
    
          const salt:string =userData.salt;
          const passwordh:string =md5(password+salt)
              
            if (passwordh === userData.password_hash) {
            //    const tokenData:any ={useruid:userData.useruid,username:userData.username,companyname:userData.companyname,companyuid:userData.companyuid,type:userData.type,email: userData.email };
            //  const token = jwt.sign(tokenData,secretkey,{expiresIn:'3h'})
            
              
              // res.send({token:token,status:"success",message:"login successful",type:userData.type,username:userData.username })

            //   res.send({status:"success",message:"login successful",type:userData.type,username:userData.username })

            //   console.log({ status:"success",message:"login successful" })
            res.send({status:"success",message:"login successful"})

            } else { 
              res.send({status:"Incorrect",message:"failed"})
              console.log({status: "Incorrect",message:"failed"}) 
            }
              
     }).catch((error:any) =>{ 
      res.send({status: "notfound",message:"failed"})
      console.log({status: "notfound",message:error.message})
     }) 
    
     
               
 })
app.post('/api/verifyotp',(req:any, res:any) =>{
    const verifyotp=req.body.otp
    const email=req.body.email
    const qry={
        text:'SELECT * from users WHERE email=$1 RETURNING',
        values:[email]
    }
     client.query(qry).then((resp:any)=>{
        const checkotp=resp.otp
        if(checkotp===verifyotp){
            resp.is_verified=true;
            res.send({success:true,message:"Verified "})
        }
        else{
            res.send({success:false,message:"Verification Failed"})
        }
     })
})

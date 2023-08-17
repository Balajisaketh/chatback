"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
// import { API } from 'ejabberd-api'; 
const uuid_1 = require("uuid");
// import {client} from './dbconnect/pgdbconnect';
const Mailer_1 = require("./Mailer");
const pg_1 = require("pg");
const md5_1 = __importDefault(require("md5"));
const PORT = process.env.PORT || 5876;
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
//---use----------------------------------------
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const client = new pg_1.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'chattbackend',
    password: '1234',
    port: 5432,
});
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect();
        console.log("postgres database connected succesfully");
    }
    catch (err) {
        console.error(err);
    }
});
connect();
function generateRandomSixDigitNumber() {
    const min = 100000; // Smallest 6-digit number
    const max = 999999; // Largest 6-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
app.post('/api/user/insert', (req, res) => {
    const data = req.body;
    const email = data.email;
    const name = data.name;
    const date_of_birth = data.date_of_birth;
    const gender = data.gender;
    const profile_picture = data.profile_picture;
    const is_verified = false;
    const otp = generateRandomSixDigitNumber();
    const userid = (0, uuid_1.v4)();
    const salt = (Math.random() + 1).toString(36).substring(7);
    const password_hash = (0, md5_1.default)(data.password_hash + salt);
    const query = {
        text: `SELECT * FROM users	 
       WHERE email =$1`,
        values: [email]
    };
    client.query(query).then((data) => {
        if (data.rows.length > 0) {
            res.send({ status: "emailalreadyexists", message: "email already exists" });
            console.log({ status: "failed", message: "email already exists" });
        }
        else {
            const queryData = {
                text: `INSERT INTO users (email,password_hash,name,date_of_birth,gender,profile_picture,is_verified,useruid,salt,otp)
                                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                values: [email, password_hash, name, date_of_birth, gender, profile_picture, is_verified, salt, userid, otp],
            };
            client.query(queryData).then((res) => {
                (0, Mailer_1.sendmail)(email, otp);
                res.send({ status: true, message: "insert successfully done" });
            }).catch((error) => {
                console.log({ status: false, message: error.message });
                res.send({ status: false, message: "insert  failed" });
            });
        }
    });
});
app.post('/api/user/login', (req, res) => {
    const body = req.body;
    const email = body.email;
    const password = body.password_hash;
    const query = {
        text: `SELECT * FROM users	 
     WHERE email =$1`,
        values: [email]
    };
    client.query(query).then((data) => {
        const userData = data.rows[0];
        const salt = userData.salt;
        const passwordh = (0, md5_1.default)(password + salt);
        if (passwordh === userData.password_hash) {
            //    const tokenData:any ={useruid:userData.useruid,username:userData.username,companyname:userData.companyname,companyuid:userData.companyuid,type:userData.type,email: userData.email };
            //  const token = jwt.sign(tokenData,secretkey,{expiresIn:'3h'})
            // res.send({token:token,status:"success",message:"login successful",type:userData.type,username:userData.username })
            //   res.send({status:"success",message:"login successful",type:userData.type,username:userData.username })
            //   console.log({ status:"success",message:"login successful" })
            res.send({ status: "success", message: "login successful" });
        }
        else {
            res.send({ status: "Incorrect", message: "failed" });
            console.log({ status: "Incorrect", message: "failed" });
        }
    }).catch((error) => {
        res.send({ status: "notfound", message: "failed" });
        console.log({ status: "notfound", message: error.message });
    });
});
app.post('/api/verifyotp', (req, res) => {
    const verifyotp = req.body.otp;
    const email = req.body.email;
    const qry = {
        text: 'SELECT * from users WHERE email=$1 RETURNING',
        values: [email]
    };
    client.query(qry).then((resp) => {
        const checkotp = resp.otp;
        if (checkotp === verifyotp) {
            resp.is_verified = true;
            res.send({ success: true, message: "Verified " });
        }
        else {
            res.send({ success: false, message: "Verification Failed" });
        }
    });
});

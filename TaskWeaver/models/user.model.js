import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    profile_picture:{
        type:String,
        required:false
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user',
        required:true
    },
    
    skills:{
        type:[String],
        default:[],
        required:true
    },
    department:{ 
        type:String,
        enum:['HR','Engineering','Marketing','Sales','Finance','Operations','IT','Customer Support'],
        required:true
    },
    position:{
        type:String,
        required:true
    },
    DateOfJoining:{
        type:Date,
        required:true
    },
},{timestamps:true});

userSchema.index({role:1});
userSchema.index({department:1});

const user=mongoose.model('User',userSchema);


export default user;
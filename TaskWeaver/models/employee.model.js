import mongoose from "mongoose";

const employeeSchema=new mongoose.Schema({
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
    employeename:{
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
        enum:['employee','admin'],
        default:'employee',
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

employeeSchema.index({role:1});
employeeSchema.index({department:1});

const employee=mongoose.model('Employee',employeeSchema);


export default employee;
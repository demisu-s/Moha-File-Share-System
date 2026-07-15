import dotenv from "dotenv";
import app from "./app";
import db from "./config/database";


dotenv.config();


const PORT = process.env.PORT || 5000;


async function startServer(){

    try{

        await db.query("SELECT 1");

        console.log("✅ MySQL Connected");


        app.listen(PORT,()=>{
            console.log(`🚀 Server running on port ${PORT}`);
        });


    }catch(error){

        console.log("Database connection failed",error);

    }

}


startServer();
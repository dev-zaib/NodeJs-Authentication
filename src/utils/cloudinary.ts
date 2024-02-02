import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
                    
cloudinary.config({ 
  cloud_name: 'dgczzwzkf', 
  api_key: '172192775255772', 
  api_secret: 'eXUxWJXRSPty1Cn_BCI2drYtmVU' 
});

const uploadOnCloudinary= async (localFilePath: string)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.error('Error uploading file:', error);
    }
}

export {uploadOnCloudinary}
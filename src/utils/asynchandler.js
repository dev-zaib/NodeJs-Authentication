const asyncHandler = (requestHandler)=>{
    (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).catch((error)=>next(error))
    }
}
export {asyncHandler}
// const asyncHandler = (func) =>{
//     async (req, res, next)=>{
//         try{
//             await func(req, res, next)
//         }catch(error){
//             res.status(err.code || 500).json({
//                 success: true,
//                 message: err.message
//             })
//         }
//     }
// }
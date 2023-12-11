const isLogin = (req, res, next)=>{
    try {
        if(req.session.staff_id){
            next()
        }
        else{
            res.redirect('/staff-login')
        }
    } catch (error) {
        console.log(error)
    }
}

const userLogin = (req,res,next)=>{
    try {
        if(req.session.user_id){
            next()
        }
        else{
            res.redirect('/cust-login')
        }
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    isLogin,
    userLogin
}
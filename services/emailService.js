const axios = require("axios");
const AppError = require("../utils/appError");


// TODO: - add a function for nodemailer as well
exports.sendEmailViaSendgrid = async (email, data, templateId) => {
    try {
        var request = {
            "from": {
                "email": "demirtasdurmus@gmail.com"
            },
            "reply_to": {
                "email": "demirtasdurmus@gmail.com"
            },
            "personalizations": [
                {
                    "to": [
                        {
                            "email": email
                        }
                    ],
                    "dynamic_template_data": data
                }
            ],
            "template_id": templateId
        };

        await axios.post("https://api.sendgrid.com/v3/mail/send", request,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
                }
            })
        return true;
    } catch (err) {
        console.log(err);
        throw new AppError(500, err.message, err.name, false, err.stack);
    }
};
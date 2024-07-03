const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: 'smtp.gmail.com',
    auth: {
      user: 'hello@thisismdex.com',
      pass: 'unkdjlqgwsukmskt',
    },
    secure: true,
  });

  const mailData = {
    from: 'hello@thisismdex.com',
    to,
    subject,
    text,
  };

  return new Promise((resolve, reject) =>
    transporter.sendMail(mailData, async function (err, info) {
      if (err) {
        console.log(err);
        console.log('error=======');
        reject(err);
      } else {
        resolve(true);
      }
    }),
  );
};

module.exports = {
  sendEmail,
}
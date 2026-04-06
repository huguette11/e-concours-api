import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: true, // true pour port 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur SMTP:', error);
  } else {
    console.log('Serveur SMTP prêt ');
  }
});

export const sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}
export const sendMailContact = async ({ to, subject, html, email }) => {
  return transporter.sendMail({
    from: `"Mon Site Contact" <${process.env.MAIL_USER}>`,
    to,
    subject: `Message de ${email} - ${subject}`,
    html,
    replyTo: email,
  });

  
};
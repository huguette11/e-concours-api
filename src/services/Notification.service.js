import crypto from 'crypto';
import { sendMail } from '../config/mailer.js';
import { error } from 'console';
import { OrangeApi } from '../api/Orange.api.js';
export class NotificationService {

  constructor(email = null, telephone = null) {
    this.email = email;
    this.telephone = telephone;
    this.longueur = 6;
  }

  genererOtp() {
    return crypto.randomInt(0, Math.pow(10, this.longueur)).toString().padStart(this.longueur, '0');
  }



async envoyerOtpEmail(otp) {
  if (!this.email) throw new Error('Email non défini');

  await sendMail({
    to: this.email,
    subject: 'Votre code de vérification',
    html: `
      <h2>Code de vérification</h2>
      <p>Votre code OTP est : <strong>${otp}</strong></p>
      <p>Ce code expire dans 10 minutes.</p>
    `
  });
}

async envoyerOtpTelephone (otp) {
  if(!this.telephone) throw new Error('numero de telephone non definis');

  const ApiConnect = new OrangeApi(this.telephone);
  const rep = await  ApiConnect.SendOtp({otp});

  console.log(rep);
}
  

}
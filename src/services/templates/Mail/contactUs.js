export const contactTemplate = ({ nom, email, message }) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background:#EF2B2D; color:#fff; padding:20px; text-align:center;">
        <h2 style="margin:0; display:flex; align-items:center; justify-content:center;">
          <img src="https://img.icons8.com/ios-filled/24/ffffff/new-post.png" alt="Mail" style="margin-right:8px;"/>
          Nouveau message de contact
        </h2>
      </div>

      <!-- Bande décorative -->
      <div style="display:flex; height:5px;">
        <div style="flex:1; background:#EF2B2D;"></div>
        <div style="flex:1; background:#FCD116;"></div>
        <div style="flex:1; background:#009E49;"></div>
      </div>

      <!-- Body -->
      <div style="padding:20px; color:#333;">
        <p style="display:flex; align-items:center;">
          <img src="https://img.icons8.com/ios-filled/20/009E49/user.png" style="margin-right:6px;" alt="Nom"/>
          <strong>Nom :</strong> ${nom}
        </p>

        <p style="display:flex; align-items:center;">
          <img src="https://img.icons8.com/ios-filled/20/009E49/new-post.png" style="margin-right:6px;" alt="Email"/>
          <strong>Email :</strong> ${email}
        </p>

        <div style="margin-top:20px;">
          <p style="display:flex; align-items:center;">
            <img src="https://img.icons8.com/ios-filled/20/009E49/chat.png" style="margin-right:6px;" alt="Message"/>
            <strong>Message :</strong>
          </p>
          <div style="background:#f8f9fa; padding:15px; border-radius:8px; border-left:5px solid #009E49;">
            ${message}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#009E49; padding:15px; text-align:center; font-size:12px; color:#fff;">
        <img src="https://img.icons8.com/ios-filled/12/ffffff/flag.png" alt="BF" style="margin-right:4px;"/>
        Message envoyé depuis ton site - Burkina Faso
      </div>

    </div>
  </div>
  `;
};
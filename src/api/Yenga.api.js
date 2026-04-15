export class YengaPay {

  constructor({ title, description, price, reference, redirectUrl }) {
    this.title       = title;
    this.description = description;
    this.price       = price;
    this.reference   = reference;
    this.redirectUrl = redirectUrl; 
  }

  BuildInscData() {
    return {
      title:       this.title,
      description: this.description,
      price:       this.price,
    };
  }

async YengaPayPayment() {
  const article = this.BuildInscData();

  const url = `${process.env.YengaUrl}/${process.env.organization_id}/payment-intent/${process.env.project_id}`;
  // console.log("URL:", url); // debug

  const pay = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key":    process.env.yengapikey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentAmount: Number(this.price),
      reference:     this.reference,
      articles:      [article],
      redirectUrl:   this.redirectUrl,
      apiEnv:        process.env.YENGA_ENV ?? "test",
    }),
  });

  const data = await pay.json();

  if (!pay.ok) {
    // console.error("YengaPay error:", data); 
    // console.log([article])
    throw new Error(data?.message || "Erreur YengaPay");
  }

  return {
    paymentId:      data.id,
    payment_url:    data.checkoutPageUrlWithPaymentToken,
    payment_status: data.status,
    reference:      this.reference,
    data,
  };
}
  async VerifiePaiement(paymentId) {
    const url = `${process.env.YengaUrl}/${process.env.organization_id}/payment-intent/${process.env.project_id}/${paymentId}`;

    const response = await fetch(url, {
      method:  "GET",
      headers: { "x-api-key": process.env.yengapikey },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Erreur lors de la vérification");
    }

    return data; 
  }
}
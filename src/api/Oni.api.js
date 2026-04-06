export class OniApi {
  async verifyIdentity({ numCnib }) {
    console.log(typeof numCnib);
    
    try {
      const response = await fetch(process.env.ONIAPI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_KEY}`,
        },
        body: JSON.stringify({ numCnib }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: true,
          code: response.status,
          success: false,
          message: "une erreur est survenue",
          data: [],
        };
      }

      return {
        error: false,
        code: 200,
        success: true,
        message: "donneer recuperer",
        data,
      };
    } catch (err) {
      console.error("Erreur réseau ou inattendue :", err);
      return {
        error: true,
        code: 500,
        success: false,
        message: "Erreur interne : " + err.message,
        data: [],
      };
    }
  }
}

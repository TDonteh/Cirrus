export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle NOWPayments checkout creation
    if (url.pathname === "/api/create-charge" && request.method === "POST") {
      try {
        const body = await request.json();

        const { items, total, name, email } = body;

        if (!total || !name || !email) {
          return Response.json(
            { error: "Missing checkout information." },
            { status: 400 }
          );
        }

        const orderId = `CIRRUS-${Date.now()}`;

        const response = await fetch(
          "https://api.nowpayments.io/v1/invoice",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.NOWPAYMENTS_API_KEY
            },
            body: JSON.stringify({
              price_amount: Number(total),
              price_currency: "usd",
              order_id: orderId,
              order_description: `Cirrus order for ${name}`,
              ipn_callback_url: "https://bittpulse.store/api/nowpayments-ipn",
              success_url: "https://bittpulse.store/",
              cancel_url: "https://bittpulse.store/"
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json(
            {
              error:
                data.message ||
                data.error ||
                "NOWPayments could not create the payment."
            },
            { status: response.status }
          );
        }

        return Response.json({
          hosted_url: data.invoice_url
        });
      } catch (error) {
        return Response.json(
          {
            error: error.message || "Could not start payment."
          },
          { status: 500 }
        );
      }
    }

    // Let normal website files be served by Cloudflare
    return env.ASSETS.fetch(request);
  }
};
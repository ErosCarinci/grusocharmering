require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static("client"));

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const storeItems = new Map([
  [1,  {priceInCents: 50000, name: "Grus"}],
  [2,  {priceInCents: 100000, name: "Armering"}],
  [3,  {priceInCents: 100000, name: "Sand"}],
  ["inside_delivery", { priceInCents: 200000, name: "Inne i Stockholm" }],
  ["outside_delivery", { priceInCents: 500000, name: "Utanför Stockholm" }],
]);


app.get("/get-store-items", (req, res) => {
  res.json(Array.from(storeItems.entries()));
});


app.post("/create-checkout-session", async (req, res) => {
  try {
    const lineItems = req.body.items.map(item => {
      const storeItem = storeItems.get(item.id);
      return {
        price_data: {
          currency: "sek",
          product_data: {
            name: storeItem.name,
          },
          unit_amount: storeItem.priceInCents,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/products.html`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

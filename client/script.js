document.addEventListener("DOMContentLoaded", () => {
  const addToCartButton = document.getElementById("add-to-cart-button");
  const checkoutButton = document.getElementById("checkout-button");
  const cartInfo = document.getElementById("cart-info");

  let cartItems = [];
  let storeItemsMap = new Map(); // To store the fetched storeItems

  // Fetch storeItems data from the server
  fetch("/get-store-items")
    .then(response => response.json())
    .then(data => {
      storeItemsMap = new Map(data);

      addToCartButton.addEventListener("click", () => {
        const product1Quantity = parseInt(document.getElementById("product1")?.value);
        const product2Quantity = parseInt(document.getElementById("product2")?.value);
        const product3Quantity = parseInt(document.getElementById("product3")?.value);
    
        const deliveryOption = document.getElementById("delivery-option").value;
    
        cartItems = [];
    
        if (product1Quantity > 0) {
            cartItems.push({ id: 1, quantity: product1Quantity });
        }
        if (product2Quantity > 0) {
            cartItems.push({ id: 2, quantity: product2Quantity });
        }
        if (product3Quantity > 0) {
            cartItems.push({ id: 3, quantity: product3Quantity });
        }
    
        if (deliveryOption === "inside") {
            cartItems.push({ id: "inside_delivery", quantity: 1 });
        } else if (deliveryOption === "outside") {
            cartItems.push({ id: "outside_delivery", quantity: 1 });
        }
    
        updateCartInfo();
    });
    

      checkoutButton.addEventListener("click", () => {
        const lineItems = cartItems.map(item => {
          const storeItem = storeItemsMap.get(item.id);
          if (!storeItem) {
            console.error(`Store item with id ${item.id} not found.`);
            return null; // Return null for items not found
          }
          console.log("storeItem:", storeItem);
          return {
            id: item.id,
            quantity: item.quantity,
          };
        });

        // Filter out null items (items not found) from the lineItems array
        const filteredLineItems = lineItems.filter(item => item !== null);

        console.log("filteredLineItems:", filteredLineItems);

        fetch("/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: filteredLineItems }), // Include the updated line items array
        })
          .then((res) => {
            if (res.ok) return res.json();
            return res.json().then((json) => Promise.reject(json));
          })
          .then(({ url }) => {
            window.location = url;
          })
          .catch((e) => {
            console.error(e.error);
          });
      });

      updateCartInfo(); // Initial update after fetching storeItems
    })
    .catch(error => {
      console.error("Error fetching store items:", error);
    });

  function updateCartInfo() {
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = calculateTotalPrice(storeItemsMap); // Pass storeItemsMap here
    cartInfo.textContent = `Cart: ${totalQuantity} items, SEK ${totalPrice}`;

    // Populate the order summary list
    const orderSummaryList = document.getElementById("cart-items");
    orderSummaryList.innerHTML = "";
    cartItems.forEach(item => {
      const storeItem = storeItemsMap.get(item.id);
      if (storeItem) {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          <span class="item-name">${storeItem.name}</span>
          <span class="item-quantity">${item.quantity} x</span>
          <span class="item-price">SEK ${(storeItem.priceInCents / 100).toFixed(2)}</span>
        `;
        orderSummaryList.appendChild(listItem);
      }
    });
  }
function calculateTotalPrice(storeItemsMap) {
    const totalPriceInCents = cartItems.reduce((total, item) => {
        const storeItem = storeItemsMap.get(item.id);
        return total + (storeItem ? storeItem.priceInCents * item.quantity : 0);
    }, 0);
    return (totalPriceInCents / 100).toFixed(2); // Convert to SEK and round to 2 decimal places
}
});

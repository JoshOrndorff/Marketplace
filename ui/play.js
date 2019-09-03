const { ApiPromise } = require('@polkadot/api');

const TYPES = {
  "ListingId": "u32",
  "Score": "i32",
  "Listing": {
    "seller": "AccountId",
    "price": "u32",
    "description": "u32"
  },
  "Status": {
    "_enum": [
      "Active",
      "Sold",
      "SellerReviewed",
      "BuyerReviewed"
    ]
  },
  "DefaultFeedback": {
    "_enum": [
      "Positive",
      "Negative"
    ]
  },
  "FeedbackOf": "DefaultFeedback"
};

async function main() {
  // initialise via static create
  const api = await ApiPromise.create({
    types: TYPES,
  });

  // TODO setup initial conditions.
  // Alice posts an item for sale.
  // let price = ??;
  // let description = ??;
  //api.tx.marketplace.postListing(price, description)

  // Tell me about listing 0
  let listing0 = await api.query.marketplace.statuses(0);
  console.log(JSON.stringify(listing0));
  // console.log(`Listing is active: ${listing0.isActive}`);
  // console.log(`Listing is sold: ${listing0.isSold}`);
  // console.log(`Listing is buyer reviewed: ${listing0.isBuyerReviewed}`);
  // console.log(`Listing is seller reviewed: ${listing0.isSellerReviewed}`);
  //
  // console.log("\n\n");
  //
  // let listing1 = await api.query.marketplace.statuses(1);
  // console.log(`Listing is active: ${listing1.isActive}`);
  // console.log(`Listing is sold: ${listing1.isSold}`);
  // console.log(`Listing is buyer reviewed: ${listing1.isBuyerReviewed}`);
  // console.log(`Listing is seller reviewed: ${listing1.isSellerReviewed}`);

}

main().catch(console.error).finally(() => process.exit());

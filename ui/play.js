const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');

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
  // Initialise API via static create
  const api = await ApiPromise.create({
    provider: new WsProvider('ws://localhost:9944'),
    types: TYPES,
  });

  // Create the keyring and add the well-known Alice account
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice', { name: 'Alice'}); //Error here
  console.log(alice.address);

  // Setup initial conditions.
  // Alice posts an item for sale.
  let listingId = await api.query.marketplace.nextId();
  let price = 100;
  let description = 1234567890;
  const unsub = await api.tx.marketplace.postListing(price, description).signAndSend(alice, async ({ status }) => {
    if (status.isFinalized) {
      console.log("It is time");
      unsub();

      // Tell me about listing Alice's Listing
      let listing = await api.query.marketplace.statuses(listingId);
      console.log(listingId)
      console.log(`Listing isSome: ${listing.isSome}`);
      console.log(`Listing isNone: ${listing.isNone}`);

      process.exit(0);
    }
  });




  // listing0 = listing0.unwrap();
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

main().catch(console.error);

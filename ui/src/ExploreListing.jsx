import React, { useState, useEffect } from "react";
import { Form, Input, Grid } from "semantic-ui-react";

import TxButton from "./TxButton";

export default function ExploreListing(props) {
  const { api, accountPair } = props;
  const [listingId, setListingId] = useState(0);
  const [listing, setListing] = useState({ isEmpty: () => true });
  const [buyer, setBuyer] = useState({ isEmpty: () => true });
  const [status, setStatus] = useState({ isEmpty: () => true });

  // Load the listing in question
  // TODO Consider allowing user to view multiple listings at once
  useEffect(() => {
    let unsubscribe;

    api.queryMulti([
      [api.query.marketplace.listings, listingId],
      [api.query.marketplace.buyers,   listingId],
      [api.query.marketplace.statuses, listingId],
    ], ([listing, buyer, status]) => {
      console.log(`got some results ${listing}, ${buyer}, ${status}`);
    })
    .then(u => {
      unsubscribe = u;
    })
    .catch(console.error);

  }, [listingId, accountPair]);



  return (
    <Grid.Column>
      <h1>Explore Marketplace Listings</h1>
      <Form>
        <Form.Field>
          <Input
            type="number"
            id="listing_is"
            label="Listing ID"
            onChange={(_, { value }) => setListingId(value)}
          />
        </Form.Field>
      </Form>
    </Grid.Column>
  );
}

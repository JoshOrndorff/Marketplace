import React, { useState, useEffect } from "react";
import { Form, Input, Grid, Table } from "semantic-ui-react";

import TxButton from "./TxButton";

export default function ExploreListing(props) {
  const { api, accountPair } = props;
  const [listingId, setListingId] = useState(0);
  const [listing, setListing] = useState("initial");
  const [buyer, setBuyer] = useState("initial");
  const [status, setStatus] = useState("initial");
  // Tried using this dummy object as initial state
  // { isEmpty: () => true }

  // Load the listing in question
  // TODO Consider allowing user to view multiple listings at once
  useEffect(() => {
    let unsubscribe;

    api.queryMulti([
      [api.query.marketplace.listings, listingId],
      [api.query.marketplace.buyers,   listingId],
      [api.query.marketplace.statuses, listingId],
    ], ([l, b, s]) => {
      console.log(`got some results ${l}, ${b}, ${s}`);
      setListing(l);
      setBuyer(b);
      setStatus(s);
      // State variables seem to update Correctly. Why doesn't the table below update?
      console.log(`state variables are ${listing}, ${buyer}, ${status}`);
    })
    .then(u => {
      unsubscribe = u;
    })
    .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }, /*[listingId, accountPair]*/);



  return (
    <Grid.Column>
      <h1>Explore Marketplace Listings</h1>
      <Form>
        <Form.Field>
          <Input
            value={0}
            type="number"
            id="listing_is"
            label="Listing ID"
            onChange={(_, { value }) => setListingId(value)}
          />
        </Form.Field>
      </Form>
      <Table celled striped size="small">
        <Table.Body>
          <Table.Row>
            <Table.Cell textAlign="right">Seller</Table.Cell>
            <Table.Cell textAlign="left">{listing.seller}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell textAlign="right">Price</Table.Cell>
            <Table.Cell textAlign="left">{listing.price}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell textAlign="right">Description</Table.Cell>
            <Table.Cell textAlign="left">{listing.description}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      <Grid.Row>
      <TxButton
        api={api}
        accountPair={accountPair}
        label={"Buy"}
        params={[listingId]}
        setStatus={setStatus}
        disabled={status !== "Active"}
        tx={api.tx.marketplace.buy}
      />
      </Grid.Row>
    </Grid.Column>
  );
}

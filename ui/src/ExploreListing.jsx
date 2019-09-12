import React, { useState, useEffect } from "react";
import { Form, Input, Grid, Table } from "semantic-ui-react";

import TxButton from "./TxButton";

export default function ExploreListing(props) {
  const { api, accountPair } = props;
  const [listingId, setListingId] = useState(0);
  const [listing, setListing] = useState("No such listing");
  const [buyer, setBuyer] = useState("No such listing");
  const [status, setStatus] = useState("No such listing");

  // Load the listing in question
  // TODO Consider allowing user to view multiple listings at once
  useEffect(() => {
    let unsubscribe;

    api.queryMulti([
      [api.query.marketplace.listings, listingId],
      [api.query.marketplace.buyers,   listingId],
      [api.query.marketplace.statuses, listingId],
    ], ([l, b, s]) => {
      console.log(`got some results ${l.isSome ? l : "None"}, ${b}, ${s}`);
      // Buyers is currently the onlyone not an Option<_>
      if (l.isSome) {
        setListing(l.unwrap());
        setBuyer(b);
        setStatus(s.unwrap());
      }
      else {
        setListing("No such listing");
        setBuyer("No such listing");
        setStatus("No such listing");
      }
    })
    .then(u => {
      unsubscribe = u;
    })
    .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }, /*[listingId, accountPair]*/);

  function logged(d) {
    console.log("in logged");
    console.log(`Type is ${typeof(d)}`);
    console.log(d);
    return d;
  }

  return (
    <Grid.Column>
      <h1>Explore Marketplace Listings</h1>
      <Form>
        <Form.Field>
          <Input
            type="number"
            id="listing_id"
            label="Listing ID"
            onChange={(_, { value }) => setListingId(value)}
          />
        </Form.Field>
      </Form>
      <Table celled striped size="small">
        <Table.Body>
          <Table.Row>
            <Table.Cell textAlign="right">Seller</Table.Cell>
            <Table.Cell textAlign="left">{JSON.stringify(listing.seller)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell textAlign="right">Price</Table.Cell>
            <Table.Cell textAlign="left">{JSON.stringify(listing.price)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell textAlign="right">Description</Table.Cell>
            <Table.Cell textAlign="left">{JSON.stringify(listing.description)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell textAlign="right">Status</Table.Cell>
            <Table.Cell textAlign="left">{JSON.stringify(status)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell textAlign="right">Buyer</Table.Cell>
            <Table.Cell textAlign="left">{JSON.stringify(buyer)}</Table.Cell>
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

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
      setListing(l);
      setBuyer(b);
      setStatus(s);
    })
    .then(u => {
      unsubscribe = u;
    })
    .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }, /*[listingId, accountPair]*/);

  function renderDetails() {
    if (listing.isSome) {
      return (
        <Table celled striped size="small">
          <Table.Body>
            <Table.Row>
              <Table.Cell textAlign="right">Seller</Table.Cell>
              <Table.Cell textAlign="left">{listing.unwrap().seller.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell textAlign="right">Price</Table.Cell>
              <Table.Cell textAlign="left">{listing.unwrap().price.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell textAlign="right">Description</Table.Cell>
              <Table.Cell textAlign="left">{listing.unwrap().description.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell textAlign="right">Status</Table.Cell>
              <Table.Cell textAlign="left">{status.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell textAlign="right">Buyer</Table.Cell>
              <Table.Cell textAlign="left">{buyer.toString()}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      )
    }
    else {
      return (
        <p>Nothing to see here</p>
      )
    }
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
      { renderDetails() }
      <Grid.Row>
      <TxButton
        api={api}
        accountPair={accountPair}
        label={"Buy"}
        params={[listingId]}
        setStatus={setStatus}
        disabled={ !status.isActive /* TODO Also disable if user is seller */}
        tx={api.tx.marketplace.buy}
      />
      </Grid.Row>
    </Grid.Column>
  );
}

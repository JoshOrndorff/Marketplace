import React, { useState, useEffect } from "react";
import { Form, Input, Grid, Table } from "semantic-ui-react";
import SimpleFeedback from "./SimpleFeedback.jsx";
import BetaFeedback from "./BetaFeedback.jsx";


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
      setBuyer(b.isSome ? b : "");
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
              <Table.Cell> {
                // TODO this just detects whether SimpleFeedback is installed, not whether it is the feedback system for the marketplace.
                api.query.simpleFeedback
                ? <SimpleFeedback api={api} address={listing.unwrap().seller.toString()} />
                : <BetaFeedback api={api} address={listing.unwrap().seller.toString()} />
              }
              </Table.Cell>
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
              <Table.Cell> {
                api.query.simpleFeedback
                ? <SimpleFeedback api={api} address={buyer} />
                : <BetaFeedback api={api} address={buyer} />
              }
              </Table.Cell>
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

  function canReview() {
    return listing.isSome && (
      // I'm the seller and I haven't reviewed yet
      (
        (status.isSold || status.isBuyerReviewed) &&
        listing.unwrap().seller.toString() === accountPair.address
      ) ||
      // I'm the buyer and I haven't reviewd yet
      (
        (status.isSold || status.isSellerReviewed) &&
        buyer.toString() === accountPair.address
      )
    )
  }

  function canBuy() {
    return listing.isSome &&
      status.isActive &&
      listing.unwrap().seller.toString() !== accountPair.address;
  }

  function canCancel() {
    return listing.isSome &&
      status.isActive &&
      listing.unwrap().seller.toString() === accountPair.address;
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
        disabled={!canBuy()}
        tx={api.tx.marketplace.buy}
      />
      <TxButton
        api={api}
        accountPair={accountPair}
        label={"Cancel"}
        params={[listingId]}
        setStatus={setStatus}
        disabled={ !canCancel()}
        tx={api.tx.marketplace.cancelListing}
      />
      <TxButton
        api={api}
        accountPair={accountPair}
        label={"Review Positively"}
        params={[listingId, "Positive"]}
        setStatus={setStatus}
        disabled={ !canReview()}
        tx={api.tx.marketplace.review}
      />
      <TxButton
        api={api}
        accountPair={accountPair}
        label={"Review Negatively"}
        params={[listingId, "Negative"]}
        setStatus={setStatus}
        disabled={ !canReview()}
        tx={api.tx.marketplace.review}
      />
      </Grid.Row>
    </Grid.Column>
  );
}

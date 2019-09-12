import React, { useState } from "react";
import { Form, Input, Grid } from "semantic-ui-react";

import TxButton from "./TxButton";

export default function PostListing(props) {
  const { api, accountPair } = props;
  const [status, setStatus] = useState("");
  const initialState = {
    price: 0,
    description: 0,
  };
  const [formState, setFormState] = useState(initialState);
  const { price, description } = formState;

  const onChange = (_, data) => {
    setFormState(formState => {
      return {
        ...formState,
        [data.state]: data.value
      };
    });
  };

  return (
    <Grid.Column>
      <h1>Post Listing</h1>
      <p>During POC, description is just a number. If this dApp gets more serious, it can become a string.</p>
      <Form>
        <Form.Field>
          <Input
            onChange={onChange}
            label="Description"
            fluid
            placeholder="0123"
            state="description"
            type="number"
          />
        </Form.Field>
        <Form.Field>
          <Input
            label="Price"
            fluid
            onChange={onChange}
            state="price"
            type="number"
          />
        </Form.Field>
        <Form.Field>
          <TxButton
            api={api}
            accountPair={accountPair}
            label={"Sell"}
            params={[price, description]}
            setStatus={setStatus}
            tx={api.tx.marketplace.postListing}
          />
          {status}
        </Form.Field>
      </Form>
    </Grid.Column>
  );
}

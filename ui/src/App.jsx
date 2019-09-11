import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import keyring from "@polkadot/ui-keyring";
import React, { useState, useEffect, createRef } from "react";
import { Container, Dimmer, Loader, Grid, Sticky } from "semantic-ui-react";

import "semantic-ui-css/semantic.min.css";

import AccountSelector from "./AccountSelector";
import Balances from "./Balances";
import BlockNumber from "./BlockNumber";
import ChainState from "./ChainState";
import DeveloperConsole from "./DeveloperConsole";
import Events from "./Events";
import Extrinsics from "./Extrinsics";
import Metadata from "./Metadata";
import NodeInfo from "./NodeInfo";
import Transfer from "./Transfer";
import ExploreListing from "./ExploreListing";

export default function App() {
  const [api, setApi] = useState();
  const [apiReady, setApiReady] = useState();
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [accountAddress, setAccountAddress] = useState("");

  const WS_PROVIDER = "ws://127.0.0.1:9944";
  //const WS_PROVIDER = "wss://dev-node.substrate.dev";

  const accountPair = accountAddress && keyring.getPair(accountAddress);

  useEffect(() => {
    const provider = new WsProvider(WS_PROVIDER);
    const types = {
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

    ApiPromise.create({
      provider,
      types,
    })
      .then(api => {
        setApi(api);
        api.isReady.then(() => setApiReady(true));
      })
      .catch(e => console.error(e));
  }, []);

  // Get injected accounts
  useEffect(() => {
    web3Enable("substrate-front-end-tutorial")
      .then(extensions => {
        // web3Account promise resolves with an array of injected accounts
        // or an empty array (e.g user has no extension, or not given access to their accounts)
        web3Accounts()
          .then(accounts => {
            // add the source to the name to avoid confusion
            return accounts.map(({ address, meta }) => ({
              address,
              meta: {
                ...meta,
                name: `${meta.name} (${meta.source})`
              }
            }));
          })
          // load our keyring with the newly injected accounts
          .then(injectedAccounts => {
            loadAccounts(injectedAccounts);
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, []);

  const loadAccounts = injectedAccounts => {
    keyring.loadAll(
      {
        isDevelopment: true
      },
      injectedAccounts
    );
    setAccountLoaded(true);
  };

  const loader = function(text) {
    return (
      <Dimmer active>
        <Loader size="small">{text}</Loader>
      </Dimmer>
    );
  };

  if (!apiReady) {
    return loader("Connecting to the blockchain");
  }

  if (!accountLoaded) {
    return loader(
      "Loading accounts (please review any extension's authorization)"
    );
  }

  const contextRef = createRef();

  return (
    <div ref={contextRef}>
      <Sticky context={contextRef}>
        <AccountSelector
          keyring={keyring}
          setAccountAddress={setAccountAddress}
        />
      </Sticky>
      <Container>
        <Grid stackable columns="equal">
          <Grid.Row stretched>
            <NodeInfo api={api} />
            <Metadata api={api} />
            <BlockNumber api={api} />
            <BlockNumber api={api} finalized />
          </Grid.Row>
          <Grid.Row stretched>
            <Balances api={api} keyring={keyring} />
          </Grid.Row>
          <Grid.Row>
            <Transfer api={api} accountPair={accountPair} />
            <ExploreListing api={api} accountPair={accountPair} />
          </Grid.Row>
          <Grid.Row>
            <Extrinsics api={api} accountPair={accountPair} />
            <ChainState api={api} />
            <Events api={api} />
          </Grid.Row>
          {/* These components render if a module is present in the runtime. */}
          <Grid.Row>
            { /* TODO put conditional components for each reputation system here */ }
          </Grid.Row>
        </Grid>
        {/* These components don't render elements. */}
        <DeveloperConsole api={api} />
      </Container>
    </div>
  );
}

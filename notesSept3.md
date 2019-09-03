opyclone git@github.com:substrate-developer-hub/substrate-ui-template.git
renmae to ui
cd in
yarn
yarn start - got a few warnings, I think they're ust linting warnings.
```
Compiled with warnings.

./src/Balances.jsx
  Line 31:  React Hook useEffect has a missing dependency: 'addresses'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

./src/Events.jsx
  Line 47:  React Hook useEffect has a missing dependency: 'filter'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

Search for the keywords to learn more about each warning.
To ignore, add // eslint-disable-next-line to the line before.
```

localhost:3000 conencts to a hosted node.
Edit App.jsx to connect to `const WS_PROVIDER = "ws://127.0.0.1:9944";`

start node that was compiled from before.

UI shows loader, console shows missing types
Made pr against apps to correct .->, typo in example json
Made pr against ui-template to demonstrate types.

Getting types in place seems to have worked
```
2019-09-03 13:37:52 Accepted a new tcp connection from 127.0.0.1:33646.
2019-09-03 13:37:52 WS Error <Http(Token)>: Invalid byte where token is required.
```

Asked about that in tech chat, no answer yet. Ricardo says UI has been tested against 2.0. Time to upgrade the marketplace runtime.

Bring in new node template and compile
copied my runtime over top, mostly used the template lib.rs
Corrected a few renamed imports, and everything compiled. (should have committed here)
Tried to rename from node-template to marketplace, but now compiling fails. Still looking for something called node-template-runtime. I deleted target directories, used `cargo clean`, and tried again.
Now it compiles properly whew



import React, { useEffect, useState } from "react";

import { Card, Icon, Grid } from "semantic-ui-react";

export default function NodeInfo(props) {
  const { api } = props;
  const [nodeInfo, setNodeInfo] = useState({});

  useEffect(() => {
    const getInfo = () => {
      Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
      ])
        .then(([chain, nodeName, nodeVersion]) => {
          setNodeInfo({
            chain,
            nodeName,
            nodeVersion
          });
        })
        .catch(e => console.error(e));
    };
    getInfo();
  }, [api.rpc.system]);

  return (
    <Grid.Column>
      <Card>
        <Card.Content>
          <Card.Header>{nodeInfo.nodeName}</Card.Header>
          <Card.Meta>
            <span>{nodeInfo.chain}</span>
          </Card.Meta>
          <Card.Description>
            Built using the{" "}
            <a href="https://github.com/substrate-developer-hub/substrate-ui-template">
              Substrate UI Template
            </a>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Icon name="setting" />v{nodeInfo.nodeVersion}
        </Card.Content>
      </Card>
    </Grid.Column>
  );
}

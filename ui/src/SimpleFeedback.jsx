import React, { useEffect, useState } from "react";

//import { Statistic, Grid, Card, Icon } from "semantic-ui-react";

export default function SimpleFeedback(props) {
  const { api, address } = props;

  const [ score, setScore ] = useState(0);

  useEffect(() => {
    let unsub;

    api.query.simpleFeedback.scores(address, setScore)
    .then(u => {unsub = u})
    .catch(console.error);

    return () => unsub && unsub();
  })

  return (
    <div>{`Simple Feedback: ${score}`}</div>
  );
}

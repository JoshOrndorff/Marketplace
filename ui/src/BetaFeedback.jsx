import React, { useEffect, useState } from "react";

//import { Statistic, Grid, Card, Icon } from "semantic-ui-react";

export default function BetaFeedback(props) {
  const { api, address } = props;

  const [ score, setScore ] = useState(0);

  useEffect(() => {
    let unsub;

    api.queryMulti([
      [api.query.betaFeedback.positives, address],
      [api.query.betaFeedback.negatives, address],
    ], ([positives, negatives]) => {
      const numer = positives.toNumber() + 1;
      const denom = positives.toNumber() + negatives.toNumber() + 2;
      setScore(numer / denom);
    })
    .then(u => {unsub = u})
    .catch(console.error);

    return () => unsub && unsub();
  }, [api, api.query.simpleFeedback, address]);

  return (
    <div>{`Beta Feedback: ${score}`}</div>
  );
}

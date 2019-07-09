use support::dispatch::Result;
use parity_codec::{ Encode, Decode };

pub trait Reputation<AccountId> {
    /// The reputational score of an account. (Probably u32 or some token)
    type Score;

    /// The kind of feedback that will be given what ratings are assigned
    type Feedback;

    /// One account assigns a rating to another.
    /// In general this may affect both of their reputations.
    fn rate(rater: &AccountId, ratee: &AccountId, feedback: Self::Feedback)
      -> Result;

    // Create a feedback form. A feedback form must exist in order for a user to rate another user.
    // This is an idea that may be wise or unnecessary, but for now we omit it.
    //fn issue_form(rater: &AccountIt, ratee: &AccountId);

    /// The current reputation of an account
    fn reputation(who : &AccountId) -> Self::Score;
}

#[derive(Encode, Decode, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum DefaultFeedback {
    Positive,
    Neutral,
    Negative,
}

// Type info for js apps UI
// "DefaultFeedback": {
//   "_enum": [
//     "Positive",
//     "Neutral",
//     "Negative"
//   ]
// }

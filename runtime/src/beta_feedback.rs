/// A reputation system in which a user's reputation is given by
/// (p + 1) / (p + n + 2)
/// where p is the number of positive reviews and n is the number
/// of negative reviews.

use support::{decl_module, decl_storage, decl_event, StorageMap, dispatch::Result};
use runtime_primitives::Perbill;
use crate::reputation_trait::{ Reputation, DefaultFeedback };

/// The module's configuration trait.
pub trait Trait: system::Trait {
	/// The overarching event type.
	type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

type Score = Perbill;

// This module's storage items.
decl_storage! {
	trait Store for Module<T: Trait> as SimpleFeedback {
		Positives: map T::AccountId => u32;
		Negatives: map T::AccountId => u32;
		Scores: map T::AccountId => Score;
	}
}

decl_module! {
	/// The module declaration.
	pub struct Module<T: Trait> for enum Call where origin: T::Origin {
		// Initializing events
		// this is needed only if you are using events in your module
		fn deposit_event<T>() = default;
	}
}

// Implement the reputation trait
impl<T: Trait> Reputation<T::AccountId> for Module<T> {
    type Score = Score;
    type Feedback = DefaultFeedback;

    fn rate(rater: T::AccountId, ratee: T::AccountId, feedback: DefaultFeedback) -> Result {

        // Update the individual accumulators
        match feedback {
            DefaultFeedback::Positive => {
                <Positives<T>>::mutate(&ratee, |p| *p += 1);
            },
            DefaultFeedback::Negative => {
                <Negatives<T>>::mutate(&ratee, |n| *n += 1);
            },
        };

        //TODO 3 and 4 should not be hard-coded
        // Update the current score
        // Probably this computation should be done off-chain
        // Then this system would reduce to keeping track of a tuple (p, n)
        // TODO in Substrate 2.0 this is called from_rational_approximation
        <Scores<T>>::insert(&ratee, Score::from_rational(3,4));

        Self::deposit_event(RawEvent::Rated(rater, ratee, feedback));

        Ok(())
    }

    fn reputation(who: T::AccountId) -> Self::Score {
        <Scores<T>>::get(&who)
    }
}

decl_event!(
	pub enum Event<T> where AccountId = <T as system::Trait>::AccountId {
		// User just submitted a rating
		// Rater, Ratee, Rating
		Rated(AccountId, AccountId, DefaultFeedback),
	}
);

/// tests for this module
#[cfg(test)]
mod tests {
	use super::*;

	use runtime_io::with_externalities;
	use primitives::{H256, Blake2Hasher};
	use support::{impl_outer_origin, assert_ok};
	use runtime_primitives::{
		BuildStorage,
		traits::{BlakeTwo256, IdentityLookup},
		testing::{Digest, DigestItem, Header}
	};

	impl_outer_origin! {
		pub enum Origin for Test {}
	}

	// For testing the module, we construct most of a mock runtime. This means
	// first constructing a configuration type (`Test`) which `impl`s each of the
	// configuration traits of modules we want to use.
	#[derive(Clone, Eq, PartialEq)]
	pub struct Test;
	impl system::Trait for Test {
		type Origin = Origin;
		type Index = u64;
		type BlockNumber = u64;
		type Hash = H256;
		type Hashing = BlakeTwo256;
		type Digest = Digest;
		type AccountId = u64;
		type Lookup = IdentityLookup<Self::AccountId>;
		type Header = Header;
		type Event = ();
		type Log = DigestItem;
	}
	impl Trait for Test {
		type Event = ();
	}
	type SimpleFeedback = Module<Test>;

	// This function basically just builds a genesis storage key/value store according to
	// our desired mockup.
	fn new_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
		system::GenesisConfig::<Test>::default().build_storage().unwrap().0.into()
	}

	#[test]
	fn it_works_for_default_value() {
		with_externalities(&mut new_test_ext(), || {
			// Just a dummy test for the dummy funtion `do_something`
			// calling the `do_something` function with a value 42
			//assert_ok!(TemplateModule::do_something(Origin::signed(1), 42));
			// asserting that the stored value is equal to what we stored
			//assert_eq!(TemplateModule::something(), Some(42));
		});
	}
}

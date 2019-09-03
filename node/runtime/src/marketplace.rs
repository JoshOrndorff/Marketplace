/// A runtime module implementing a Craigslist-style marketplace
/// plus a reputation system. This module is intended to be a
/// minimal example of a system that requires a reputation system
/// and demonstrates how to use various reputation systems

use support::{ensure, decl_module, decl_storage, decl_event, StorageValue, StorageMap, dispatch::Result};
use system::ensure_signed;
use codec::{ Encode, Decode };

// Use the Reputation trait
use crate::reputation_trait;

/// Marketplace configuration trait.
pub trait Trait: system::Trait {
    // Notaion of reputation system
    type ReputationSystem: reputation_trait::Reputation<Self::AccountId>;

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

type ListingId = u32;
type FeedbackOf<T> = <<T as Trait>::ReputationSystem as reputation_trait::Reputation<<T as system::Trait>::AccountId>>::Feedback;

#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Listing <AccountId> {
    seller: AccountId,
    price: u32,
    // Description should be string, but those are hard
    // And we're just testing.
    description: u32,
}

/// States a listing can be in
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum Status {
    Active,
    Sold,
    SellerReviewed,
    BuyerReviewed,
    // There is no status for settled. Once both reviews
    // have come in, the sale is removed from storage, and an event emitted.
}

// Status has to have a default value to be used as a storage item... it seems
impl Default for Status {
    fn default() -> Self {
        Self::Active
    }
}

// This module's storage items.
decl_storage! {
    trait Store for Module<T: Trait> as Marketplace {
        NextId get(next_id): ListingId;
        Listings get(listing): map ListingId => Option<Listing<T::AccountId>>;
        Buyers get(buyer): map ListingId => T::AccountId;
        Statuses get(status): map ListingId => Status;
    }
}

decl_module! {
    /// The module declaration.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        // Initializing events
        // this is needed only if you are using events in your module
        fn deposit_event() = default;

        /// Post a listing for an item for sale.
        pub fn post_listing(origin, p: u32, d: u32) -> Result {
            let s = ensure_signed(origin)?;

            // Construct the listing struct.
            let listing = Listing::<T::AccountId> {
                seller: s.clone(),
                price: p,
                description: d,
            };

            let listing_id = NextId::get();
            //TODO mark this to explicitly overflow.
            // because old ids will be ready to be
            // recycled by the time overflow happens.
            NextId::mutate(|n| *n += 1);
            <Listings<T>>::insert(listing_id, &listing);


            // Raise the event
            Self::deposit_event(RawEvent::Posted(s, listing_id, listing));
            Ok(())
        }

        /// Mark an item that you posted for sale as no longer for sale.
        pub fn cancel_listing(origin, listing_id: ListingId) -> Result {
            let sender = ensure_signed(origin)?;
            ensure!(<Listings<T>>::exists(listing_id), "No such listing to cancel");
            ensure!(Statuses::get(listing_id) == Status::Active, "Cannot cancel already-sold listing");
            ensure!(<Listings<T>>::get(listing_id).unwrap().seller == sender, "Cannot cancel another seller's listing");

            // Remove listing from map
            <Listings<T>>::remove(listing_id);
            Statuses::remove(listing_id);
            <Buyers<T>>::remove(listing_id);

            // Emit Event
            Self::deposit_event(RawEvent::Cancelled(listing_id));
            Ok(())

        }

        /// Buy an item specified by the supplied listing
        pub fn buy(origin, listing_id: ListingId) -> Result {
            let buyer = ensure_signed(origin)?;

            ensure!(<Listings<T>>::exists(listing_id), "No such listing to buy");
            ensure!(Statuses::get(listing_id) != Status::Sold, "Listing already sold");
            //TODO Also make sure it isn't seller reviewed or buyer reviewed
            ensure!(<Listings<T>>::get(listing_id).unwrap().seller != buyer, "Can't buy own listing");

            // Update storage
            <Buyers<T>>::insert(listing_id, &buyer);
            Statuses::insert(listing_id, Status::Sold);

            // Emit Event
            Self::deposit_event(RawEvent::Sold(buyer, listing_id));
            Ok(())
        }

        ///  Submit feedback for your counterparty in the specified transaction.
        pub fn review(origin, listing_id: ListingId, feedback: FeedbackOf<T>) -> Result {

            enum Role {Buyer, Seller}

            let reviewer = ensure_signed(origin)?;

            ensure!(<Listings<T>>::exists(listing_id), "No such listing");

            let status = Statuses::get(listing_id);
            let (role, reviewee) =
                if <Listings<T>>::get(listing_id).unwrap().seller == reviewer {
                    (Role::Seller, <Buyers<T>>::get(listing_id))
                }
                else if <Buyers<T>>::get(listing_id) == reviewer{
                    (Role::Buyer, <Listings<T>>::get(listing_id).unwrap().seller)
                }
                else {
                    return Err("You were not involved in this listing");
                };

            match (status, role) {
                (Status::Sold, Role::Buyer) => {
                    Statuses::insert(listing_id, Status::BuyerReviewed);
                },
                (Status::Sold, Role::Seller) => {
                    Statuses::insert(listing_id, Status::SellerReviewed);
                },
                (Status::SellerReviewed, Role::Buyer) |
                (Status::BuyerReviewed, Role::Seller) => {
                    Statuses::remove(listing_id);
                    <Listings<T>>::remove(listing_id);
                    <Buyers<T>>::remove(listing_id);
                    //Self::deposit_event(RawEvent::Sold(&reviewer, listing_id));
                },
                _ => return Err("You've already reviewed this listing"),
            }

            // Call into the reputation system
            let _ = <<T as Trait>::ReputationSystem as reputation_trait::Reputation<T::AccountId>>::rate(reviewer, reviewee, feedback);

            Ok(())
        }
    }
}

decl_event!(
    pub enum Event<T> where AccountId = <T as system::Trait>::AccountId {
        Posted(AccountId, ListingId, Listing<AccountId>),
        Cancelled(ListingId),
        Sold(AccountId, ListingId),
        //Settled(AccountId, ListingId),
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

    impl reputation_trait::Reputation<u64> for () {
        type Score = ();
        type Feedback = ();
        fn rate(_rater: u64, _ratee: u64, _feedback: Self::Feedback)
          -> Result {
              Ok(())
        }
        fn reputation(_who : u64) -> Self::Score {
            ()
        }
    }

    impl Trait for Test {
        type ReputationSystem = ();
        type Event = ();
    }
    type Marketplace = Module<Test>;

    // This function basically just builds a genesis storage key/value store according to
    // our desired mockup.
    fn new_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
        system::GenesisConfig::<Test>::default().build_storage().unwrap().0.into()
    }

    #[test]
    fn listing_id_increments_correctly() {
        with_externalities(&mut new_test_ext(), || {

            // Post a listing
            assert_ok!(Marketplace::post_listing(Origin::signed(1), 123, 456));
            // asserting that the stored value is equal to what we stored
            //assert_eq!(TemplateModule::something(), Some(42));
            assert_eq!(Marketplace::next_id(),1);
        });
    }
}

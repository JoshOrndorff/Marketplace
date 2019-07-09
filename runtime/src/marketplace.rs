/// A runtime module implementing a Craigslist-style marketplace
/// plus a reputation system. This module is intended to be a
/// minimal example of a system that requires a reputation system
/// and demonstrates how to use various reputation systems

use support::{ensure, decl_module, decl_storage, decl_event, StorageValue, StorageMap, dispatch::Result};
use system::ensure_signed;
use parity_codec::{ Encode, Decode };

// Use the Reputation trait
use crate::reputation_trait;

/// Marketplace configuration trait.
pub trait Trait: system::Trait {
    // Notaion of reputation system
    type Reputation: reputation_trait::Reputation<Self::AccountId>;

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}


// Type info for js apps UI
// {
//   "ListingId": "u32",
//   "Listing": {
//     "seller": "AccountId",
//     "price": "u32",
//     "description": "u32"
//   },
//   "Status": {
//     "_enum": [
//       "Active",
//       "Sold",
//       "SellerReviewed",
//       "BuyerReviewed"
//     ]
//   }
// }
type ListingId = u32;

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
    // have come in, the sale is removed from storage.
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
        fn deposit_event<T>() = default;


        pub fn post_listing(origin, listing: Listing<T::AccountId>) -> Result {
            let seller = ensure_signed(origin)?;

            let listing_id = <NextId<T>>::get();
            <NextId<T>>::mutate(|n| *n += 1);
            <Listings<T>>::insert(listing_id, &listing);


            // Raise the event
            Self::deposit_event(RawEvent::Posted(seller, listing_id, listing));
            Ok(())
        }

        pub fn cancel_listing(origin, listing_id: ListingId) -> Result {
            let sender = ensure_signed(origin)?;
            ensure!(<Listings<T>>::exists(listing_id), "No such listing to cancel");
            ensure!(<Statuses<T>>::get(listing_id) == Status::Active, "Cannot cancel already-sold listing");
            ensure!(<Listings<T>>::get(listing_id).unwrap().seller == sender, "Cannot cancel another seller's listing");

            // Remove listing from map
            <Listings<T>>::remove(listing_id);
            <Statuses<T>>::remove(listing_id);
            <Buyers<T>>::remove(listing_id);

            // Emit Event
            Self::deposit_event(RawEvent::Cancelled(listing_id));
            Ok(())

        }

        pub fn buy(origin, listing_id: ListingId) -> Result {
            let buyer = ensure_signed(origin)?;

            ensure!(<Listings<T>>::exists(listing_id), "No such listing to buy");
            ensure!(<Statuses<T>>::get(listing_id) != Status::Sold, "Listing already sold");
            ensure!(<Listings<T>>::get(listing_id).unwrap().seller != buyer, "Can't buy own listing");

            // Update storage
            <Buyers<T>>::insert(listing_id, &buyer);
            <Statuses<T>>::insert(listing_id, Status::Sold);

            // Emit Event
            Self::deposit_event(RawEvent::Sold(buyer, listing_id));
            Ok(())
        }

        pub fn review(origin, listing_id: ListingId, feedback: T::Reputation::Feedback) -> Result {
            enum Role {Buyer, Seller}

            let reviewer = ensure_signed(origin)?;

            ensure!(<Listings<T>>::exists(listing_id), "No such listing");

            let status = <Statuses<T>>::get(listing_id);
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
                    <Statuses<T>>::insert(listing_id, Status::BuyerReviewed);
                },
                (Status::Sold, Role::Seller) => {
                    <Statuses<T>>::insert(listing_id, Status::SellerReviewed);
                },
                (Status::SellerReviewed, Role::Buyer) |
                (Status::BuyerReviewed, Role::Seller) => {
                    <Statuses<T>>::remove(listing_id);
                    <Listings<T>>::remove(listing_id);
                    <Buyers<T>>::remove(listing_id);
                },
                _ => return Err("You've already reviewed this listing"),
            }

            //TODO actually call into the reputation system

            Ok(())
        }
    }
}

decl_event!(
    pub enum Event<T> where AccountId = <T as system::Trait>::AccountId {
        Posted(AccountId, ListingId, Listing<AccountId>),
        Cancelled(ListingId),
        Sold(AccountId, ListingId),
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
    type TemplateModule = Module<Test>;

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
            assert_ok!(TemplateModule::do_something(Origin::signed(1), 42));
            // asserting that the stored value is equal to what we stored
            assert_eq!(TemplateModule::something(), Some(42));
        });
    }
}

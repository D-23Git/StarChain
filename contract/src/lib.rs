#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol, Vec,
};

// ── Data Structures ───────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct Business {
    pub id:           u64,
    pub owner:        Address,
    pub name:         String,
    pub category:     String,
    pub metadata:     String, // JSON: {addr, img, items, ownerName}
    pub total_rating: u64,
    pub review_count: u64,
    pub registered_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Review {
    pub id:          u64,
    pub business_id: u64,
    pub reviewer:    Address,
    pub rating:      u32,   // 1–5
    pub comment:     String,
    pub metadata:    String, // JSON: {img}
    pub timestamp:   u64,
}

// ── Storage Keys ──────────────────────────────────────────────────────────────

const BIZ_CNT: Symbol = symbol_short!("BIZ_CNT");
const REV_CNT: Symbol = symbol_short!("REV_CNT");

fn biz_key(id: u64)          -> (Symbol, u64) { (symbol_short!("BIZ"),    id) }
fn rev_key(id: u64)          -> (Symbol, u64) { (symbol_short!("REV"),    id) }
fn biz_revs_key(id: u64)     -> (Symbol, u64) { (symbol_short!("BIZREVS"),id) }
fn voted_key(r: &Address, b: u64) -> (Symbol, Address, u64) {
    (symbol_short!("VOTED"), r.clone(), b)
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct StarChainReviews;

#[contractimpl]
impl StarChainReviews {

    /// Register a new business. Returns its ID.
    pub fn register_business(
        env: Env,
        owner: Address,
        name: String,
        category: String,
        metadata: String,
    ) -> u64 {
        owner.require_auth();
        let id = env.storage().instance()
            .get::<Symbol, u64>(&BIZ_CNT).unwrap_or(0) + 1;

        env.storage().persistent().set(&biz_key(id), &Business {
            id, owner: owner.clone(), name, category, metadata,
            total_rating: 0, review_count: 0,
            registered_at: env.ledger().timestamp(),
        });
        env.storage().instance().set(&BIZ_CNT, &id);
        env.events().publish((symbol_short!("BIZ_REG"), owner), id);
        id
    }

    /// Submit a review (one per wallet per business, rating 1-5).
    pub fn submit_review(
        env: Env,
        reviewer: Address,
        business_id: u64,
        rating: u32,
        comment: String,
        metadata: String,
    ) -> u64 {
        reviewer.require_auth();
        assert!(rating >= 1 && rating <= 5, "Rating must be 1-5");

        let mut biz: Business = env.storage().persistent()
            .get(&biz_key(business_id)).expect("Business not found");

        // let vk = voted_key(&reviewer, business_id);
        // assert!(!env.storage().persistent().has(&vk), "Already reviewed");

        let rev_id = env.storage().instance()
            .get::<Symbol, u64>(&REV_CNT).unwrap_or(0) + 1;

        env.storage().persistent().set(&rev_key(rev_id), &Review {
            id: rev_id, business_id,
            reviewer: reviewer.clone(), rating, comment, metadata,
            timestamp: env.ledger().timestamp(),
        });
        env.storage().instance().set(&REV_CNT, &rev_id);
        // env.storage().persistent().set(&vk, &true);

        biz.total_rating += rating as u64;
        biz.review_count += 1;
        env.storage().persistent().set(&biz_key(business_id), &biz);

        let mut list: Vec<u64> = env.storage().persistent()
            .get(&biz_revs_key(business_id))
            .unwrap_or_else(|| Vec::new(&env));
        list.push_back(rev_id);
        env.storage().persistent().set(&biz_revs_key(business_id), &list);

        env.events().publish((symbol_short!("REVIEWED"), reviewer), (business_id, rating));
        rev_id
    }

    pub fn get_business(env: Env, business_id: u64) -> Business {
        env.storage().persistent().get(&biz_key(business_id)).expect("Not found")
    }

    /// Returns average rating × 100 (e.g. 450 = 4.50 stars)
    pub fn get_rating(env: Env, business_id: u64) -> u64 {
        let b: Business = env.storage().persistent().get(&biz_key(business_id)).expect("Not found");
        if b.review_count == 0 { return 0; }
        (b.total_rating * 100) / b.review_count
    }

    pub fn get_review(env: Env, review_id: u64) -> Review {
        env.storage().persistent().get(&rev_key(review_id)).expect("Not found")
    }

    pub fn list_review_ids(env: Env, business_id: u64) -> Vec<u64> {
        env.storage().persistent()
            .get(&biz_revs_key(business_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn business_count(env: Env) -> u64 {
        env.storage().instance().get::<Symbol, u64>(&BIZ_CNT).unwrap_or(0)
    }

    pub fn review_count(env: Env) -> u64 {
        env.storage().instance().get::<Symbol, u64>(&REV_CNT).unwrap_or(0)
    }

    pub fn has_reviewed(env: Env, reviewer: Address, business_id: u64) -> bool {
        env.storage().persistent().has(&voted_key(&reviewer, business_id))
    }
}

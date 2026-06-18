use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenData {
    pub access_token: String,
    pub refresh_token: String,
    /// Expiration of access token in unix millis
    pub expires: u64,
}

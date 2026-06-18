//! Encryption and decryption of tokens

use aes_gcm::{
    Aes256Gcm, KeyInit, Nonce, Tag,
    aead::{AeadCore, AeadInPlace, OsRng},
};
use anyhow::Context;
use axum_plugin::AdHocPlugin;
use base64::Engine;

use crate::{config::AppConfig, state::AppState, types::TokenData};

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("Crypto").on_init(async |mut state| {
        let config = state.get::<AppConfig>().context("no config found")?;
        let cipher = Aes256Gcm::new_from_slice(&config.token_key).context("invalid token key")?;

        state.insert(CryptoService::new(cipher));
        Ok(state)
    })
}

pub struct CryptoService {
    cipher: Aes256Gcm,
}

const BASE64: base64::engine::GeneralPurpose = base64::engine::general_purpose::URL_SAFE_NO_PAD;

impl CryptoService {
    pub fn new(cipher: Aes256Gcm) -> Self {
        Self { cipher }
    }

    pub fn encrypt_token(&self, data: &TokenData) -> anyhow::Result<String> {
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let mut buffer = serde_json::to_vec(data).context("serialize token to JSON")?;
        let tag = self
            .cipher
            .encrypt_in_place_detached(&nonce, b"", &mut buffer)
            .context("encrypt token")?;
        let token = [
            BASE64.encode(&tag),
            BASE64.encode(&nonce),
            BASE64.encode(&buffer),
        ]
        .join(".");

        Ok(token)
    }

    pub fn decrypt_token(&self, token: &str) -> anyhow::Result<TokenData> {
        const TAG_LEN: usize = 16;
        const TAG_STR_LEN: usize = 22;
        const NONCE_LEN: usize = 12;
        const NONCE_STR_LEN: usize = 16;

        let (tag_str, rest) = token.split_at_checked(TAG_STR_LEN).context("missing tag")?;
        let mut tag = [0u8; TAG_LEN];
        BASE64
            .decode_slice(tag_str, &mut tag)
            .context("invalid tag")?;
        let tag = Tag::from_slice(&tag);

        let (nonce_str, rest) = rest[1..]
            .split_at_checked(NONCE_STR_LEN)
            .context("missing nonce")?;
        let mut nonce = [0u8; NONCE_LEN];
        BASE64
            .decode_slice(nonce_str, &mut nonce)
            .context("invalid nonce")?;
        let nonce = Nonce::from_slice(&nonce);

        let mut buffer = BASE64.decode(&rest[1..]).context("invalid token")?;
        self.cipher
            .decrypt_in_place_detached(&nonce, b"", &mut buffer, &tag)
            .context("decrypt token")?;
        let data: TokenData = serde_json::from_slice(&buffer).context("deserialize token")?;

        Ok(data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_encrypt_and_decrypt() {
        let key = Aes256Gcm::generate_key(&mut OsRng);
        let crypto = CryptoService::new(Aes256Gcm::new(&key));

        let token = TokenData {
            access_token: "access".into(),
            refresh_token: "refresh".into(),
            expires: 0,
        };

        let encrypted = crypto.encrypt_token(&token).unwrap();
        let decrypted = crypto.decrypt_token(&encrypted).unwrap();
        assert_eq!(token, decrypted);
    }
}

use std::time::Duration;

use simple_oauth::{SimpleOAuthClient, types::StandardTokenResponse};

use crate::{plugins::oauth::provider::YnabOAuthProvider, types::TokenData, util::now_secs};

pub struct OauthService {
    client: SimpleOAuthClient<YnabOAuthProvider>,
}

impl OauthService {
    pub fn new(client: SimpleOAuthClient<YnabOAuthProvider>) -> Self {
        Self { client }
    }

    pub fn authorize_url(&self) -> anyhow::Result<(reqwest::Url, String, String)> {
        let auth_url = self.client.authorize_url().build()?;

        Ok((auth_url.url, auth_url.state, auth_url.pkce_verifier))
    }

    pub async fn exchange_code(
        &self,
        code: String,
        pkce_verifier: String,
    ) -> anyhow::Result<TokenData> {
        let response = self
            .client
            .exchange_code()
            .code(code)
            .pkce_verifier(pkce_verifier)
            .build()
            .await?;

        extract_token_data(response)
    }

    pub async fn refresh(&self, refresh_token: String) -> anyhow::Result<TokenData> {
        let response = self
            .client
            .exchange_refresh_token(refresh_token)
            .build()
            .await?;

        extract_token_data(response)
    }

    pub async fn revoke(&self, refresh_token: String) -> anyhow::Result<()> {
        self.client
            .revoke_token(refresh_token, simple_oauth::types::RevokeTokenType::Refresh)
            .await?;

        Ok(())
    }
}

fn extract_token_data(response: StandardTokenResponse) -> Result<TokenData, anyhow::Error> {
    const DEFAULT_EXPIRY: Duration = Duration::from_hours(2);

    let refresh_token = response
        .refresh_token
        .ok_or_else(|| anyhow::anyhow!("missing refresh token"))?;
    let expires = (now_secs() + response.expires_in.unwrap_or(DEFAULT_EXPIRY).as_secs()) * 1000;

    Ok(TokenData {
        access_token: response.access_token,
        refresh_token,
        expires,
    })
}

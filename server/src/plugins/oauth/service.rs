use std::time::Duration;

use oauth2::{RefreshToken, TokenResponse};
use oauth2_reqwest::ReqwestClient;

use crate::{types::TokenData, util::now_secs};

pub struct OauthService {
    client: super::OauthClient,
    http_client: ReqwestClient,
}

impl OauthService {
    pub fn new(client: super::OauthClient, http_client: ReqwestClient) -> Self {
        Self {
            client,
            http_client,
        }
    }

    pub fn authorize_url(&self) -> (reqwest::Url, oauth2::CsrfToken, oauth2::PkceCodeVerifier) {
        let (pkce_challenge, pkce_verifier) = oauth2::PkceCodeChallenge::new_random_sha256();
        let (auth_url, csrf_token) = self
            .client
            .authorize_url(oauth2::CsrfToken::new_random)
            .add_scope(oauth2::Scope::new("public".to_string()))
            .set_pkce_challenge(pkce_challenge)
            .url();

        (auth_url, csrf_token, pkce_verifier)
    }

    pub async fn exchange_code(
        &self,
        code: String,
        pkce_verifier: String,
    ) -> anyhow::Result<TokenData> {
        let response = self
            .client
            .exchange_code(oauth2::AuthorizationCode::new(code))
            .set_pkce_verifier(oauth2::PkceCodeVerifier::new(pkce_verifier))
            .request_async(&self.http_client)
            .await?;

        extract_token_data(response)
    }

    pub async fn refresh(&self, refresh_token: String) -> anyhow::Result<TokenData> {
        let response = self
            .client
            .exchange_refresh_token(&RefreshToken::new(refresh_token))
            .request_async(&self.http_client)
            .await?;

        extract_token_data(response)
    }

    pub async fn revoke(&self, refresh_token: String) -> anyhow::Result<()> {
        self.client
            .revoke_token(RefreshToken::new(refresh_token).into())?
            .request_async(&self.http_client)
            .await?;

        Ok(())
    }
}

fn extract_token_data(
    response: oauth2::StandardTokenResponse<
        oauth2::EmptyExtraTokenFields,
        oauth2::basic::BasicTokenType,
    >,
) -> Result<TokenData, anyhow::Error> {
    let access_token = response.access_token().secret().to_owned();
    let refresh_token = response
        .refresh_token()
        .ok_or_else(|| anyhow::anyhow!("missing refresh token"))?
        .secret()
        .to_owned();
    const DEFAULT_EXPIRY: Duration = Duration::from_hours(2);
    let expires = (now_secs() + response.expires_in().unwrap_or(DEFAULT_EXPIRY).as_secs()) * 1000;

    Ok(TokenData {
        expires,
        refresh_token,
        access_token,
    })
}

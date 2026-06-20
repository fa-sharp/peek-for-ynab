//! Application state

use std::{ops::Deref, sync::Arc};

use axum::extract::FromRef;
use axum_plugin::{AppState, TypeMap};

use crate::{
    config::AppConfig,
    plugins::{crypto::CryptoService, oauth::OauthService},
};

/// App state stored in the Axum router
#[derive(Clone)]
pub struct AppState(Arc<AppStateInner>);

#[derive(AppState)]
pub struct AppStateInner {
    pub config: AppConfig,
    pub crypto: CryptoService,
    pub oauth: OauthService,
    pub cookie_key: axum_extra::extract::cookie::Key,
}

impl Deref for AppState {
    type Target = AppStateInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl TryFrom<TypeMap> for AppState {
    type Error = anyhow::Error;

    fn try_from(map: TypeMap) -> Result<Self, Self::Error> {
        Ok(Self(Arc::new(AppStateInner::try_from(map)?)))
    }
}

impl FromRef<AppState> for axum_extra::extract::cookie::Key {
    fn from_ref(input: &AppState) -> Self {
        input.cookie_key.clone()
    }
}

use axum::http::{StatusCode, header};
use axum_test::TestServer;
use peek_server::create_app;

#[tokio::test]
async fn should_start() {
    let app = create_app().await.unwrap();
    let server = TestServer::new(app.router());
    assert!(server.is_running());
}

#[tokio::test]
async fn serves_static_website() {
    let app = create_app().await.unwrap();
    let server = TestServer::new(app.router());

    for path in ["/", "/help/", "/releases/", "/privacy/"] {
        let response = server.get(path).await;
        assert_eq!(response.status_code(), StatusCode::OK, "GET {path}");
        assert_eq!(response.content_type(), "text/html");
    }
}

#[tokio::test]
async fn api_cors_headers() {
    let app = create_app().await.unwrap();
    let server = TestServer::new(app.router());

    let allowed_origin = app
        .state()
        .config
        .allowed_origins
        .as_ref()
        .and_then(|origins| origins.first().map(|o| o.as_str()));
    let request_origin = allowed_origin.unwrap_or("http://random");

    for path in ["/api/token", "/api/token/logout"] {
        let response = server
            .post(path)
            .add_header(header::ORIGIN, request_origin)
            .await;
        assert_eq!(
            response.header(header::ACCESS_CONTROL_ALLOW_ORIGIN),
            allowed_origin.unwrap_or("*")
        );
    }

    for path in ["/", "/help/"] {
        let response = server
            .get(path)
            .add_header(header::ORIGIN, request_origin)
            .await;
        assert_eq!(
            response.maybe_header(header::ACCESS_CONTROL_ALLOW_ORIGIN),
            None
        );
    }
}

use std::time::SystemTime;

/// Current unix time in millis
pub fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("invalid system time")
        .as_millis() as u64
}

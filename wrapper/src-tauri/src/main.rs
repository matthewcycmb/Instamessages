// Desktop entry point. Mobile enters through lib.rs (tauri::mobile_entry_point).

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    instamessages_wrapper_lib::run();
}

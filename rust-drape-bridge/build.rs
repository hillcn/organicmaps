#!/usr/bin/env rustfmt

use std::env;
use std::path::PathBuf;

fn main() {
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();

    cbindgen::Builder::new()
        .with_crate(&crate_dir)
        .with_parse_include(&["src/bindings.rs"])
        .with_language(cbindgen::Language::C)
        .with_namespace("drape")
        .with_include_guard("DRAPE_BRIDGE_H_")
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file(PathBuf::from(&crate_dir).join("include/drape_bridge.h"));

    println!("cargo:rerun-if-changed=src/lib.rs");
}

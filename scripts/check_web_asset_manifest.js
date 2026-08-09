#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WEB_ROOT = path.join(ROOT, "docs", "public", "webserver");
const DEVICE_MANIFEST_PATH = path.join(ROOT, "devices", "manifest.json");

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectedProfiles() {
  return Object.keys(readJson(DEVICE_MANIFEST_PATH).devices);
}

function verifyManifest(webRoot) {
  const manifestPath = path.join(webRoot, "web-assets.json");
  assert(fs.existsSync(manifestPath), "web asset manifest is missing");
  const manifest = readJson(manifestPath);
  assert(manifest.schemaVersion === 1, "web asset manifest schema version must be 1");
  assert(Array.isArray(manifest.bundles) && manifest.bundles.length === 1,
    "web asset manifest must declare one current bundle");

  const bundle = manifest.bundles[0];
  assert(typeof bundle.id === "string" && /^[a-f0-9]{64}$/.test(bundle.id),
    "web bundle id must be a SHA-256 digest");
  assert(bundle.sha256 === bundle.id, "web bundle digest must match its id");
  assert(bundle.path === `bundles/${bundle.id}/www.js`,
    "web bundle path must be content-addressed");
  assert(Array.isArray(bundle.deviceProfiles), "web bundle must declare device profiles");
  assert(JSON.stringify(bundle.deviceProfiles) === JSON.stringify(expectedProfiles()),
    "web bundle device profiles must match the device manifest");

  const bundlePath = path.join(webRoot, bundle.path);
  assert(fs.existsSync(bundlePath), "content-addressed web bundle is missing");
  const contents = fs.readFileSync(bundlePath);
  assert(sha256(contents) === bundle.sha256, "web bundle content does not match manifest digest");
  assert(fs.readFileSync(path.join(webRoot, "www.js"), "utf8") === contents.toString("utf8"),
    "current shared bundle must match the immutable bundle content");
}

verifyManifest(WEB_ROOT);
console.log("Web asset manifest checks passed.");

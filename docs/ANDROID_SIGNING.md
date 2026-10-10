# Android signing

The `Android APK` workflow signs the APK with a key that only you hold. Android
only installs an update over an existing app when both are signed with the same
key, so create the keystore once and keep it for the life of the app.

## 1. Create the keystore (once)

Run this outside the repo. Pick one of the two ways; both give the same kind of file.

**With a JDK** (`keytool` ships with it):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore classeuri-release.jks -alias classeuri -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Classeuri"
```

**Without a JDK**, with the `openssl` that ships with macOS and Linux:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 10000 -subj "/CN=Classeuri" -keyout classeuri-key.pem -out classeuri-cert.pem
```

```bash
openssl pkcs12 -export -inkey classeuri-key.pem -in classeuri-cert.pem -name classeuri -out classeuri-release.jks
```

```bash
rm classeuri-key.pem classeuri-cert.pem
```

Either way you are asked for a password. The keystore password and the key
password are the same.

Back up `classeuri-release.jks` and the password somewhere safe (password
manager, private drive). **If you lose them, new versions can no longer update
the installed app**: you would have to uninstall it and lose its downloads.
Never commit the keystore; `.gitignore` already blocks `*.jks`.

## 2. Add the GitHub secrets (once)

From the repo folder, with the GitHub CLI:

```bash
base64 < classeuri-release.jks | gh secret set ANDROID_KEYSTORE_BASE64
```

```bash
gh secret set ANDROID_KEYSTORE_PASSWORD
```

```bash
gh secret set ANDROID_KEY_PASSWORD
```

```bash
gh secret set ANDROID_KEY_ALIAS --body classeuri
```

`gh secret set NAME` without `--body` prompts for the value, so the password
never lands in your shell history. Enter the same password for both.

Or in the browser: repo → Settings → Secrets and variables → Actions → New
repository secret.

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the keystore file, base64-encoded |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_PASSWORD` | key password (same as above with PKCS12) |
| `ANDROID_KEY_ALIAS` | `classeuri` |

## 3. Release a version

1. Bump `"version"` in `app/package.json` (e.g. `1.0.0` → `1.0.1`).
2. Optional: write French notes in `app/release-notes/v1.0.1.md`. Without that
   file the notes list the commit messages that touched `app/` and `shared/`.
3. Push to `main`.

The workflow builds the APK, signs it, and publishes the release `v1.0.1` with
`classeuri-1.0.1.apk` attached. A push that changes app code without bumping
the version still builds an APK, available for 30 days under the workflow run's
artifacts, but publishes no release.

Until the four secrets exist, every build produces a test APK signed with the
debug key (`classeuri-X.Y.Z-test.apk`, under the run's artifacts) and no
release. A test APK must be uninstalled before a real release can be installed.

Pushing PDFs never triggers this workflow.
